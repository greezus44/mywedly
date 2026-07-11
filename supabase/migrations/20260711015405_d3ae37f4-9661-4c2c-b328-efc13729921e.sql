
-- Helper: check whether a guest is invited to an event (direct or via group)
CREATE OR REPLACE FUNCTION private.guest_invited_to_event(_guest_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.guest_event_invites WHERE guest_id = _guest_id AND event_id = _event_id
  ) OR EXISTS (
    SELECT 1 FROM public.guests g
    JOIN public.group_event_invites gei ON gei.group_id = g.group_id
    WHERE g.id = _guest_id AND gei.event_id = _event_id
  );
$$;

-- Helper: verify a password payload against a wedding + guest
CREATE OR REPLACE FUNCTION private.verify_guest_password(_wedding_id uuid, _guest_id uuid, _password text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE mode text; shared_pw text; guest_code text;
BEGIN
  SELECT password_mode, guest_password INTO mode, shared_pw
  FROM public.weddings WHERE id = _wedding_id;
  IF mode IS NULL THEN RETURN false; END IF;
  IF mode = 'none' THEN RETURN true; END IF;
  IF mode = 'shared' THEN
    RETURN shared_pw IS NOT NULL AND _password = shared_pw;
  END IF;
  -- per_guest
  SELECT access_code INTO guest_code FROM public.guests WHERE id = _guest_id;
  RETURN guest_code IS NOT NULL AND _password = guest_code;
END;
$$;

-- Public RPC: sign in a guest by name + password
CREATE OR REPLACE FUNCTION public.guest_signin(p_slug text, p_name text, p_password text)
RETURNS TABLE(guest_id uuid, wedding_id uuid, full_name text, group_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE w RECORD; g RECORD; new_id uuid;
BEGIN
  SELECT id, password_mode, guest_password, is_published INTO w
  FROM public.weddings WHERE slug = p_slug;
  IF NOT FOUND OR NOT w.is_published THEN RETURN; END IF;

  IF w.password_mode = 'shared' THEN
    IF w.guest_password IS NULL OR p_password <> w.guest_password THEN RETURN; END IF;
    SELECT * INTO g FROM public.guests
      WHERE wedding_id = w.id AND lower(full_name) = lower(trim(p_name)) LIMIT 1;
    IF NOT FOUND THEN
      INSERT INTO public.guests(wedding_id, full_name)
        VALUES (w.id, trim(p_name)) RETURNING id INTO new_id;
      SELECT * INTO g FROM public.guests WHERE id = new_id;
    END IF;
  ELSIF w.password_mode = 'per_guest' THEN
    SELECT * INTO g FROM public.guests
      WHERE wedding_id = w.id
        AND lower(full_name) = lower(trim(p_name))
        AND access_code IS NOT NULL AND access_code = p_password
      LIMIT 1;
    IF NOT FOUND THEN RETURN; END IF;
  ELSE  -- none
    SELECT * INTO g FROM public.guests
      WHERE wedding_id = w.id AND lower(full_name) = lower(trim(p_name)) LIMIT 1;
    IF NOT FOUND THEN
      INSERT INTO public.guests(wedding_id, full_name)
        VALUES (w.id, trim(p_name)) RETURNING id INTO new_id;
      SELECT * INTO g FROM public.guests WHERE id = new_id;
    END IF;
  END IF;

  guest_id := g.id; wedding_id := w.id; full_name := g.full_name; group_id := g.group_id;
  RETURN NEXT;
END;
$$;

-- Public RPC: submit / update RSVP with re-verification
CREATE OR REPLACE FUNCTION public.guest_rsvp(
  p_guest_id uuid, p_password text, p_event_id uuid, p_status text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE g RECORD;
BEGIN
  IF p_status NOT IN ('accepted','declined','tentative','pending') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  SELECT * INTO g FROM public.guests WHERE id = p_guest_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Guest not found'; END IF;
  IF NOT private.verify_guest_password(g.wedding_id, g.id, p_password) THEN
    RAISE EXCEPTION 'Invalid password';
  END IF;
  IF NOT private.guest_invited_to_event(g.id, p_event_id) THEN
    RAISE EXCEPTION 'Not invited to this event';
  END IF;

  INSERT INTO public.rsvps(wedding_id, event_id, guest_id, guest_name, status)
    VALUES (g.wedding_id, p_event_id, g.id, g.full_name, p_status)
  ON CONFLICT (wedding_id, event_id, guest_id) DO UPDATE
    SET status = EXCLUDED.status, updated_at = now();
END;
$$;

-- Ensure the ON CONFLICT target exists
CREATE UNIQUE INDEX IF NOT EXISTS rsvps_unique_guest_event
  ON public.rsvps(wedding_id, event_id, guest_id)
  WHERE guest_id IS NOT NULL AND event_id IS NOT NULL;

-- Public RPC: list events a guest is invited to (with their current RSVP status)
CREATE OR REPLACE FUNCTION public.guest_events(p_guest_id uuid, p_password text)
RETURNS TABLE(
  id uuid, name text, starts_at timestamptz,
  venue_name text, venue_address text, dress_code text, notes text,
  rsvp_status text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE g RECORD;
BEGIN
  SELECT * INTO g FROM public.guests WHERE id = p_guest_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF NOT private.verify_guest_password(g.wedding_id, g.id, p_password) THEN RETURN; END IF;

  RETURN QUERY
  SELECT e.id, e.name, e.starts_at, e.venue_name, e.venue_address, e.dress_code, e.notes,
         r.status::text AS rsvp_status
  FROM public.events e
  LEFT JOIN public.rsvps r
    ON r.event_id = e.id AND r.guest_id = g.id
  WHERE e.wedding_id = g.wedding_id
    AND private.guest_invited_to_event(g.id, e.id)
  ORDER BY e.starts_at NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.guest_signin(text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guest_rsvp(uuid,text,uuid,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guest_events(uuid,text) TO anon, authenticated;
