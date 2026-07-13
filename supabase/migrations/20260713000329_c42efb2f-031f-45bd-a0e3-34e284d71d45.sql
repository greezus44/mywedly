
ALTER TABLE public.weddings DROP COLUMN IF EXISTS guest_password;
ALTER TABLE public.weddings DROP COLUMN IF EXISTS password_mode;
ALTER TABLE public.guests DROP COLUMN IF EXISTS access_code;

DELETE FROM public.guests g USING public.guests g2
  WHERE g.wedding_id = g2.wedding_id
    AND lower(g.full_name) = lower(g2.full_name)
    AND g.ctid < g2.ctid;
CREATE UNIQUE INDEX IF NOT EXISTS guests_wedding_name_unique
  ON public.guests (wedding_id, lower(full_name));

DROP FUNCTION IF EXISTS public.guest_signin(text, text, text);
CREATE OR REPLACE FUNCTION public.guest_signin(p_slug text, p_name text)
RETURNS TABLE(guest_id uuid, wedding_id uuid, full_name text, group_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

DROP FUNCTION IF EXISTS public.guest_rsvp(uuid, text, uuid, text);
CREATE OR REPLACE FUNCTION public.guest_rsvp(p_guest_id uuid, p_event_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g RECORD;
BEGIN
  IF p_status NOT IN ('accepted','declined','tentative','pending') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  SELECT gs.id, gs.wedding_id, gs.full_name INTO g
    FROM public.guests gs WHERE gs.id = p_guest_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Guest not found'; END IF;
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

DROP FUNCTION IF EXISTS public.guest_events(uuid, text);
CREATE OR REPLACE FUNCTION public.guest_events(p_guest_id uuid)
RETURNS TABLE(id uuid, name text, starts_at timestamptz, venue_name text,
              venue_address text, dress_code text, notes text, rsvp_status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g RECORD;
BEGIN
  SELECT gs.id, gs.wedding_id INTO g FROM public.guests gs WHERE gs.id = p_guest_id;
  IF NOT FOUND THEN RETURN; END IF;
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

DROP POLICY IF EXISTS "creator adds first member" ON public.wedding_members;
DROP POLICY IF EXISTS "wedding_members insert by creator or owner" ON public.wedding_members;
DROP POLICY IF EXISTS "wedding_members self join" ON public.wedding_members;
CREATE POLICY "owner invites members"
  ON public.wedding_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wedding_members me
      WHERE me.wedding_id = wedding_members.wedding_id
        AND me.user_id = auth.uid()
        AND me.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "wedding assets public read" ON storage.objects;
CREATE POLICY "wedding assets public read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'wedding-assets');

DROP POLICY IF EXISTS "wedding assets member write" ON storage.objects;
CREATE POLICY "wedding assets member write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'wedding-assets'
    AND private.is_wedding_member(auth.uid(), (split_part(name, '/', 1))::uuid)
  );

DROP POLICY IF EXISTS "wedding assets member update" ON storage.objects;
CREATE POLICY "wedding assets member update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'wedding-assets'
    AND private.is_wedding_member(auth.uid(), (split_part(name, '/', 1))::uuid)
  );

DROP POLICY IF EXISTS "wedding assets member delete" ON storage.objects;
CREATE POLICY "wedding assets member delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'wedding-assets'
    AND private.is_wedding_member(auth.uid(), (split_part(name, '/', 1))::uuid)
  );
