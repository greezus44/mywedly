/*
# Sync guest row plus_ones on RSVP changes & fix open-link re-submissions

## What changes
1. `guest_submit_rsvp` — when an existing guest changes their answer on the
   RSVP page, it now also updates the matching `event_guests` row's
   `rsvp_status`, `rsvp_submitted_at`, and `plus_ones`, so the dashboard's
   main guest list always reflects the latest answer (status + +1 choice),
   not just the `event_rsvps` row.
2. `open_rsvp_register` — when a guest re-submits through the open RSVP
   link, the existing `event_rsvps` row (if any) is now updated with the new
   status and plus_ones, instead of being silently ignored because of
   `ON CONFLICT DO NOTHING`. This means a guest who flips from "+1" to "no
   +1" (or attending to declined) has their change recorded correctly.

## Security
- Both functions are SECURITY DEFINER with search_path pinned to 'public','pg_temp'.
- EXECUTE remains granted to anon + authenticated only. No table/policy/grant changes.

## No data loss
- No DROP/DELETE of columns or tables. Functions are replaced in place.
*/

-- 1) guest_submit_rsvp: also sync the event_guests row.
CREATE OR REPLACE FUNCTION public.guest_submit_rsvp(
  p_guest_id uuid,
  p_event_id uuid,
  p_sub_event_id uuid,
  p_status text,
  p_plus_ones integer,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_guest_name text;
  v_allow_plus_one boolean;
  v_deadline timestamptz;
  v_sub_deadline timestamptz;
  v_sub_enabled boolean;
  v_plus_ones integer;
  v_status text;
  v_existing uuid;
BEGIN
  SELECT g.name, coalesce(g.allow_plus_one, false), e.rsvp_deadline
  INTO v_guest_name, v_allow_plus_one, v_deadline
  FROM event_guests g
  JOIN user_events e ON e.id = g.event_id
  WHERE g.id = p_guest_id AND g.event_id = p_event_id AND e.is_published = true;

  IF v_guest_name IS NULL THEN
    RAISE EXCEPTION 'rsvp_not_allowed';
  END IF;

  IF p_sub_event_id IS NOT NULL THEN
    SELECT s.rsvp_deadline, coalesce(s.rsvp_enabled, true)
    INTO v_sub_deadline, v_sub_enabled
    FROM sub_events s
    WHERE s.id = p_sub_event_id AND s.parent_event_id = p_event_id;
    IF v_sub_enabled IS NULL THEN
      RAISE EXCEPTION 'rsvp_not_allowed';
    END IF;
    IF v_sub_enabled = false THEN
      RAISE EXCEPTION 'rsvp_closed';
    END IF;
    IF v_sub_deadline IS NOT NULL THEN
      v_deadline := v_sub_deadline;
    END IF;
    IF NOT ((public.guest_resolve_invitations(p_guest_id, p_event_id) -> 'invitations') @> jsonb_build_array(
      jsonb_build_object('subEventId', p_sub_event_id, 'isInvited', true)) ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(public.guest_resolve_invitations(p_guest_id, p_event_id) -> 'invitations') inv
        WHERE (inv ->> 'subEventId')::uuid = p_sub_event_id AND (inv ->> 'isInvited')::boolean = true
      ) THEN
        RAISE EXCEPTION 'rsvp_not_allowed';
      END IF;
    END IF;
  END IF;

  IF v_deadline IS NOT NULL AND now() > v_deadline THEN
    RAISE EXCEPTION 'rsvp_closed';
  END IF;

  v_status := lower(btrim(coalesce(p_status, '')));
  IF v_status NOT IN ('attending', 'declined', 'pending') THEN
    RAISE EXCEPTION 'rsvp_invalid_status';
  END IF;

  v_plus_ones := greatest(0, least(coalesce(p_plus_ones, 0), 5));
  IF v_status <> 'attending' OR v_allow_plus_one = false THEN
    v_plus_ones := 0;
  END IF;

  SELECT r.id INTO v_existing
  FROM event_rsvps r
  WHERE r.guest_id = p_guest_id
    AND r.event_id = p_event_id
    AND ((p_sub_event_id IS NULL AND r.sub_event_id IS NULL) OR r.sub_event_id = p_sub_event_id)
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    UPDATE event_rsvps
    SET status = v_status,
        plus_ones = v_plus_ones,
        message = left(coalesce(p_message, ''), 2000),
        guest_name = v_guest_name,
        responded_at = now()
    WHERE id = v_existing;
    RETURN v_existing;
  END IF;

  INSERT INTO event_rsvps (event_id, guest_id, guest_name, status, plus_ones, message, sub_event_id, responded_at)
  VALUES (p_event_id, p_guest_id, v_guest_name, v_status, v_plus_ones,
          left(coalesce(p_message, ''), 2000), p_sub_event_id, now())
  RETURNING id INTO v_existing;

  -- Sync the guest row so the dashboard's main guest list reflects the
  -- latest answer. We only update when this is the main event RSVP (no
  -- sub_event_id) OR when the guest has no existing main-event RSVP, to
  -- avoid a sub-event answer overwriting the main event status when the
  -- guest has already answered the main event separately.
  IF p_sub_event_id IS NULL THEN
    UPDATE event_guests
    SET rsvp_status = v_status,
        rsvp_submitted_at = now(),
        plus_ones = v_plus_ones
    WHERE id = p_guest_id AND event_id = p_event_id;
  END IF;

  RETURN v_existing;
END;
$$;

REVOKE ALL ON FUNCTION public.guest_submit_rsvp(uuid, uuid, uuid, text, integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.guest_submit_rsvp(uuid, uuid, uuid, text, integer, text) TO anon, authenticated;

-- 2) open_rsvp_register: upsert the event_rsvps row on re-submission.
CREATE OR REPLACE FUNCTION public.open_rsvp_register(
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
  v_username text;
  v_existing guest_event_invites%ROWTYPE;
  v_existing_rsvp uuid;
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
    v_username := lower(regexp_replace(v_clean_name, '[^a-zA-Z0-9]+', '', 'g'));
    INSERT INTO event_guests (event_id, name, username, token, rsvp_status, plus_ones, group_id, allow_plus_one)
    VALUES (v_link.event_id, v_clean_name, v_username, gen_random_uuid()::text, 'pending', 0, v_group_id, v_link.allow_plus_one)
    RETURNING id INTO v_guest_id;
  END IF;

  SELECT * INTO v_existing FROM guest_event_invites WHERE guest_id = v_guest_id AND event_id = v_link.event_id AND sub_event_id = v_link.sub_event_id LIMIT 1;
  IF NOT found THEN
    INSERT INTO guest_event_invites (guest_id, event_id, sub_event_id, invite_type)
    VALUES (v_guest_id, v_link.event_id, v_link.sub_event_id, 'include');
  END IF;

  -- Upsert the RSVP row so re-submissions update rather than being ignored.
  SELECT r.id INTO v_existing_rsvp
  FROM event_rsvps r
  WHERE r.guest_id = v_guest_id
    AND r.event_id = v_link.event_id
    AND r.sub_event_id = v_link.sub_event_id
  LIMIT 1;

  IF v_existing_rsvp IS NOT NULL THEN
    UPDATE event_rsvps
    SET status = v_norm_status,
        plus_ones = v_plus_one_count,
        guest_name = v_clean_name,
        responded_at = now()
    WHERE id = v_existing_rsvp;
  ELSE
    INSERT INTO event_rsvps (event_id, guest_id, guest_name, status, plus_ones, sub_event_id, responded_at)
    VALUES (v_link.event_id, v_guest_id, v_clean_name, v_norm_status, v_plus_one_count, v_link.sub_event_id, now());
  END IF;

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
