/*
# Renameable default Open RSVP group

## Summary
Lets the host rename the default "Open Link RSVP" guest group without breaking
new registrations. Currently `open_rsvp_register` finds the default group by
searching for the literal name "Open Link RSVP" — so if a host renames it,
the next guest creates a brand-new group with the old name. This migration
adds a boolean flag `is_open_rsvp_default` to `guest_groups` so the function
can find the default group by flag instead of by name, making renames stick.

## 1. Schema changes
- `guest_groups.is_open_rsvp_default` (boolean, NOT NULL, default false) —
  marks the group that open RSVP links fall back to when a link has no
  specific group_id set. At most one group per event can have this flag.

## 2. Backfill
- Set `is_open_rsvp_default = true` on any existing group named exactly
  "Open Link RSVP" so current setups keep working unchanged.

## 3. Index
- Partial unique index on `(event_id) WHERE is_open_rsvp_default = true`
  so each event has at most one default group.

## 4. RPC changes
- `open_rsvp_register` fallback (used when a link has no group_id) now:
  1. Looks for the group flagged `is_open_rsvp_default = true` for this event.
  2. If none found, falls back to searching by name "Open Link RSVP" (covers
     edge cases where the flag wasn't backfilled).
  3. If still none found, creates a new group with the flag set and the name
     "Open Link RSVP".
  This means once a host renames the default group, new registrations
  continue landing in that same renamed group.

## 5. Security
- No new RLS policies needed: the existing owner-scoped policies on
  guest_groups cover the new column (row-level, not column-level).
- The host can update the group name through the existing UPDATE grant.
*/

ALTER TABLE guest_groups
  ADD COLUMN IF NOT EXISTS is_open_rsvp_default boolean NOT NULL DEFAULT false;

-- Backfill: flag existing "Open Link RSVP" groups as the default.
UPDATE guest_groups
SET is_open_rsvp_default = true
WHERE name = 'Open Link RSVP' AND is_open_rsvp_default = false;

-- Ensure only one default group per event.
CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_groups_one_default_per_event
  ON guest_groups (event_id)
  WHERE is_open_rsvp_default = true;

-- ---------------------------------------------------------------------------
-- Replace open_rsvp_register to find the default group by flag, not by name.
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
    -- Fallback: find the default group for this event by flag.
    SELECT id INTO v_group_id FROM guest_groups
    WHERE event_id = v_link.event_id AND is_open_rsvp_default = true LIMIT 1;
    -- If no flagged default, fall back to name search (covers un-backfilled edge cases).
    IF v_group_id IS NULL THEN
      SELECT id INTO v_group_id FROM guest_groups
      WHERE event_id = v_link.event_id AND name = 'Open Link RSVP' LIMIT 1;
    END IF;
    -- If still none, create the default group with the flag set.
    IF v_group_id IS NULL THEN
      INSERT INTO guest_groups (event_id, name, sort_order, is_open_rsvp_default)
      VALUES (v_link.event_id, 'Open Link RSVP', 9999, true)
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
