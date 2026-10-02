-- F4/F5/F14/F15: RSVPs are no longer readable or writable directly by guests.
DROP POLICY IF EXISTS guest_read_event_rsvp ON public.event_rsvps;
DROP POLICY IF EXISTS guest_insert_event_rsvp ON public.event_rsvps;
DROP POLICY IF EXISTS guest_update_event_rsvp ON public.event_rsvps;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.event_rsvps FROM anon;

-- A guest reads only their own responses.
CREATE OR REPLACE FUNCTION public.guest_list_rsvps(p_guest_id uuid, p_event_id uuid)
RETURNS TABLE(id uuid, event_id uuid, guest_id uuid, guest_name text, status text,
  plus_ones integer, dietary text, message text, answers jsonb,
  submitted_at timestamptz, sub_event_id uuid, plus_one_names text[],
  responded_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT r.id, r.event_id, r.guest_id, r.guest_name, r.status, r.plus_ones,
         r.dietary, r.message, r.answers, r.submitted_at, r.sub_event_id,
         r.plus_one_names, r.responded_at
  FROM event_rsvps r
  JOIN user_events e ON e.id = r.event_id
  JOIN event_guests g ON g.id = r.guest_id AND g.event_id = r.event_id
  WHERE r.guest_id = p_guest_id
    AND r.event_id = p_event_id
    AND e.is_published = true;
$$;

-- A guest submits only their own response, and the server decides the guest name,
-- enforces the RSVP deadline and bounds the plus-one count.
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
    -- the guest must actually be invited to this sub-event
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

  RETURN v_existing;
END;
$$;

REVOKE ALL ON FUNCTION public.guest_list_rsvps(uuid, uuid) FROM public;
REVOKE ALL ON FUNCTION public.guest_submit_rsvp(uuid, uuid, uuid, text, integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.guest_list_rsvps(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guest_submit_rsvp(uuid, uuid, uuid, text, integer, text) TO anon, authenticated;
