
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS rsvps_event_id_idx ON public.rsvps(event_id);
CREATE INDEX IF NOT EXISTS rsvps_wedding_guest_idx ON public.rsvps(wedding_id, lower(guest_name));

-- Allow the guest to update their own prior response (matched by name within same wedding+event) while wedding is published.
DROP POLICY IF EXISTS "rsvps_public_update_own" ON public.rsvps;
CREATE POLICY "rsvps_public_update_own" ON public.rsvps
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.is_published = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.is_published = true)
  );
