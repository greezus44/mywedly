-- F1: guest_event_invites must not be readable by unauthenticated callers.
-- Only host dashboard pages (authenticated) read this table; the guest side
-- goes through the guest_* SECURITY DEFINER functions.
DROP POLICY IF EXISTS "anon_select_guest_event_invites" ON public.guest_event_invites;