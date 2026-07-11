
-- 1. SECURITY: remove wedding_members self-join escalation
DROP POLICY IF EXISTS "creator adds first member" ON public.wedding_members;
DROP POLICY IF EXISTS wedding_member_self_join ON public.wedding_members;

-- 2. SECURITY: remove unrestricted public RSVP writes (move to verified server fn)
DROP POLICY IF EXISTS rsvps_public_update_own ON public.rsvps;
DROP POLICY IF EXISTS rsvps_public_insert ON public.rsvps;
DROP POLICY IF EXISTS rsvps_public_insert_own ON public.rsvps;

-- 3. Extend weddings with CMS + guest-access config
ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS guest_password TEXT,
  ADD COLUMN IF NOT EXISTS password_mode TEXT NOT NULL DEFAULT 'shared',
  ADD COLUMN IF NOT EXISTS signin_helper TEXT,
  ADD COLUMN IF NOT EXISTS theme JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$ BEGIN
  ALTER TABLE public.weddings
    ADD CONSTRAINT weddings_password_mode_chk CHECK (password_mode IN ('shared','per_guest','none'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Guest groups
CREATE TABLE IF NOT EXISTS public.guest_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_groups TO authenticated;
GRANT ALL ON public.guest_groups TO service_role;
ALTER TABLE public.guest_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS guest_groups_member_all ON public.guest_groups;
CREATE POLICY guest_groups_member_all ON public.guest_groups FOR ALL TO authenticated
  USING (private.is_wedding_member(wedding_id, auth.uid()))
  WITH CHECK (private.is_wedding_member(wedding_id, auth.uid()));
DROP TRIGGER IF EXISTS guest_groups_touch ON public.guest_groups;
CREATE TRIGGER guest_groups_touch BEFORE UPDATE ON public.guest_groups
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Guests: add access_code + group link
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS access_code TEXT,
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.guest_groups(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS guests_wedding_access_code_uidx
  ON public.guests(wedding_id, access_code) WHERE access_code IS NOT NULL;

-- 6. Custom pages
CREATE TABLE IF NOT EXISTS public.custom_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  inline_image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wedding_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_pages TO authenticated;
GRANT SELECT ON public.custom_pages TO anon;
GRANT ALL ON public.custom_pages TO service_role;
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS custom_pages_member_all ON public.custom_pages;
CREATE POLICY custom_pages_member_all ON public.custom_pages FOR ALL TO authenticated
  USING (private.is_wedding_member(wedding_id, auth.uid()))
  WITH CHECK (private.is_wedding_member(wedding_id, auth.uid()));
DROP POLICY IF EXISTS custom_pages_public_read ON public.custom_pages;
CREATE POLICY custom_pages_public_read ON public.custom_pages FOR SELECT TO anon, authenticated
  USING (is_published AND EXISTS (
    SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.is_published
  ));
DROP TRIGGER IF EXISTS custom_pages_touch ON public.custom_pages;
CREATE TRIGGER custom_pages_touch BEFORE UPDATE ON public.custom_pages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 7. Guest ↔ event invitations
CREATE TABLE IF NOT EXISTS public.guest_event_invites (
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (guest_id, event_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_event_invites TO authenticated;
GRANT ALL ON public.guest_event_invites TO service_role;
ALTER TABLE public.guest_event_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS guest_event_invites_member_all ON public.guest_event_invites;
CREATE POLICY guest_event_invites_member_all ON public.guest_event_invites FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.guests g
    WHERE g.id = guest_id AND private.is_wedding_member(g.wedding_id, auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.guests g
    WHERE g.id = guest_id AND private.is_wedding_member(g.wedding_id, auth.uid())
  ));

-- 8. Group ↔ event invitations
CREATE TABLE IF NOT EXISTS public.group_event_invites (
  group_id UUID NOT NULL REFERENCES public.guest_groups(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, event_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_event_invites TO authenticated;
GRANT ALL ON public.group_event_invites TO service_role;
ALTER TABLE public.group_event_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS group_event_invites_member_all ON public.group_event_invites;
CREATE POLICY group_event_invites_member_all ON public.group_event_invites FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.guest_groups gg
    WHERE gg.id = group_id AND private.is_wedding_member(gg.wedding_id, auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.guest_groups gg
    WHERE gg.id = group_id AND private.is_wedding_member(gg.wedding_id, auth.uid())
  ));
