/*
# Open RSVP: optional phone number for new self-registered guests

1. Changes
- `open_rsvp_register` gains an optional `p_phone` parameter.
- A phone number is saved only when the guest is brand new (created by this Open RSVP submission) and the phone is non-empty.
- Blank phone values are accepted and stored as null. The RSVP is recorded either way.
- A non-blank phone must contain only digits, spaces, +, -, (, ) and be at most 30 characters; otherwise `invalid_phone` is returned.
- Existing guests (for example guests the host added by hand) never have their phone changed by this function.

2. Security
- The function remains SECURITY DEFINER with a pinned search_path.
- EXECUTE stays revoked from PUBLIC and granted to anon and authenticated only.
- The previous 4-argument signature is dropped so there is exactly one function.

3. Notes
- No table or column is added. `event_guests.phone` already exists.
- All other behaviour (deadlines, duplicate-name protection, group assignment, plus-one handling) is unchanged.
*/

DROP FUNCTION IF EXISTS public.open_rsvp_register(text, text, text, integer);

CREATE OR REPLACE FUNCTION public.open_rsvp_register(
  p_token text,
  p_name text,
  p_status text,
  p_plus_ones integer,
  p_phone text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_link open_rsvp_links%ROWTYPE;
  v_event user_events%ROWTYPE;
  v_sub_event sub_events%ROWTYPE;
  v_group_id uuid;
  v_guest_id uuid;
  v_guest_group_id uuid;
  v_guest_responded_at timestamptz;
  v_clean_name text;
  v_norm_status text;
  v_existing guest_event_invites%ROWTYPE;
  v_plus_one_count int := 0;
  v_username text;
  v_deadline timestamptz;
  v_clean_phone text;
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

  v_clean_phone := NULLIF(btrim(coalesce(p_phone, '')), '');
  IF v_clean_phone IS NOT NULL AND (length(v_clean_phone) > 30 OR v_clean_phone !~ '^[0-9+()\- ]+$') THEN
    RETURN jsonb_build_object('error', 'invalid_phone');
  END IF;
  IF v_norm_status <> 'attending' THEN
    v_clean_phone := NULL;
  END IF;

  IF v_norm_status = 'attending' AND v_link.allow_plus_one AND coalesce(p_plus_ones, 0) > 0 THEN
    v_plus_one_count := 1;
  END IF;

  SELECT * INTO v_event FROM user_events WHERE id = v_link.event_id LIMIT 1;
  SELECT * INTO v_sub_event FROM sub_events WHERE id = v_link.sub_event_id LIMIT 1;

  v_deadline := coalesce(v_sub_event.rsvp_deadline, v_event.rsvp_deadline);
  IF v_deadline IS NOT NULL AND now() > v_deadline THEN
    RETURN jsonb_build_object('error', 'closed');
  END IF;

  IF v_link.group_id IS NOT NULL THEN
    SELECT id INTO v_group_id FROM guest_groups
    WHERE id = v_link.group_id AND event_id = v_link.event_id LIMIT 1;
  END IF;

  IF v_group_id IS NULL THEN
    SELECT id INTO v_group_id FROM guest_groups
    WHERE event_id = v_link.event_id AND is_open_rsvp_default = true LIMIT 1;
    IF v_group_id IS NULL THEN
      SELECT id INTO v_group_id FROM guest_groups
      WHERE event_id = v_link.event_id AND name = 'Open Link RSVP' LIMIT 1;
    END IF;
    IF v_group_id IS NULL THEN
      INSERT INTO guest_groups (event_id, name, sort_order, is_open_rsvp_default)
      VALUES (v_link.event_id, 'Open Link RSVP', 9999, true)
      RETURNING id INTO v_group_id;
    END IF;
  END IF;

  SELECT g.id, g.group_id, g.rsvp_submitted_at
    INTO v_guest_id, v_guest_group_id, v_guest_responded_at
  FROM event_guests g
  WHERE g.event_id = v_link.event_id AND lower(g.name) = lower(v_clean_name)
  LIMIT 1;

  IF v_guest_id IS NULL THEN
    v_username := lower(regexp_replace(v_clean_name, '[^a-zA-Z0-9]+', '', 'g'));
    INSERT INTO event_guests (event_id, name, username, token, rsvp_status, plus_ones, group_id, allow_plus_one, phone)
    VALUES (v_link.event_id, v_clean_name, v_username, gen_random_uuid()::text, 'pending', 0, v_group_id, v_link.allow_plus_one, v_clean_phone)
    RETURNING id INTO v_guest_id;
  ELSE
    IF v_guest_responded_at IS NOT NULL THEN
      RETURN jsonb_build_object('error', 'already_responded');
    END IF;
    IF v_guest_group_id IS NULL THEN
      UPDATE event_guests SET group_id = v_group_id WHERE id = v_guest_id;
    END IF;
  END IF;

  SELECT * INTO v_existing FROM guest_event_invites
  WHERE guest_id = v_guest_id AND event_id = v_link.event_id AND sub_event_id = v_link.sub_event_id LIMIT 1;
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
$function$;

REVOKE EXECUTE ON FUNCTION public.open_rsvp_register(text, text, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_rsvp_register(text, text, text, integer, text) TO anon, authenticated;
