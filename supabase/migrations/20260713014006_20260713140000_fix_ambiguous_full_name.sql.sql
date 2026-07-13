-- Fix: column reference "full_name" is ambiguous in guest_signin RPC.
-- The RETURNS TABLE column "full_name" shadows the guests.full_name column.
-- Must DROP first since return type changes.

DROP FUNCTION IF EXISTS public.guest_signin(text, text);

CREATE OR REPLACE FUNCTION public.guest_signin(p_slug text, p_name text)
RETURNS TABLE(guest_id uuid, wedding_id uuid, out_full_name text, group_id uuid)
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
  out_full_name := g.full_name; group_id := g.group_id;
  RETURN NEXT;
END;
$$;
REVOKE ALL ON FUNCTION public.guest_signin(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guest_signin(text, text) TO anon, authenticated;
