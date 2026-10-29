/*
# Optional phone number: track Open RSVP origin and let self-registered guests manage their number

1. New column
- `event_guests.open_rsvp_link_id` (uuid, nullable): the Open RSVP link a guest registered through.
  Null for guests the host added by hand. Set to null automatically if that link is deleted.

2. Changed functions
- `open_rsvp_register` records `open_rsvp_link_id` on every new guest it creates. Otherwise unchanged:
  the phone number is saved only for new guests, a blank phone is accepted, an invalid phone returns `invalid_phone`.
- `guest_phone_settings(p_guest_id, p_event_id)` (new): for a guest who registered through an Open RSVP link,
  returns whether the phone question is switched on for that link, its wording, and the guest's current number.
  Returns `{"registered": false}` for every other guest.
- `guest_set_phone(p_guest_id, p_event_id, p_phone)` (new): lets a guest add, change or clear their own number.
  Allowed only when the guest registered through an Open RSVP link whose phone question is switched on, and only
  while the guest's RSVP is attending. A blank value clears the number. Non-blank values must contain only digits,
  spaces, +, -, (, ) and be at most 30 characters.

3. Security
- Both new guest functions are SECURITY DEFINER with a pinned search_path, act only on the guest id supplied,
  and are executable by anon and authenticated (the same roles as guest_submit_rsvp).
- PUBLIC is revoked first on each function.
- No table policies change.

4. Notes
- Guests who registered before this migration have no recorded link, so they are not flagged as Open RSVP guests.
*/

ALTER TABLE public.event_guests ADD COLUMN IF NOT EXISTS open_rsvp_link_id uuid REFERENCES public.open_rsvp_links(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS event_guests_open_rsvp_link_id_idx ON public.event_guests (open_rsvp_link_id);

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
    INSERT INTO event_guests (event_id, name, username, token, rsvp_status, plus_ones, group_id, allow_plus_one, phone, open_rsvp_link_id)
    VALUES (v_link.event_id, v_clean_name, v_username, gen_random_uuid()::text, 'pending', 0, v_group_id, v_link.allow_plus_one, v_clean_phone, v_link.id)
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

CREATE OR REPLACE FUNCTION public.guest_phone_settings(p_guest_id uuid, p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_guest event_guests%ROWTYPE;
  v_link open_rsvp_links%ROWTYPE;
BEGIN
  SELECT g.* INTO v_guest
  FROM event_guests g
  JOIN user_events e ON e.id = g.event_id
  WHERE g.id = p_guest_id AND g.event_id = p_event_id AND e.is_published = true;

  IF NOT found OR v_guest.open_rsvp_link_id IS NULL THEN
    RETURN jsonb_build_object('registered', false);
  END IF;

  SELECT * INTO v_link FROM open_rsvp_links WHERE id = v_guest.open_rsvp_link_id;
  IF NOT found THEN
    RETURN jsonb_build_object('registered', false);
  END IF;

  RETURN jsonb_build_object(
    'registered', true,
    'enabled', coalesce((v_link.page_config ->> 'phoneEnabled')::boolean, false),
    'question', v_link.page_config ->> 'phoneQuestion',
    'questionBm', v_link.page_config ->> 'phoneQuestionBm',
    'helper', v_link.page_config ->> 'phoneHelper',
    'helperBm', v_link.page_config ->> 'phoneHelperBm',
    'status', v_guest.rsvp_status,
    'phone', v_guest.phone
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.guest_set_phone(p_guest_id uuid, p_event_id uuid, p_phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_guest event_guests%ROWTYPE;
  v_link open_rsvp_links%ROWTYPE;
  v_clean_phone text;
BEGIN
  SELECT g.* INTO v_guest
  FROM event_guests g
  JOIN user_events e ON e.id = g.event_id
  WHERE g.id = p_guest_id AND g.event_id = p_event_id AND e.is_published = true;

  IF NOT found OR v_guest.open_rsvp_link_id IS NULL THEN
    RAISE EXCEPTION 'rsvp_not_allowed';
  END IF;

  SELECT * INTO v_link FROM open_rsvp_links WHERE id = v_guest.open_rsvp_link_id;
  IF NOT found OR coalesce((v_link.page_config ->> 'phoneEnabled')::boolean, false) = false THEN
    RAISE EXCEPTION 'phone_disabled';
  END IF;

  IF v_guest.rsvp_status IS DISTINCT FROM 'attending' THEN
    RAISE EXCEPTION 'rsvp_not_allowed';
  END IF;

  v_clean_phone := NULLIF(btrim(coalesce(p_phone, '')), '');
  IF v_clean_phone IS NOT NULL AND (length(v_clean_phone) > 30 OR v_clean_phone !~ '^[0-9+()\- ]+$') THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;

  UPDATE event_guests SET phone = v_clean_phone WHERE id = p_guest_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.open_rsvp_register(text, text, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_rsvp_register(text, text, text, integer, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.guest_phone_settings(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guest_phone_settings(uuid, uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.guest_set_phone(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guest_set_phone(uuid, uuid, text) TO anon, authenticated;
