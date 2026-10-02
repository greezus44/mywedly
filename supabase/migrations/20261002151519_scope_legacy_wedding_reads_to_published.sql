-- F10/F11/F19: remove the redundant always-true read policies on the legacy
-- wedding tables; each of these already has a published-scoped policy, except
-- galleries and slug redirects which get one here.
DROP POLICY IF EXISTS anon_select_guests ON public.guests;
DROP POLICY IF EXISTS anon_select_rsvps ON public.rsvps;
DROP POLICY IF EXISTS anon_select_events ON public.events;
DROP POLICY IF EXISTS anon_select_registry_items ON public.registry_items;
DROP POLICY IF EXISTS anon_select_travel_items ON public.travel_items;

-- F11: anonymous visitors may submit an RSVP but must not rewrite existing ones.
DROP POLICY IF EXISTS anon_update_rsvps ON public.rsvps;
DROP POLICY IF EXISTS "anon update rsvps for published weddings" ON public.rsvps;
REVOKE UPDATE, DELETE ON public.rsvps FROM anon;

DROP POLICY IF EXISTS anon_select_galleries ON public.galleries;
CREATE POLICY anon_select_galleries ON public.galleries
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM weddings w
    WHERE w.id = galleries.wedding_id AND w.is_published = true
  ));

DROP POLICY IF EXISTS read_slug_redirects ON public.event_slug_redirects;
CREATE POLICY read_slug_redirects ON public.event_slug_redirects
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM user_events e
    WHERE e.id = event_slug_redirects.event_id AND e.is_published = true
  ));
