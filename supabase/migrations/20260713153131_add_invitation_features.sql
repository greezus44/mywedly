/*
# Add Guest Invitation & Username Features

1. New Columns
- `event_guests.username` (text, nullable) — unique username for guest sign-in, case-insensitive uniqueness enforced via a partial unique index
2. New Tables
- `sub_event_group_assignments` — links a Guest Group to a Sub-Event for bulk invitations
  - `id` uuid PK
  - `sub_event_id` uuid FK → sub_events(id) ON DELETE CASCADE
  - `group_id` uuid FK → guest_groups(id) ON DELETE CASCADE
  - `created_at` timestamptz DEFAULT now()
  - Unique constraint on (sub_event_id, group_id) to prevent duplicates
- `guest_invitation_overrides` — manual per-guest invitation overrides that take precedence over group assignments
  - `id` uuid PK
  - `sub_event_id` uuid FK → sub_events(id) ON DELETE CASCADE
  - `guest_id` uuid FK → event_guests(id) ON DELETE CASCADE
  - `is_invited` boolean NOT NULL — true = manually added, false = manually removed
  - `created_at` timestamptz DEFAULT now()
  - Unique constraint on (sub_event_id, guest_id) to prevent duplicates
3. Security
- Enable RLS on both new tables
- Policies for authenticated users (hosts) scoped through user_events.creator_id
- Policies for anon users (guests) to read published data
4. Indexes
- Partial unique index on event_guests(username) per event_id for case-insensitive uniqueness
- Indexes on sub_event_id and group_id for efficient lookups
*/

-- Add username column to event_guests
ALTER TABLE event_guests ADD COLUMN IF NOT EXISTS username text;

-- Create case-insensitive unique index on username per event
CREATE UNIQUE INDEX IF NOT EXISTS event_guests_username_unique_per_event
  ON event_guests (event_id, lower(username))
  WHERE username IS NOT NULL AND username != '';

-- Create sub_event_group_assignments table
CREATE TABLE IF NOT EXISTS sub_event_group_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_event_id uuid NOT NULL REFERENCES sub_events(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES guest_groups(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sub_event_group_assignments ENABLE ROW LEVEL SECURITY;

-- Prevent duplicate assignments
CREATE UNIQUE INDEX IF NOT EXISTS sub_event_group_assignments_unique
  ON sub_event_group_assignments (sub_event_id, group_id);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_sub_event_group_assignments_sub_event
  ON sub_event_group_assignments (sub_event_id);
CREATE INDEX IF NOT EXISTS idx_sub_event_group_assignments_group
  ON sub_event_group_assignments (group_id);

-- RLS policies for sub_event_group_assignments (host access via user_events)
DROP POLICY IF EXISTS "host_select_sub_event_group_assignments" ON sub_event_group_assignments;
CREATE POLICY "host_select_sub_event_group_assignments"
  ON sub_event_group_assignments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sub_events se
    JOIN user_events ue ON se.parent_event_id = ue.id
    WHERE se.id = sub_event_group_assignments.sub_event_id
    AND ue.creator_id = auth.uid()
  ));

DROP POLICY IF EXISTS "host_insert_sub_event_group_assignments" ON sub_event_group_assignments;
CREATE POLICY "host_insert_sub_event_group_assignments"
  ON sub_event_group_assignments FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM sub_events se
    JOIN user_events ue ON se.parent_event_id = ue.id
    WHERE se.id = sub_event_group_assignments.sub_event_id
    AND ue.creator_id = auth.uid()
  ));

DROP POLICY IF EXISTS "host_delete_sub_event_group_assignments" ON sub_event_group_assignments;
CREATE POLICY "host_delete_sub_event_group_assignments"
  ON sub_event_group_assignments FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sub_events se
    JOIN user_events ue ON se.parent_event_id = ue.id
    WHERE se.id = sub_event_group_assignments.sub_event_id
    AND ue.creator_id = auth.uid()
  ));

-- Guest (anon) can read group assignments for published events
DROP POLICY IF EXISTS "guest_select_sub_event_group_assignments" ON sub_event_group_assignments;
CREATE POLICY "guest_select_sub_event_group_assignments"
  ON sub_event_group_assignments FOR SELECT
  TO anon
  USING (EXISTS (
    SELECT 1 FROM sub_events se
    JOIN user_events ue ON se.parent_event_id = ue.id
    WHERE se.id = sub_event_group_assignments.sub_event_id
    AND ue.is_published = true
  ));

-- Create guest_invitation_overrides table
CREATE TABLE IF NOT EXISTS guest_invitation_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_event_id uuid NOT NULL REFERENCES sub_events(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES event_guests(id) ON DELETE CASCADE,
  is_invited boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guest_invitation_overrides ENABLE ROW LEVEL SECURITY;

-- Prevent duplicate overrides per sub_event + guest
CREATE UNIQUE INDEX IF NOT EXISTS guest_invitation_overrides_unique
  ON guest_invitation_overrides (sub_event_id, guest_id);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_guest_invitation_overrides_sub_event
  ON guest_invitation_overrides (sub_event_id);
CREATE INDEX IF NOT EXISTS idx_guest_invitation_overrides_guest
  ON guest_invitation_overrides (guest_id);

-- RLS policies for guest_invitation_overrides (host access via user_events)
DROP POLICY IF EXISTS "host_select_guest_invitation_overrides" ON guest_invitation_overrides;
CREATE POLICY "host_select_guest_invitation_overrides"
  ON guest_invitation_overrides FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sub_events se
    JOIN user_events ue ON se.parent_event_id = ue.id
    WHERE se.id = guest_invitation_overrides.sub_event_id
    AND ue.creator_id = auth.uid()
  ));

DROP POLICY IF EXISTS "host_insert_guest_invitation_overrides" ON guest_invitation_overrides;
CREATE POLICY "host_insert_guest_invitation_overrides"
  ON guest_invitation_overrides FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM sub_events se
    JOIN user_events ue ON se.parent_event_id = ue.id
    WHERE se.id = guest_invitation_overrides.sub_event_id
    AND ue.creator_id = auth.uid()
  ));

DROP POLICY IF EXISTS "host_update_guest_invitation_overrides" ON guest_invitation_overrides;
CREATE POLICY "host_update_guest_invitation_overrides"
  ON guest_invitation_overrides FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sub_events se
    JOIN user_events ue ON se.parent_event_id = ue.id
    WHERE se.id = guest_invitation_overrides.sub_event_id
    AND ue.creator_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sub_events se
    JOIN user_events ue ON se.parent_event_id = ue.id
    WHERE se.id = guest_invitation_overrides.sub_event_id
    AND ue.creator_id = auth.uid()
  ));

DROP POLICY IF EXISTS "host_delete_guest_invitation_overrides" ON guest_invitation_overrides;
CREATE POLICY "host_delete_guest_invitation_overrides"
  ON guest_invitation_overrides FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sub_events se
    JOIN user_events ue ON se.parent_event_id = ue.id
    WHERE se.id = guest_invitation_overrides.sub_event_id
    AND ue.creator_id = auth.uid()
  ));

-- Guest (anon) can read overrides for published events
DROP POLICY IF EXISTS "guest_select_guest_invitation_overrides" ON guest_invitation_overrides;
CREATE POLICY "guest_select_guest_invitation_overrides"
  ON guest_invitation_overrides FOR SELECT
  TO anon
  USING (EXISTS (
    SELECT 1 FROM sub_events se
    JOIN user_events ue ON se.parent_event_id = ue.id
    WHERE se.id = guest_invitation_overrides.sub_event_id
    AND ue.is_published = true
  ));
