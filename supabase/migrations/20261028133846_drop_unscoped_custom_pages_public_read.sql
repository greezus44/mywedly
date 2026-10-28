-- F10: this policy allowed any published custom page to be read regardless of
-- whether its parent event or wedding is published, and because policies are
-- OR'd it defeated the two correctly scoped policies. The scoped siblings
-- (custom_pages_public_read, guest_select_custom_pages) already cover every
-- legitimate guest read.
DROP POLICY IF EXISTS "anon_select_custom_pages" ON public.custom_pages;