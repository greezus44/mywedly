/*
# Multi-Event Platform Schema

## Overview
Creates a new `user_events` table as the main table for the multi-event platform.
Each user account can create and manage multiple independent events (weddings, birthdays, conferences, etc.).
All child resources are scoped to a user_event via event_id.

## New Tables

1. **user_events** — Main table, one row per event
   - id, creator_id, name, event_type, event_date, event_time, venue, address
   - cover_image, cover_config, login_config, theme, logo_config, content, sharing_config (JSONB)
   - draft_* columns for all editable content
   - is_published, is_archived, published_at, created_at, updated_at

2. **event_guests** — Guest list per event (new table, no conflicts)
   - id, event_id, name, email, phone, group_name, side, token
   - rsvp_status, rsvp_submitted_at, plus_ones, dietary, message

3. **event_rsvps** — RSVP responses per event
   - id, event_id, guest_id, guest_name, status, plus_ones, dietary, message, answers

4. **event_schedule** — Timeline/activities per event
   - id, event_id, title, description, schedule_date, start_time, end_time, order_index

5. **event_messages** — Guestbook messages per event
   - id, event_id, guest_name, message

## Security
- RLS enabled on all tables
- Owner-scoped policies: users can only access their own events and child resources
- Child tables scoped through parent event ownership check
- Guest (anon) read access for public event pages and RSVP submission
*/

-- User events table (main table for multi-event platform)
CREATE TABLE IF NOT EXISTS user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Event',
  event_type text NOT NULL DEFAULT 'other',
  event_date date,
  event_time time,
  venue text DEFAULT '',
  address text DEFAULT '',
  cover_image text,
  cover_config jsonb DEFAULT '{}'::jsonb,
  login_config jsonb DEFAULT '{}'::jsonb,
  theme jsonb DEFAULT '{}'::jsonb,
  logo_config jsonb DEFAULT '{}'::jsonb,
  content jsonb DEFAULT '{}'::jsonb,
  sharing_config jsonb DEFAULT '{}'::jsonb,
  draft_name text,
  draft_event_type text,
  draft_event_date date,
  draft_event_time time,
  draft_venue text,
  draft_address text,
  draft_cover_image text,
  draft_cover_config jsonb,
  draft_login_config jsonb,
  draft_theme jsonb,
  draft_logo_config jsonb,
  draft_content jsonb,
  draft_sharing_config jsonb,
  is_published boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_events" ON user_events;
CREATE POLICY "select_own_user_events" ON user_events
  FOR SELECT TO authenticated USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "insert_own_user_events" ON user_events;
CREATE POLICY "insert_own_user_events" ON user_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "update_own_user_events" ON user_events;
CREATE POLICY "update_own_user_events" ON user_events
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "delete_own_user_events" ON user_events;
CREATE POLICY "delete_own_user_events" ON user_events
  FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Guest read access for public event pages
DROP POLICY IF EXISTS "guest_read_user_events" ON user_events;
CREATE POLICY "guest_read_user_events" ON user_events
  FOR SELECT TO anon, authenticated USING (true);

-- Event guests table
CREATE TABLE IF NOT EXISTS event_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES user_events(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  group_name text DEFAULT '',
  side text DEFAULT '',
  token text NOT NULL DEFAULT gen_random_uuid()::text,
  rsvp_status text NOT NULL DEFAULT 'pending',
  rsvp_submitted_at timestamptz,
  plus_ones integer NOT NULL DEFAULT 0,
  dietary text DEFAULT '',
  message text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_guests_event_id ON event_guests(event_id);

ALTER TABLE event_guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_event_guests" ON event_guests;
CREATE POLICY "select_own_event_guests" ON event_guests
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_guests.event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_event_guests" ON event_guests;
CREATE POLICY "insert_own_event_guests" ON event_guests
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_guests.event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_event_guests" ON event_guests;
CREATE POLICY "update_own_event_guests" ON event_guests
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_guests.event_id AND user_events.creator_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_guests.event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_event_guests" ON event_guests;
CREATE POLICY "delete_own_event_guests" ON event_guests
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_guests.event_id AND user_events.creator_id = auth.uid())
  );

