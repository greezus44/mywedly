/*
# Per-link group routing for Open RSVP Links

## Summary
Allows multiple open RSVP links to target the SAME sub-event, with each link
routing its registrants into a DIFFERENT guest group. For example, two links
for the "Akad" event: one sends guests to "Groom's Side", the other to
"Bride's Side". Existing links without a group_id keep the old behavior
(auto-created "Open Link RSVP" group).

## 1. Schema changes
- `open_rsvp_links.group_id` (uuid, nullable) — references guest_groups(id)
  ON DELETE SET NULL. When set, all guests registering through this link
  are placed in this group instead of the default "Open Link RSVP" group.

## 2. RPC changes
- `open_rsvp_register` updated to accept/use the link's group_id:
  - If `v_link.group_id` is not null, use it directly as the group.
  - Otherwise fall back to the existing find-or-create "Open Link RSVP" behavior.
- The lookup function already returns `link.*` (to_jsonb(l.*)), so the
  group_id is automatically exposed to the frontend with no change needed.

## 3. Security
- No new RLS policies needed: the owner policies on open_rsvp_links already
  cover the new column (row-level, not column-level).
- guest_groups is already owner-scoped, so only the event owner can pick a
  group_id they own.
- The FK is ON DELETE SET NULL so deleting a group does not break links.
*/

ALTER TABLE open_rsvp_links
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES guest_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_open_rsvp_links_group_id ON open_rsvp_links(group_id);

-- ---------------------------------------------------------------------------
-- Replace open_rsvp_register to honor the link's group_id.
-- Signature stays the same so existing callers are unaffected.
-- ---------------------------------------------------------------------------
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
  v_plus_one_id uuid;
  v_clean_name text;
  v_clean_plus_one text;
  v_norm_status text;
  v_username text;
  v_existing guest_event_invites%ROWTYPE;
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

  -- Validate +1: only if allowed and attending.
  v_clean_plus_one := btrim(regexp_replace(coalesce(p_plus_one_name, ''), '\s+', ' ', 'g'));
  IF v_norm_status = 'declined' OR NOT v_link.allow_plus_one THEN
    v_clean_plus_one := '';
  END IF;
  IF v_clean_plus_one <> '' AND length(v_clean_plus_one) > 200 THEN
    RETURN jsonb_build_object('error', 'invalid_plus_one_name');
  END IF;

  SELECT * INTO v_event FROM user_events WHERE id = v_link.event_id LIMIT 1;
  SELECT * INTO v_sub_event FROM sub_events WHERE id = v_link.sub_event_id LIMIT 1;

  -- Determine the group for this link's registrants.
  IF v_link.group_id IS NOT NULL THEN
    -- Use the group specified on the link (verify it belongs to this event).
    SELECT id INTO v_group_id FROM guest_groups
    WHERE id = v_link.group_id AND event_id = v_link.event_id LIMIT 1;
  END IF;

  IF v_group_id IS NULL THEN
    -- Fallback: find or create the "Open Link RSVP" group for this event.
    SELECT id INTO v_group_id FROM guest_groups
    WHERE event_id = v_link.event_id AND name = 'Open Link RSVP' LIMIT 1;
    IF v_group_id IS NULL THEN
      INSERT INTO guest_groups (event_id, name, sort_order)
      VALUES (v_link.event_id, 'Open Link RSVP', 9999)
      RETURNING id INTO v_group_id;
    END IF;
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
  ELSE
    -- Move existing guest into this link's group so re-registrations sort correctly.
    UPDATE event_guests SET group_id = v_group_id WHERE id = v_guest_id;
  END IF;

  -- Ensure invite row for the sub-event (idempotent).
  SELECT * INTO v_existing FROM guest_event_invites
  WHERE guest_id = v_guest_id AND event_id = v_link.event_id AND sub_event_id = v_link.sub_event_id LIMIT 1;
  IF NOT found THEN
    INSERT INTO guest_event_invites (guest_id, event_id, sub_event_id, invite_type)
    VALUES (v_guest_id, v_link.event_id, v_link.sub_event_id, 'include');
  END IF;

  -- Record the RSVP for the primary guest.
  INSERT INTO event_rsvps (event_id, guest_id, guest_name, status, plus_ones, sub_event_id, responded_at)
  VALUES (v_link.event_id, v_guest_id, v_clean_name, v_norm_status,
          CASE WHEN v_clean_plus_one <> '' THEN 1 ELSE 0 END, v_link.sub_event_id, now())
  ON CONFLICT DO NOTHING;

  -- Update guest rsvp_status for convenience.
  UPDATE event_guests SET rsvp_status = v_norm_status, rsvp_submitted_at = now(),
    plus_ones = CASE WHEN v_clean_plus_one <> '' THEN 1 ELSE 0 END
  WHERE id = v_guest_id;

  -- Create the +1 as a separate guest, same group, same single sub-event.
  IF v_clean_plus_one <> '' THEN
    SELECT g.id INTO v_plus_one_id
    FROM event_guests g
    WHERE g.event_id = v_link.event_id AND lower(g.name) = lower(v_clean_plus_one)
    LIMIT 1;

    IF v_plus_one_id IS NULL THEN
      INSERT INTO event_guests (event_id, name, username, token, rsvp_status, plus_ones, group_id, allow_plus_one)
      VALUES (v_link.event_id, v_clean_plus_one, lower(regexp_replace(v_clean_plus_one, '[^a-zA-Z0-9]+', '', 'g')),
              gen_random_uuid()::text, 'attending', 0, v_group_id, false)
      RETURNING id INTO v_plus_one_id;
    ELSE
      UPDATE event_guests SET group_id = v_group_id WHERE id = v_plus_one_id;
    END IF;

    SELECT * INTO v_existing FROM guest_event_invites
    WHERE guest_id = v_plus_one_id AND event_id = v_link.event_id AND sub_event_id = v_link.sub_event_id LIMIT 1;
    IF NOT found THEN
      INSERT INTO guest_event_invites (guest_id, event_id, sub_event_id, invite_type)
      VALUES (v_plus_one_id, v_link.event_id, v_link.sub_event_id, 'include');
    END IF;

    INSERT INTO event_rsvps (event_id, guest_id, guest_name, status, plus_ones, sub_event_id, responded_at)
    VALUES (v_link.event_id, v_plus_one_id, v_clean_plus_one, 'attending', 0, v_link.sub_event_id, now())
    ON CONFLICT DO NOTHING;

    UPDATE event_guests SET rsvp_status = 'attending', rsvp_submitted_at = now()
    WHERE id = v_plus_one_id;
  END IF;

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
