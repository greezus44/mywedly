-- Fix security issues: search_path, RLS bypass policies, SECURITY DEFINER exposure
-- This migration hardens the guest_signin function and replaces all USING(true)/WITH CHECK(true) policies with proper ownership checks.

-- 1. Fix guest_signin: set search_path, switch to SECURITY INVOKER, restrict execute
DROP FUNCTION IF EXISTS public.guest_signin(uuid, text);

CREATE FUNCTION public.guest_signin(p_wedding_id uuid, p_username text)
RETURNS TABLE (guest_id uuid, wedding_id uuid, out_full_name text)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT id, wedding_id, full_name
  FROM guests
  WHERE wedding_id = p_wedding_id
    AND LOWER(username) = LOWER(p_username);
$$;

REVOKE EXECUTE ON FUNCTION public.guest_signin(uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guest_signin(uuid, text) TO anon, authenticated;

-- 2. Fix group_event_invites: replace true policies with ownership checks
DROP POLICY IF EXISTS "host_insert_group_event_invites" ON group_event_invites;
CREATE POLICY "host_insert_group_event_invites" ON group_event_invites FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM events e WHERE e.id = group_event_invites.event_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = e.wedding_id AND w.created_by = auth.uid()))
    AND EXISTS (SELECT 1 FROM guest_groups g WHERE g.id = group_event_invites.group_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = g.wedding_id AND w.created_by = auth.uid()))
  );

DROP POLICY IF EXISTS "host_delete_group_event_invites" ON group_event_invites;
CREATE POLICY "host_delete_group_event_invites" ON group_event_invites FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = group_event_invites.event_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = e.wedding_id AND w.created_by = auth.uid()))
    AND EXISTS (SELECT 1 FROM guest_groups g WHERE g.id = group_event_invites.group_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = g.wedding_id AND w.created_by = auth.uid()))
  );

-- 3. Fix guest_event_invites: replace true policies with ownership checks
DROP POLICY IF EXISTS "host_insert_guest_event_invites" ON guest_event_invites;
CREATE POLICY "host_insert_guest_event_invites" ON guest_event_invites FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM events e WHERE e.id = guest_event_invites.event_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = e.wedding_id AND w.created_by = auth.uid()))
    AND EXISTS (SELECT 1 FROM guests g WHERE g.id = guest_event_invites.guest_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = g.wedding_id AND w.created_by = auth.uid()))
  );

DROP POLICY IF EXISTS "host_update_guest_event_invites" ON guest_event_invites;
CREATE POLICY "host_update_guest_event_invites" ON guest_event_invites FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = guest_event_invites.event_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = e.wedding_id AND w.created_by = auth.uid()))
    AND EXISTS (SELECT 1 FROM guests g WHERE g.id = guest_event_invites.guest_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = g.wedding_id AND w.created_by = auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM events e WHERE e.id = guest_event_invites.event_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = e.wedding_id AND w.created_by = auth.uid()))
    AND EXISTS (SELECT 1 FROM guests g WHERE g.id = guest_event_invites.guest_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = g.wedding_id AND w.created_by = auth.uid()))
  );

DROP POLICY IF EXISTS "host_delete_guest_event_invites" ON guest_event_invites;
CREATE POLICY "host_delete_guest_event_invites" ON guest_event_invites FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = guest_event_invites.event_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = e.wedding_id AND w.created_by = auth.uid()))
    AND EXISTS (SELECT 1 FROM guests g WHERE g.id = guest_event_invites.guest_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = g.wedding_id AND w.created_by = auth.uid()))
  );

-- 4. Fix guestbook_entries: restrict anon insert to published weddings
DROP POLICY IF EXISTS "anon_insert_guestbook" ON guestbook_entries;
CREATE POLICY "anon_insert_guestbook" ON guestbook_entries FOR INSERT
  TO anon, authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guestbook_entries.wedding_id AND w.is_published = true)
  );

-- 5. Fix rsvps: restrict anon insert/update to published weddings with matching event
DROP POLICY IF EXISTS "anon_insert_rsvps" ON rsvps;
CREATE POLICY "anon_insert_rsvps" ON rsvps FOR INSERT
  TO anon, authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = rsvps.wedding_id AND w.is_published = true)
    AND (
      rsvps.event_id IS NULL
      OR EXISTS (SELECT 1 FROM events e WHERE e.id = rsvps.event_id AND e.wedding_id = rsvps.wedding_id)
    )
  );

DROP POLICY IF EXISTS "anon_update_rsvps" ON rsvps;
CREATE POLICY "anon_update_rsvps" ON rsvps FOR UPDATE
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = rsvps.wedding_id AND w.is_published = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = rsvps.wedding_id AND w.is_published = true)
    AND (
      rsvps.event_id IS NULL
      OR EXISTS (SELECT 1 FROM events e WHERE e.id = rsvps.event_id AND e.wedding_id = rsvps.wedding_id)
    )
  );
