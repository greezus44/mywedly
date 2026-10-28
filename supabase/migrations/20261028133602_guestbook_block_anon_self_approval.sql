-- F4: public guestbook messages must land unapproved so the host moderates them.
DROP POLICY IF EXISTS "anon_insert_guestbook" ON public.guestbook_entries;
DROP POLICY IF EXISTS "public leave message for published" ON public.guestbook_entries;

CREATE POLICY "anon_insert_guestbook"
  ON public.guestbook_entries FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    coalesce(is_approved, false) = false
    AND EXISTS (
      SELECT 1 FROM public.weddings w
      WHERE w.id = guestbook_entries.wedding_id AND w.is_published = true
    )
  );