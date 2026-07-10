
-- Create private schema not exposed by the API
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

-- Recreate helper inside private schema
CREATE OR REPLACE FUNCTION private.is_wedding_member(_wedding_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wedding_members
    WHERE wedding_id = _wedding_id AND user_id = _user_id
  );
$$;
REVOKE EXECUTE ON FUNCTION private.is_wedding_member(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- Repoint every policy from public.is_wedding_member to private.is_wedding_member
ALTER POLICY "members manage budget" ON public.budget_items
  USING (private.is_wedding_member(wedding_id, auth.uid()))
  WITH CHECK (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "members manage checklist" ON public.checklist_tasks
  USING (private.is_wedding_member(wedding_id, auth.uid()))
  WITH CHECK (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "members manage events" ON public.events
  USING (private.is_wedding_member(wedding_id, auth.uid()))
  WITH CHECK (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "public events visible" ON public.events
  USING (visibility = 'public' OR private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "approved gallery visible" ON public.gallery_items
  USING (is_approved = true OR private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "members delete gallery" ON public.gallery_items
  USING (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "members manage gallery" ON public.gallery_items
  USING (private.is_wedding_member(wedding_id, auth.uid()))
  WITH CHECK (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "approved guestbook visible" ON public.guestbook_entries
  USING (is_approved = true OR private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "members delete guestbook" ON public.guestbook_entries
  USING (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "members moderate guestbook" ON public.guestbook_entries
  USING (private.is_wedding_member(wedding_id, auth.uid()))
  WITH CHECK (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "members manage guests" ON public.guests
  USING (private.is_wedding_member(wedding_id, auth.uid()))
  WITH CHECK (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "members manage registry" ON public.registry_items
  USING (private.is_wedding_member(wedding_id, auth.uid()))
  WITH CHECK (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "registry visible for published weddings" ON public.registry_items
  USING (EXISTS (SELECT 1 FROM public.weddings w
                 WHERE w.id = registry_items.wedding_id
                   AND (w.is_published = true OR private.is_wedding_member(w.id, auth.uid()))));

ALTER POLICY "members delete rsvps" ON public.rsvps
  USING (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "members view rsvps" ON public.rsvps
  USING (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "members manage travel" ON public.travel_items
  USING (private.is_wedding_member(wedding_id, auth.uid()))
  WITH CHECK (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "travel visible for published weddings" ON public.travel_items
  USING (EXISTS (SELECT 1 FROM public.weddings w
                 WHERE w.id = travel_items.wedding_id
                   AND (w.is_published = true OR private.is_wedding_member(w.id, auth.uid()))));

ALTER POLICY "members manage members" ON public.wedding_members
  USING (private.is_wedding_member(wedding_id, auth.uid()))
  WITH CHECK (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "members remove members" ON public.wedding_members
  USING (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "members view membership" ON public.wedding_members
  USING (private.is_wedding_member(wedding_id, auth.uid()));

ALTER POLICY "anyone can view published weddings" ON public.weddings
  USING (is_published = true OR private.is_wedding_member(id, auth.uid()));

ALTER POLICY "members delete wedding" ON public.weddings
  USING (private.is_wedding_member(id, auth.uid()));

ALTER POLICY "members update wedding" ON public.weddings
  USING (private.is_wedding_member(id, auth.uid()))
  WITH CHECK (private.is_wedding_member(id, auth.uid()));

-- Old public function no longer referenced, drop it
DROP FUNCTION IF EXISTS public.is_wedding_member(uuid, uuid);

-- Tighten public INSERT policies: only allow submissions for published weddings
DROP POLICY IF EXISTS "anyone submit rsvp" ON public.rsvps;
CREATE POLICY "public submit rsvp for published"
  ON public.rsvps
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.weddings w
            WHERE w.id = rsvps.wedding_id AND w.is_published = true)
  );

DROP POLICY IF EXISTS "anyone leave message" ON public.guestbook_entries;
CREATE POLICY "public leave message for published"
  ON public.guestbook_entries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.weddings w
            WHERE w.id = guestbook_entries.wedding_id AND w.is_published = true)
  );

DROP POLICY IF EXISTS "anyone upload" ON public.gallery_items;
CREATE POLICY "public upload for published"
  ON public.gallery_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.weddings w
            WHERE w.id = gallery_items.wedding_id AND w.is_published = true)
  );
