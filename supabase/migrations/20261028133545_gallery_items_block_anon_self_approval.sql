-- F3: public gallery uploads must land unapproved so the host moderates them.
DROP POLICY IF EXISTS "public upload for published" ON public.gallery_items;

CREATE POLICY "public upload for published"
  ON public.gallery_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    coalesce(is_approved, false) = false
    AND EXISTS (
      SELECT 1 FROM public.weddings w
      WHERE w.id = gallery_items.wedding_id AND w.is_published = true
    )
  );