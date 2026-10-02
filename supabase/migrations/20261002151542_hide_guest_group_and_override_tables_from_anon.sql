-- F18: who is in which group and which per-guest overrides exist are private.
-- The guest site now resolves invitations through guest_resolve_invitations().
DROP POLICY IF EXISTS guest_select_guest_groups ON public.guest_groups;
DROP POLICY IF EXISTS guest_select_group_members ON public.guest_group_members;
DROP POLICY IF EXISTS guest_select_group_event_invites ON public.group_event_invites;
DROP POLICY IF EXISTS guest_select_guest_invitation_overrides ON public.guest_invitation_overrides;
DROP POLICY IF EXISTS guest_select_sub_event_group_assignments ON public.sub_event_group_assignments;
DROP POLICY IF EXISTS anon_select_guest_event_invites ON public.guest_event_invites;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.guest_groups FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.guest_group_members FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.group_event_invites FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.guest_invitation_overrides FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.sub_event_group_assignments FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.guest_event_invites FROM anon;
