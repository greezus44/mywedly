-- Switch guest-facing RPC functions from SECURITY DEFINER to SECURITY INVOKER.
-- This ensures functions execute with the caller's privileges (filtered by RLS)
-- rather than the owner's, eliminating the privilege-escalation surface.
-- RLS policies are added so anon/authenticated can access only what the functions need.

-- ── 1. Grant EXECUTE on private helper to anon/authenticated ──
-- guest_events and guest_rsvp call private.guest_invited_to_event internally.
-- With SECURITY INVOKER, the caller needs execute permission on it.
GRANT EXECUTE ON FUNCTION private.guest_invited_to_event(uuid, uuid) TO anon, authenticated;

-- ── 2. RLS policies for anon on guests ──
-- Allow anon to read guests for published weddings (needed by all 3 functions)
CREATE POLICY "anon read guests for published weddings"
  ON public.guests FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = guests.wedding_id AND w.is_published = true)
  );

-- Allow anon to insert guests for published weddings (guest_signin auto-creates)
CREATE POLICY "anon insert guests for published weddings"
  ON public.guests FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = guests.wedding_id AND w.is_published = true)
  );

-- ── 3. RLS policies for anon on events ──
-- Allow anon to read all events for published weddings (guest_events returns invited events)
CREATE POLICY "anon read events for published weddings"
  ON public.events FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = events.wedding_id AND w.is_published = true)
  );

-- ── 4. RLS policies for anon on rsvps ──
-- Allow anon to read rsvps for published weddings (guest_events LEFT JOINs rsvps)
CREATE POLICY "anon read rsvps for published weddings"
  ON public.rsvps FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = rsvps.wedding_id AND w.is_published = true)
  );

-- Allow anon to update rsvps for published weddings (guest_rsvp ON CONFLICT DO UPDATE)
CREATE POLICY "anon update rsvps for published weddings"
  ON public.rsvps FOR UPDATE TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = rsvps.wedding_id AND w.is_published = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = rsvps.wedding_id AND w.is_published = true)
  );

-- ── 5. Recreate functions as SECURITY INVOKER ──

-- guest_signin: look up or create a guest for a published wedding
CREATE OR REPLACE FUNCTION public.guest_signin(p_slug text, p_name text)
RETURNS TABLE(guest_id uuid, wedding_id uuid, full_name text, group_id uuid)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  w RECORD; g RECORD; new_id uuid;
  v_name text := trim(coalesce(p_name, ''));
BEGIN
  IF v_name = '' THEN RETURN; END IF;
  SELECT id, is_published INTO w FROM public.weddings WHERE slug = p_slug;
  IF NOT FOUND OR NOT w.is_published THEN RETURN; END IF;
  SELECT gs.id, gs.wedding_id, gs.full_name, gs.group_id INTO g
    FROM public.guests gs
    WHERE gs.wedding_id = w.id AND lower(gs.full_name) = lower(v_name) LIMIT 1;
  IF NOT FOUND THEN
    INSERT INTO public.guests(wedding_id, full_name) VALUES (w.id, v_name)
    RETURNING id INTO new_id;
    SELECT gs.id, gs.wedding_id, gs.full_name, gs.group_id INTO g
      FROM public.guests gs WHERE gs.id = new_id;
  END IF;
  guest_id := g.id; wedding_id := g.wedding_id;
  full_name := g.full_name; group_id := g.group_id;
  RETURN NEXT;
END;
$$;
REVOKE ALL ON FUNCTION public.guest_signin(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guest_signin(text, text) TO anon, authenticated;

-- guest_events: list events a guest is invited to (with RSVP status)
CREATE OR REPLACE FUNCTION public.guest_events(p_guest_id uuid)
RETURNS TABLE(
  id uuid, name text, starts_at timestamptz,
  venue_name text, venue_address text, dress_code text, notes text,
  rsvp_status text
)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE g RECORD; w_is_published boolean;
BEGIN
  SELECT gs.id, gs.wedding_id INTO g FROM public.guests gs WHERE gs.id = p_guest_id;
  IF NOT FOUND THEN RETURN; END IF;

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

-- guest_rsvp: submit or update an RSVP
CREATE OR REPLACE FUNCTION public.guest_rsvp(p_guest_id uuid, p_event_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE g RECORD; w_is_published boolean;
BEGIN
  IF p_status NOT IN ('accepted','declined','tentative','pending') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  SELECT gs.id, gs.wedding_id, gs.full_name INTO g
    FROM public.guests gs WHERE gs.id = p_guest_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Guest not found'; END IF;

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
