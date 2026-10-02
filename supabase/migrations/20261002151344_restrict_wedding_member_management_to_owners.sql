-- F8: only an owner may change a membership row, and nobody may set the role column
-- through the Data API.
DROP POLICY IF EXISTS "members manage members" ON public.wedding_members;
CREATE POLICY "owners manage members" ON public.wedding_members
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM wedding_members me
    WHERE me.wedding_id = wedding_members.wedding_id
      AND me.user_id = auth.uid()
      AND me.role = 'owner'::wedding_role
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM wedding_members me
    WHERE me.wedding_id = wedding_members.wedding_id
      AND me.user_id = auth.uid()
      AND me.role = 'owner'::wedding_role
  ));

DROP POLICY IF EXISTS "members remove members" ON public.wedding_members;
CREATE POLICY "owners remove members" ON public.wedding_members
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM wedding_members me
    WHERE me.wedding_id = wedding_members.wedding_id
      AND me.user_id = auth.uid()
      AND me.role = 'owner'::wedding_role
  ));

REVOKE UPDATE (role) ON public.wedding_members FROM authenticated, anon;
