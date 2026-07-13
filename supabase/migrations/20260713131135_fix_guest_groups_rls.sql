/*
# Fix Guest Groups RLS Policies to Use user_events Ownership

## Problem
The `guest_groups` table and its junction tables (`guest_group_members`, `group_event_invites`)
had RLS policies that checked ownership through the `weddings` table:
  EXISTS (SELECT 1 FROM weddings w WHERE w.id = guest_groups.wedding_id AND w.created_by = auth.uid())

But the application uses the `user_events` table, not `weddings`. The `weddings` table has 0 rows,
so the EXISTS check always returned false, blocking all INSERT/SELECT/UPDATE/DELETE operations
with the error: "new row violates row-level security policy for table guest_groups".

## Solution
1. Add `event_id` column to `guest_groups` referencing `user_events(id)` (nullable for backward compat)
2. Drop all old RLS policies on `guest_groups` that reference `weddings`
3. Create new RLS policies on `guest_groups` that check ownership through:
   EXISTS (SELECT 1 FROM user_events WHERE user_events.id = guest_groups.event_id AND user_events.creator_id = auth.uid())
4. Fix `guest_group_members` RLS policies to check ownership through guest_groups → user_events
5. Fix `group_event_invites` RLS policies to check ownership through guest_groups → user_events
6. All policies are scoped TO authenticated with proper ownership predicates
7. Guest-facing read policies use the is_published check on user_events

## Tables Modified
- `guest_groups`: Added `event_id` column + new FK to user_events
- `guest_groups`: Replaced all 5 RLS policies (select/insert/update/delete + member_all)
- `guest_group_members`: Replaced all 4 RLS policies
- `group_event_invites`: Replaced all 4 RLS policies

## Security
- RLS remains enabled on all tables
- All host policies check: user_events.creator_id = auth.uid() (event owner only)
- Guest read policies check: user_events.is_published = true
- No USING(true) shortcuts — all policies have real ownership predicates
- Separate policies per CRUD verb (no FOR ALL)
*/

-- Step 1: Add event_id column to guest_groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_groups' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE guest_groups ADD COLUMN event_id uuid;
  END IF;
END $$;

-- Step 2: Add FK constraint from guest_groups.event_id to user_events.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'guest_groups_event_id_fkey'
  ) THEN
    ALTER TABLE guest_groups
    ADD CONSTRAINT guest_groups_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES user_events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 3: Add index on event_id for performance
CREATE INDEX IF NOT EXISTS idx_guest_groups_event_id ON guest_groups(event_id);

-- Step 4: Drop old RLS policies on guest_groups (all reference weddings)
DROP POLICY IF EXISTS "guest_groups_member_all" ON guest_groups;
DROP POLICY IF EXISTS "host_delete_guest_groups" ON guest_groups;
DROP POLICY IF EXISTS "host_insert_guest_groups" ON guest_groups;
DROP POLICY IF EXISTS "host_select_guest_groups" ON guest_groups;
DROP POLICY IF EXISTS "host_update_guest_groups" ON guest_groups;

-- Step 5: Create new RLS policies on guest_groups using user_events ownership
-- Host SELECT: can read groups for events they own
CREATE POLICY "host_select_guest_groups" ON guest_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_events
      WHERE user_events.id = guest_groups.event_id
      AND user_events.creator_id = auth.uid()
    )
  );

-- Host INSERT: can create groups for events they own
CREATE POLICY "host_insert_guest_groups" ON guest_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_events
      WHERE user_events.id = guest_groups.event_id
      AND user_events.creator_id = auth.uid()
    )
  );

-- Host UPDATE: can update groups for events they own
CREATE POLICY "host_update_guest_groups" ON guest_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_events
      WHERE user_events.id = guest_groups.event_id
      AND user_events.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_events
      WHERE user_events.id = guest_groups.event_id
      AND user_events.creator_id = auth.uid()
    )
  );

-- Host DELETE: can delete groups for events they own
CREATE POLICY "host_delete_guest_groups" ON guest_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_events
      WHERE user_events.id = guest_groups.event_id
      AND user_events.creator_id = auth.uid()
    )
  );

-- Guest SELECT: can read groups for published events
CREATE POLICY "guest_select_guest_groups" ON guest_groups FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_events
      WHERE user_events.id = guest_groups.event_id
      AND user_events.is_published = true
    )
  );

-- Step 6: Fix guest_group_members RLS policies
-- Drop old policies that reference weddings through guests
DROP POLICY IF EXISTS "anon_select_guest_group_members" ON guest_group_members;
DROP POLICY IF EXISTS "host_delete_group_members" ON guest_group_members;
DROP POLICY IF EXISTS "host_insert_group_members" ON guest_group_members;
DROP POLICY IF EXISTS "host_select_group_members" ON guest_group_members;

-- Create new policies using guest_groups → user_events ownership chain
CREATE POLICY "host_select_group_members" ON guest_group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_groups
      JOIN user_events ON user_events.id = guest_groups.event_id
      WHERE guest_groups.id = guest_group_members.group_id
      AND user_events.creator_id = auth.uid()
    )
  );

CREATE POLICY "host_insert_group_members" ON guest_group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_groups
      JOIN user_events ON user_events.id = guest_groups.event_id
      WHERE guest_groups.id = guest_group_members.group_id
      AND user_events.creator_id = auth.uid()
    )
  );

CREATE POLICY "host_delete_group_members" ON guest_group_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_groups
      JOIN user_events ON user_events.id = guest_groups.event_id
      WHERE guest_groups.id = guest_group_members.group_id
      AND user_events.creator_id = auth.uid()
    )
  );

-- Guest read for published events
CREATE POLICY "guest_select_group_members" ON guest_group_members FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_groups
      JOIN user_events ON user_events.id = guest_groups.event_id
      WHERE guest_groups.id = guest_group_members.group_id
      AND user_events.is_published = true
    )
  );

-- Step 7: Fix group_event_invites RLS policies
-- Drop old policies that reference weddings
DROP POLICY IF EXISTS "anon_select_group_event_invites" ON group_event_invites;
DROP POLICY IF EXISTS "group_event_invites_member_all" ON group_event_invites;
DROP POLICY IF EXISTS "host_delete_group_event_invites" ON group_event_invites;
DROP POLICY IF EXISTS "host_insert_group_event_invites" ON group_event_invites;

-- Create new policies using guest_groups → user_events ownership chain
CREATE POLICY "host_select_group_event_invites" ON group_event_invites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_groups
      JOIN user_events ON user_events.id = guest_groups.event_id
      WHERE guest_groups.id = group_event_invites.group_id
      AND user_events.creator_id = auth.uid()
    )
  );

CREATE POLICY "host_insert_group_event_invites" ON group_event_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guest_groups
      JOIN user_events ON user_events.id = guest_groups.event_id
      WHERE guest_groups.id = group_event_invites.group_id
      AND user_events.creator_id = auth.uid()
    )
  );

CREATE POLICY "host_delete_group_event_invites" ON group_event_invites FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_groups
      JOIN user_events ON user_events.id = guest_groups.event_id
      WHERE guest_groups.id = group_event_invites.group_id
      AND user_events.creator_id = auth.uid()
    )
  );

-- Guest read for published events
CREATE POLICY "guest_select_group_event_invites" ON group_event_invites FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_groups
      JOIN user_events ON user_events.id = guest_groups.event_id
      WHERE guest_groups.id = group_event_invites.group_id
      AND user_events.is_published = true
    )
  );
