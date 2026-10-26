/*
# Open RSVP: stop creating a separate +1 guest row

## What changes
Previously, when an open-RSVP link had `allow_plus_one = true` and a guest
submitted a +1 name while attending, `open_rsvp_register` created a second
`event_guests` row for the +1 person (with its own invite and RSVP). The host
then saw two separate names in the guest list.

The +1 should NOT appear as its own guest. Instead, the main guest keeps a
`plus_ones = 1` count so the host list simply shows "+1" next to the main
person's name.

## How
- `open_rsvp_register` is recreated with the same signature
  `(p_token text, p_name text, p_status text, p_plus_one_name text)` so callers
  do not need to change. The `p_plus_one_name` argument is now accepted for
  backward compatibility but no longer used to create a guest row.
- When the guest is attending and the link allows a +1, `plus_ones` is set to 1
  on the main guest (and on the RSVP row). Otherwise it is 0.
- The entire block that inserted a separate +1 guest, invite, and RSVP is
  removed.
- EXECUTE grants are preserved (REVOKE then GRANT to anon + authenticated).
- No tables, columns, or policies are changed. Existing +1 guest rows created by
  the old function remain in the database untouched.
*/

DROP FUNCTION IF EXISTS public.open_rsvp_register(text, text, text, text);

CREATE FUNCTION public.open_rsvp_register(
  p_token text,
  p_name text,
  p_status text,
  p_plus_one_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_link open_rsvp_links%ROWTYPE;
  v_event user_events%ROWTYPE;
  v_sub_event sub_events%ROWTYPE;
  v_group_id uuid;
  v_guest_id uuid;
  v_clean_name text;
  v_norm_status text;
  v_username text;
  v_existing guest_event_invites%ROWTYPE;
  v_plus_one_count int := 0;
BEGIN
  -- Load and validate the link.
  SELECT l.* INTO v_link
  FROM open_rsvp_links l
  JOIN user_events e ON e.id = l.event_id
  WHERE l.token = p_token AND l.is_enabled = true AND e.is_published = true
  LIMIT 1;

  IF NOT found THEN
    RETURN jsonb_build_object('error', 'link_not_found');
  END IF;

  -- Validate name.
  v_clean_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  IF v_clean_name = '' OR length(v_clean_name) > 200 THEN
    RETURN jsonb_build_object('error', 'invalid_name');
  END IF;

  -- Validate status.
  v_norm_status := lower(btrim(coalesce(p_status, '')));
  IF v_norm_status NOT IN ('attending', 'declined') THEN
    RETURN jsonb_build_object('error', 'invalid_status');
  END IF;

  -- +1 is only counted (not named) when attending and the link allows it.
  IF v_norm_status = 'attending' AND v_link.allow_plus_one THEN
    v_plus_one_count := 1;
  END IF;

  SELECT * INTO v_event FROM user_events WHERE id = v_link.event_id LIMIT 1;
  SELECT * INTO v_sub_event FROM sub_events WHERE id = v_link.sub_event_id LIMIT 1;

  -- Find or create the "Open Link RSVP" group for this event.
  SELECT id INTO v_group_id FROM guest_groups WHERE event_id = v_link.event_id AND name = 'Open Link RSVP' LIMIT 1;
  IF v_group_id IS NULL THEN
    INSERT INTO guest_groups (event_id, name, sort_order)
    VALUES (v_link.event_id, 'Open Link RSVP', 9999)
    RETURNING id INTO v_group_id;
  END IF;

  -- Find existing guest with the same name in this event (avoid duplicates).
  SELECT g.id INTO v_guest_id
  FROM event_guests g
  WHERE g.event_id = v_link.event_id AND lower(g.name) = lower(v_clean_name)
  LIMIT 1;

  IF v_guest_id IS NULL THEN
    v_username := lower(regexp_replace(v_clean_name, '[^a-zA-Z0-9]+', '', 'g'));
    INSERT INTO event_guests (event_id, name, username, token, rsvp_status, plus_ones, group_id, allow_plus_one)
    VALUES (v_link.event_id, v_clean_name, v_username, gen_random_uuid()::text, 'pending', 0, v_group_id, v_link.allow_plus_one)
    RETURNING id INTO v_guest_id;
  END IF;

  -- Ensure invite row for the sub-event (idempotent).
  SELECT * INTO v_existing FROM guest_event_invites WHERE guest_id = v_guest_id AND event_id = v_link.event_id AND sub_event_id = v_link.sub_event_id LIMIT 1;
  IF NOT found THEN
    INSERT INTO guest_event_invites (guest_id, event_id, sub_event_id, invite_type)
    VALUES (v_guest_id, v_link.event_id, v_link.sub_event_id, 'include');
  END IF;

  -- Record the RSVP for the primary guest.
  INSERT INTO event_rsvps (event_id, guest_id, guest_name, status, plus_ones, sub_event_id, responded_at)
  VALUES (v_link.event_id, v_guest_id, v_clean_name, v_norm_status, v_plus_one_count, v_link.sub_event_id, now())
  ON CONFLICT DO NOTHING;

  -- Update guest rsvp_status and plus_ones count.
  UPDATE event_guests SET rsvp_status = v_norm_status, rsvp_submitted_at = now(),
    plus_ones = v_plus_one_count
  WHERE id = v_guest_id;

  -- Return a session row for the primary guest (same shape as guest_signin_lookup).
  RETURN jsonb_build_object(
    'error', NULL,
    'guest', jsonb_build_object(
      'id', g.id,
      'event_id', g.event_id,
      'name', g.name,
      'group_name', g.group_name,
      'side', g.side,
      'rsvp_status', g.rsvp_status,
      'rsvp_submitted_at', g.rsvp_submitted_at,
      'plus_ones', g.plus_ones,
      'dietary', g.dietary,
      'message', g.message,
      'created_at', g.created_at,
      'table_number', g.table_number,
      'group_id', g.group_id,
      'allow_plus_one', g.allow_plus_one
    ),
    'event_slug', v_event.slug
  )
  FROM event_guests g
  WHERE g.id = v_guest_id;
END;
$$;

REVOKE ALL ON FUNCTION public.open_rsvp_register(text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.open_rsvp_register(text, text, text, text) TO anon, authenticated;
