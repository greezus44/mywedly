-- F8 (continued): a table-level UPDATE grant covers every column, so the column
-- revoke above only takes effect once the table-level grant is replaced by an
-- explicit column list that excludes `role`.
REVOKE UPDATE ON public.wedding_members FROM authenticated, anon;
GRANT UPDATE (wedding_id, user_id) ON public.wedding_members TO authenticated;
