-- Harden guest-facing SECURITY DEFINER functions:
-- 1. Revoke EXECUTE from PUBLIC so only anon/authenticated can call them
-- 2. Add is_published authorization checks inside guest_events and guest_rsvp
-- 3. Re-affirm targeted grants

-- ── guest_signin ──
REVOKE ALL ON FUNCTION public.guest_signin(text, text) FROM PUBLIC;
-- (already granted to anon, authenticated in prior migration; re-affirm)
GRANT EXECUTE ON FUNCTION public.guest_signin(text, text) TO anon, authenticated;

-- ── guest_events: add published-wedding check ──
CREATE OR REPLACE FUNCTION public.guest_events(p_guest_id uuid)
RETURNS TABLE(
  id uuid, name text, starts_at timestamptz,
  venue_name text, venue_address text, dress_code text, notes text,
  rsvp_status text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g RECORD; w_is_published boolean;
BEGIN
  SELECT gs.id, gs.wedding_id INTO g FROM public.guests gs WHERE gs.id = p_guest_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Authorization: only expose events for published weddings
  SELECT is_published INTO w_is_published FROM public.weddings WHERE id = g.wedding_id;
  IF NOT FOUND OR NOT w_is_published THEN RETURN; END IF;

  RETURN QUERY
  SELECT e.id, e.name, e.starts_at, e.venue_name, e.venue_address, e.dress_code, e.notes,
         r.status::text
  FROM public.events e
  LEFT JOIN public.rsvps r ON r.event_id = e.id AND r.guest_id = g.id
  WHERE e.wedding_id = g.wedding_id
    AND private.guest_invited_to_event(g.id, e.id)
  ORDER BY e.starts_at NULLS LAST;
END;
$$;
REVOKE ALL ON FUNCTION public.guest_events(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guest_events(uuid) TO anon, authenticated;

-- ── guest_rsvp: add published-wedding check ──
CREATE OR REPLACE FUNCTION public.guest_rsvp(p_guest_id uuid, p_event_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g RECORD; w_is_published boolean;
BEGIN
  IF p_status NOT IN ('accepted','declined','tentative','pending') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  SELECT gs.id, gs.wedding_id, gs.full_name INTO g
    FROM public.guests gs WHERE gs.id = p_guest_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Guest not found'; END IF;

  -- Authorization: only allow RSVPs for published weddings
  SELECT is_published INTO w_is_published FROM public.weddings WHERE id = g.wedding_id;
  IF NOT FOUND OR NOT w_is_published THEN RAISE EXCEPTION 'Wedding not found or not published'; END IF;

  IF NOT private.guest_invited_to_event(g.id, p_event_id) THEN
    RAISE EXCEPTION 'Not invited to this event';
  END IF;
  INSERT INTO public.rsvps(wedding_id, event_id, guest_id, guest_name, status)
    VALUES (g.wedding_id, p_event_id, g.id, g.full_name, p_status)
  ON CONFLICT (wedding_id, event_id, guest_id) DO UPDATE
    SET status = EXCLUDED.status, updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.guest_rsvp(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guest_rsvp(uuid, uuid, text) TO anon, authenticated;