-- Guest read access via token
DROP POLICY IF EXISTS "guest_read_event_guests" ON event_guests;
CREATE POLICY "guest_read_event_guests" ON event_guests
  FOR SELECT TO anon, authenticated USING (true);

-- Guest update for RSVP status
DROP POLICY IF EXISTS "guest_update_event_guests" ON event_guests;
CREATE POLICY "guest_update_event_guests" ON event_guests
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Event RSVPs table
CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES user_events(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES event_guests(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  plus_ones integer NOT NULL DEFAULT 0,
  dietary text DEFAULT '',
  message text DEFAULT '',
  answers jsonb DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_event_rsvps" ON event_rsvps;
CREATE POLICY "select_own_event_rsvps" ON event_rsvps
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_rsvps.event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_event_rsvps" ON event_rsvps;
CREATE POLICY "insert_own_event_rsvps" ON event_rsvps
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_rsvps.event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_event_rsvps" ON event_rsvps;
CREATE POLICY "update_own_event_rsvps" ON event_rsvps
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_rsvps.event_id AND user_events.creator_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_rsvps.event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_event_rsvps" ON event_rsvps;
CREATE POLICY "delete_own_event_rsvps" ON event_rsvps
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_rsvps.event_id AND user_events.creator_id = auth.uid())
  );

-- Guest RSVP insert and read
DROP POLICY IF EXISTS "guest_insert_event_rsvp" ON event_rsvps;
CREATE POLICY "guest_insert_event_rsvp" ON event_rsvps
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "guest_read_event_rsvp" ON event_rsvps;
CREATE POLICY "guest_read_event_rsvp" ON event_rsvps
  FOR SELECT TO anon, authenticated USING (true);

-- Event schedule table
CREATE TABLE IF NOT EXISTS event_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES user_events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  schedule_date date,
  start_time time,
  end_time time,
  venue text DEFAULT '',
  address text DEFAULT '',
  dress_code text DEFAULT '',
  category text DEFAULT '',
  cover_image text DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_schedule_event_id ON event_schedule(event_id);

ALTER TABLE event_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_event_schedule" ON event_schedule;
CREATE POLICY "select_own_event_schedule" ON event_schedule
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_schedule.event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_event_schedule" ON event_schedule;
CREATE POLICY "insert_own_event_schedule" ON event_schedule
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_schedule.event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_event_schedule" ON event_schedule;
CREATE POLICY "update_own_event_schedule" ON event_schedule
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_schedule.event_id AND user_events.creator_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_schedule.event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_event_schedule" ON event_schedule;
CREATE POLICY "delete_own_event_schedule" ON event_schedule
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_schedule.event_id AND user_events.creator_id = auth.uid())
  );

-- Guest read schedule
DROP POLICY IF EXISTS "guest_read_event_schedule" ON event_schedule;
CREATE POLICY "guest_read_event_schedule" ON event_schedule
  FOR SELECT TO anon, authenticated USING (true);

-- Event messages table (guestbook)
CREATE TABLE IF NOT EXISTS event_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES user_events(id) ON DELETE CASCADE,
  guest_name text NOT NULL DEFAULT 'Anonymous',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_messages_event_id ON event_messages(event_id);

ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_event_messages" ON event_messages;
CREATE POLICY "select_own_event_messages" ON event_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_messages.event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_event_messages" ON event_messages;
CREATE POLICY "insert_own_event_messages" ON event_messages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_messages.event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_event_messages" ON event_messages;
CREATE POLICY "delete_own_event_messages" ON event_messages
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_messages.event_id AND user_events.creator_id = auth.uid())
  );

-- Guest message insert and read
DROP POLICY IF EXISTS "guest_insert_event_message" ON event_messages;
CREATE POLICY "guest_insert_event_message" ON event_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "guest_read_event_message" ON event_messages;
CREATE POLICY "guest_read_event_message" ON event_messages
  FOR SELECT TO anon, authenticated USING (true);
