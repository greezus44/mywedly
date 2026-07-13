/*
# Add Sub-Events for Multiple Events per Invitation

## Purpose
Expands the Event Management system to support multiple events within a single invitation.
A `user_events` record is the "invitation" (e.g. a wedding), and `sub_events` are individual
events within it (e.g. ceremony, reception, rehearsal dinner).

## Changes

### 1. New Table: `sub_events`
Individual events within an invitation. Each has its own name, date, time, venue, address,
description, dress code, RSVP deadline, and schedule.
- `id` (uuid, PK)
- `parent_event_id` (uuid, FK to user_events, ON DELETE CASCADE)
- `name` (text, not null)
- `date` (date, nullable)
- `time` (time, nullable)
- `venue` (text, nullable)
- `address` (text, nullable)
- `description` (text, nullable)
- `dress_code` (text, nullable)
- `rsvp_deadline` (timestamptz, nullable)
- `rsvp_enabled` (boolean, default true)
- `order_index` (integer, default 0)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### 2. Modified Table: `event_rsvps`
Added `sub_event_id` column (nullable uuid, FK to sub_events) so RSVP responses can be
tracked per sub-event. When null, the RSVP applies to the overall invitation.

### 3. Modified Table: `guest_event_invites`
Added `sub_event_id` column (nullable uuid) to support manual invitations to specific
sub-events. When null, the manual override applies to all sub-events.

### 4. Modified Table: `group_event_invites`
Added `sub_event_id` column (nullable uuid) to support group invitations to specific
sub-events. When null, the group is invited to all sub-events.

### 5. Modified Table: `event_schedule`
Added `sub_event_id` column (nullable uuid, FK to sub_events) so schedule items can
belong to specific sub-events.

### 6. Security
- RLS enabled on `sub_events` with owner-scoped CRUD (same pattern as user_events).
- Existing RLS policies on modified tables are not affected (additive columns only).

## Notes
1. All new columns are nullable so existing data continues to work.
2. The `sub_events` table uses the same ownership pattern as `user_events` —
   `parent_event_id` references `user_events.id`, and RLS checks ownership through
   the parent event's `creator_id`.
3. Sub-events are displayed in chronological order by default (ORDER BY date, time).
4. Guests see only sub-events they're invited to (via group or manual override).
*/

-- 1. Create sub_events table
CREATE TABLE IF NOT EXISTS sub_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_event_id uuid NOT NULL REFERENCES user_events(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'New Event',
  date date,
  time time without time zone,
  venue text DEFAULT '',
  address text DEFAULT '',
  description text,
  dress_code text,
  rsvp_deadline timestamptz,
  rsvp_enabled boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for chronological ordering
CREATE INDEX IF NOT EXISTS idx_sub_events_parent_date ON sub_events(parent_event_id, date, time);
CREATE INDEX IF NOT EXISTS idx_sub_events_parent_order ON sub_events(parent_event_id, order_index);

-- Enable RLS on sub_events
ALTER TABLE sub_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for sub_events (owner-scoped through parent event)
DROP POLICY IF EXISTS "select_own_sub_events" ON sub_events;
CREATE POLICY "select_own_sub_events" ON sub_events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = sub_events.parent_event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_sub_events" ON sub_events;
CREATE POLICY "insert_own_sub_events" ON sub_events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = sub_events.parent_event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_sub_events" ON sub_events;
CREATE POLICY "update_own_sub_events" ON sub_events FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = sub_events.parent_event_id AND user_events.creator_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = sub_events.parent_event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_sub_events" ON sub_events;
CREATE POLICY "delete_own_sub_events" ON sub_events FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = sub_events.parent_event_id AND user_events.creator_id = auth.uid())
  );

-- 2. Add sub_event_id to event_rsvps (nullable, for per-sub-event RSVP)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_rsvps' AND column_name = 'sub_event_id') THEN
    ALTER TABLE event_rsvps ADD COLUMN sub_event_id uuid REFERENCES sub_events(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Add sub_event_id to guest_event_invites (nullable, for manual override to specific sub-event)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_event_invites' AND column_name = 'sub_event_id') THEN
    ALTER TABLE guest_event_invites ADD COLUMN sub_event_id uuid REFERENCES sub_events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Add sub_event_id to group_event_invites (nullable, for group invite to specific sub-event)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_event_invites' AND column_name = 'sub_event_id') THEN
    ALTER TABLE group_event_invites ADD COLUMN sub_event_id uuid REFERENCES sub_events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Add sub_event_id to event_schedule (nullable, for schedule items per sub-event)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_schedule' AND column_name = 'sub_event_id') THEN
    ALTER TABLE event_schedule ADD COLUMN sub_event_id uuid REFERENCES sub_events(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6. Add updated_at trigger for sub_events
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sub_events_updated_at ON sub_events;
CREATE TRIGGER trigger_sub_events_updated_at BEFORE UPDATE ON sub_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
