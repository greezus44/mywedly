-- F2: the share token is the only secret guarding open-link RSVP, so anon must
-- not be able to list tokens. Public access continues through open_rsvp_lookup
-- and open_rsvp_register (SECURITY DEFINER, token required).
DROP POLICY IF EXISTS "anon_select_open_rsvp_links_by_token" ON public.open_rsvp_links;