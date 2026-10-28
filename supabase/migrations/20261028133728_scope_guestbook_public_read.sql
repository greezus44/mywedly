-- F7: approved guestbook messages must only be public when the wedding is published.
DROP POLICY IF EXISTS "anon_select_guestbook" ON public.guestbook_entries;

CREATE POLICY "anon_select_guestbook"
  ON public.guestbook_entries FOR SELECT
  TO anon, authenticated
  USING (
    is_approved = true
    AND EXISTS (
      SELECT 1 FROM public.weddings w
      WHERE w.id = guestbook_entries.wedding_id AND w.is_published = true
    )
  );