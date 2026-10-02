-- F7: invitation tokens are secrets and must not be enumerable.
-- No client code reads this table; only the owning host needs access.
DROP POLICY IF EXISTS anon_read_guest_token_by_token ON public.guest_tokens;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.guest_tokens FROM anon;
