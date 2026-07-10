
-- 1. Drop overly permissive public policies
DROP POLICY IF EXISTS "guest lookup by invite code" ON public.guests;
DROP POLICY IF EXISTS "anyone update own rsvp by guest" ON public.rsvps;

-- 2. Restrict profiles reads to self
DROP POLICY IF EXISTS "profiles readable by authenticated" ON public.profiles;
CREATE POLICY "users read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3. Scope public registry/travel reads to published weddings (or members)
DROP POLICY IF EXISTS "registry public" ON public.registry_items;
CREATE POLICY "registry visible for published weddings"
  ON public.registry_items
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.weddings w
      WHERE w.id = registry_items.wedding_id
        AND (w.is_published = true OR public.is_wedding_member(w.id, auth.uid()))
    )
  );

DROP POLICY IF EXISTS "travel public" ON public.travel_items;
CREATE POLICY "travel visible for published weddings"
  ON public.travel_items
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.weddings w
      WHERE w.id = travel_items.wedding_id
        AND (w.is_published = true OR public.is_wedding_member(w.id, auth.uid()))
    )
  );

-- 4. Set fixed search_path on trigger function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- 5. Revoke execute on SECURITY DEFINER functions from public/anon
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_wedding() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_wedding_member(uuid, uuid) FROM PUBLIC, anon;
-- authenticated must keep EXECUTE on is_wedding_member because RLS policies invoke it
GRANT EXECUTE ON FUNCTION public.is_wedding_member(uuid, uuid) TO authenticated;
