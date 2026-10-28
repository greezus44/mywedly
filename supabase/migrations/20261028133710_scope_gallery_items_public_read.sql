-- F6: approved gallery items must only be public when the wedding is published.
DROP POLICY IF EXISTS "anon_select_gallery_items" ON public.gallery_items;

CREATE POLICY "anon_select_gallery_items"
  ON public.gallery_items FOR SELECT
  TO anon, authenticated
  USING (
    is_approved = true
    AND EXISTS (
      SELECT 1 FROM public.weddings w
      WHERE w.id = gallery_items.wedding_id AND w.is_published = true
    )
  );