
DROP POLICY IF EXISTS "authenticated users can insert wedding_members" ON public.wedding_members;
DROP POLICY IF EXISTS "wedding_members insert self" ON public.wedding_members;
DROP POLICY IF EXISTS "Creator can add first member" ON public.wedding_members;
DROP POLICY IF EXISTS "wedding_members_creator_insert" ON public.wedding_members;

CREATE POLICY "wedding_members insert by creator or owner"
  ON public.wedding_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.created_by = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.wedding_members wm
        WHERE wm.wedding_id = wedding_members.wedding_id
          AND wm.user_id = auth.uid()
          AND wm.role IN ('owner','planner')
      )
    )
  );

REVOKE SELECT (guest_password) ON public.weddings FROM anon;
REVOKE SELECT (guest_password) ON public.weddings FROM authenticated;

DROP POLICY IF EXISTS "rsvps_public_update_own" ON public.rsvps;
DROP POLICY IF EXISTS "Guests can update own RSVP" ON public.rsvps;
DROP POLICY IF EXISTS "rsvps public update" ON public.rsvps;

REVOKE EXECUTE ON FUNCTION public.guest_signin(text, text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.guest_rsvp(uuid, text, uuid, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.guest_events(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.guest_signin(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guest_rsvp(uuid, text, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guest_events(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.guest_signin(p_slug text, p_name text, p_password text)
 RETURNS TABLE(guest_id uuid, wedding_id uuid, full_name text, group_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  w RECORD;
  g RECORD;
  new_id uuid;
  v_name text := trim(coalesce(p_name, ''));
  v_pw   text := trim(coalesce(p_password, ''));
BEGIN
  IF v_name = '' THEN RETURN; END IF;

  SELECT id, password_mode, guest_password, is_published
    INTO w
  FROM public.weddings
  WHERE slug = p_slug;

  IF NOT FOUND OR NOT w.is_published THEN RETURN; END IF;

  IF w.password_mode = 'shared' THEN
    IF w.guest_password IS NULL OR v_pw <> trim(w.guest_password) THEN RETURN; END IF;
    SELECT * INTO g FROM public.guests
      WHERE guests.wedding_id = w.id AND lower(full_name) = lower(v_name) LIMIT 1;
    IF NOT FOUND THEN
      INSERT INTO public.guests(wedding_id, full_name)
        VALUES (w.id, v_name) RETURNING id INTO new_id;
      SELECT * INTO g FROM public.guests WHERE id = new_id;
    END IF;

  ELSIF w.password_mode = 'per_guest' THEN
    SELECT * INTO g FROM public.guests
      WHERE guests.wedding_id = w.id
        AND lower(full_name) = lower(v_name)
        AND access_code IS NOT NULL
        AND trim(access_code) = v_pw
      LIMIT 1;
    IF NOT FOUND THEN RETURN; END IF;

  ELSE
    SELECT * INTO g FROM public.guests
      WHERE guests.wedding_id = w.id AND lower(full_name) = lower(v_name) LIMIT 1;
    IF NOT FOUND THEN
      INSERT INTO public.guests(wedding_id, full_name)
        VALUES (w.id, v_name) RETURNING id INTO new_id;
      SELECT * INTO g FROM public.guests WHERE id = new_id;
    END IF;
  END IF;

  guest_id := g.id;
  wedding_id := w.id;
  full_name := g.full_name;
  group_id := g.group_id;
  RETURN NEXT;
END;
$function$;
