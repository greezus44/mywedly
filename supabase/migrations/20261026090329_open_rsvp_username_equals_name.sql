/*
# Open RSVP: use the guest's entered name as their username

## What changes
Previously, when a guest registered through an open RSVP link, the
`open_rsvp_register` function generated a username by lowercasing the
name and stripping non-alphanumeric characters (e.g. "John Smith" became
"johnsmith"). The user wants the username to be exactly the name the
guest typed, so the host sees the real name in the username column and
the guest can sign back in with the name they entered.

## How
- Recreate `open_rsvp_register` with the same signature and behavior.
- When creating a new guest row, set `username = v_clean_name` (the
  trimmed, single-spaced name the guest entered) instead of the
  lowercased alphanumeric-stripped version.
- The guest sign-in lookup already matches case-insensitively
  (`lower(g.username) = lower(p_username)`), so signing back in with the
  entered name works.
- No table/column/policy changes. EXECUTE grants preserved.
*/

DROP FUNCTION IF EXISTS public.open_rsvp_register(text, text, text, integer);

CREATE FUNCTION public.open_rsvp_register(
  p_token text,
  p_name text,
  p_status text,
  p_plus_ones integer
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
  v_existing guest_event_invites%ROWTYPE;
  v_plus_one_count int := 0;
BEGIN
  SELECT l.* INTO v_link
  FROM open_rsvp_links l
  JOIN user_events e ON e.id = l.event_id
  WHERE l.token = p_token AND l.is_enabled = true AND e.is_published = true
  LIMIT 1;

  IF NOT found THEN
    RETURN jsonb_build_object('error', 'link_not_found');
  END IF;

  v_clean_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  IF v_clean_name = '' OR length(v_clean_name) > 200 THEN
    RETURN jsonb_build_object('error', 'invalid_name');
  END IF;

  v_norm_status := lower(btrim(coalesce(p_status, '')));
  IF v_norm_status NOT IN ('attending', 'declined') THEN
    RETURN jsonb_build_object('error', 'invalid_status');
  END IF;

  IF v_norm_status = 'attending' AND v_link.allow_plus_one AND coalesce(p_plus_ones, 0) > 0 THEN
    v_plus_one_count := 1;
  END IF;

  SELECT * INTO v_event FROM user_events WHERE id = v_link.event_id LIMIT 1;
  SELECT * INTO v_sub_event FROM sub_events WHERE id = v_link.sub_event_id LIMIT 1;

  SELECT id INTO v_group_id FROM guest_groups WHERE event_id = v_link.event_id AND name = 'Open Link RSVP' LIMIT 1;
  IF v_group_id IS NULL THEN
    INSERT INTO guest_groups (event_id, name, sort_order)
    VALUES (v_link.event_id, 'Open Link RSVP', 9999)
    RETURNING id INTO v_group_id;
  END IF;

  SELECT g.id INTO v_guest_id
  FROM event_guests g
  WHERE g.event_id = v_link.event_id AND lower(g.name) = lower(v_clean_name)
  LIMIT 1;

  IF v_guest_id IS NULL THEN
    INSERT INTO event_guests (event_id, name, username, token, rsvp_status, plus_ones, group_id, allow_plus_one)
    VALUES (v_link.event_id, v_clean_name, v_clean_name, gen_random_uuid()::text, 'pending', 0, v_group_id, v_link.allow_plus_one)
    RETURNING id INTO v_guest_id;
  END IF;

  SELECT * INTO v_existing FROM guest_event_invites WHERE guest_id = v_guest_id AND event_id = v_link.event_id AND sub_event_id = v_link.sub_event_id LIMIT 1;
  IF NOT found THEN
    INSERT INTO guest_event_invites (guest_id, event_id, sub_event_id, invite_type)
    VALUES (v_guest_id, v_link.event_id, v_link.sub_event_id, 'include');
  END IF;

  INSERT INTO event_rsvps (event_id, guest_id, guest_name, status, plus_ones, sub_event_id, responded_at)
  VALUES (v_link.event_id, v_guest_id, v_clean_name, v_norm_status, v_plus_one_count, v_link.sub_event_id, now())
  ON CONFLICT DO NOTHING;

  UPDATE event_guests SET rsvp_status = v_norm_status, rsvp_submitted_at = now(),
    plus_ones = v_plus_one_count
  WHERE id = v_guest_id;

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

REVOKE ALL ON FUNCTION public.open_rsvp_register(text, text, text, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.open_rsvp_register(text, text, text, integer) TO anon, authenticated;
