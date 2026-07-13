/*
# Create multi-event platform schema

1. New Tables
- `user_events`: Main events table. Each row is one event created by a user.
  - id, creator_id (DEFAULT auth.uid()), name, event_type, event_date, event_time, venue, address
  - cover_config, login_config, theme, logo_config, content, sharing_config (all JSONB)
  - draft_* columns for each config (JSONB) for draft/publish pattern
  - is_published, is_archived, published_at, created_at, updated_at
- `event_guests`: Guest list scoped per event.
- `event_rsvps`: RSVP submissions scoped per event.
- `event_schedule`: Schedule items scoped per event.
- `event_messages`: Guest messages/wishes scoped per event.

2. Security
- RLS enabled on ALL tables.
- Owner-scoped CRUD for authenticated creators.
- Anon guest access for guest-facing reads and writes (published events only).

3. Notes
- `user_events` avoids conflict with legacy `events` table.
- `creator_id` defaults to auth.uid() so inserts work without explicitly passing it.
*/

CREATE TABLE IF NOT EXISTS user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Event',
  event_type text NOT NULL DEFAULT 'other',
  event_date date,
  event_time text,
  venue text,
  address text,
  cover_image text,
  cover_config jsonb DEFAULT '{}'::jsonb,
  login_config jsonb DEFAULT '{}'::jsonb,
  theme jsonb DEFAULT '{}'::jsonb,
  logo_config jsonb DEFAULT '{}'::jsonb,
  content jsonb DEFAULT '{}'::jsonb,
  sharing_config jsonb DEFAULT '{}'::jsonb,
  draft_cover_config jsonb DEFAULT '{}'::jsonb,
  draft_login_config jsonb DEFAULT '{}'::jsonb,
  draft_theme jsonb DEFAULT '{}'::jsonb,
  draft_logo_config jsonb DEFAULT '{}'::jsonb,
  draft_content jsonb DEFAULT '{}'::jsonb,
  draft_sharing_config jsonb DEFAULT '{}'::jsonb,
  draft_event_date date,
  draft_event_time text,
  draft_venue text,
  draft_address text,
  is_published boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_events" ON user_events;
CREATE POLICY "select_own_events" ON user_events FOR SELECT
  TO authenticated USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "insert_own_events" ON user_events;
CREATE POLICY "insert_own_events" ON user_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "update_own_events" ON user_events;
CREATE POLICY "update_own_events" ON user_events FOR UPDATE
  TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "delete_own_events" ON user_events;
CREATE POLICY "delete_own_events" ON user_events FOR DELETE
  TO authenticated USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "guest_read_published_events" ON user_events;
CREATE POLICY "guest_read_published_events" ON user_events FOR SELECT
  TO anon, authenticated USING (is_published = true);

CREATE TABLE IF NOT EXISTS event_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES user_events(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  group_name text,
  side text,
  token text,
  rsvp_status text DEFAULT 'pending',
  plus_ones integer DEFAULT 0,
  dietary text,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_event_guests" ON event_guests;
CREATE POLICY "select_own_event_guests" ON event_guests FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_guests.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_event_guests" ON event_guests;
CREATE POLICY "insert_own_event_guests" ON event_guests FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_guests.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_event_guests" ON event_guests;
CREATE POLICY "update_own_event_guests" ON event_guests FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_guests.event_id AND user_events.creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_guests.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_event_guests" ON event_guests;
CREATE POLICY "delete_own_event_guests" ON event_guests FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_guests.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "guest_read_event_guests" ON event_guests;
CREATE POLICY "guest_read_event_guests" ON event_guests FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "guest_insert_event_guests" ON event_guests;
CREATE POLICY "guest_insert_event_guests" ON event_guests FOR INSERT
  TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_guests.event_id AND user_events.is_published = true));

DROP POLICY IF EXISTS "guest_update_event_guests" ON event_guests;
CREATE POLICY "guest_update_event_guests" ON event_guests FOR UPDATE
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_guests.event_id AND user_events.is_published = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_guests.event_id AND user_events.is_published = true));

CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES user_events(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES event_guests(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  plus_ones integer DEFAULT 0,
  dietary text,
  message text,
  answers jsonb DEFAULT '{}'::jsonb,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_event_rsvps" ON event_rsvps;
CREATE POLICY "select_own_event_rsvps" ON event_rsvps FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_rsvps.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_event_rsvps" ON event_rsvps;
CREATE POLICY "insert_own_event_rsvps" ON event_rsvps FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_rsvps.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_event_rsvps" ON event_rsvps;
CREATE POLICY "update_own_event_rsvps" ON event_rsvps FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_rsvps.event_id AND user_events.creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_rsvps.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_event_rsvps" ON event_rsvps;
CREATE POLICY "delete_own_event_rsvps" ON event_rsvps FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_rsvps.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "guest_read_event_rsvp" ON event_rsvps;
CREATE POLICY "guest_read_event_rsvp" ON event_rsvps FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "guest_insert_event_rsvp" ON event_rsvps;
CREATE POLICY "guest_insert_event_rsvp" ON event_rsvps FOR INSERT
  TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_rsvps.event_id AND user_events.is_published = true));

CREATE TABLE IF NOT EXISTS event_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES user_events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  schedule_date date,
  start_time text,
  end_time text,
  venue text,
  address text,
  dress_code text,
  category text,
  cover_image text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_event_schedule" ON event_schedule;
CREATE POLICY "select_own_event_schedule" ON event_schedule FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_schedule.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_event_schedule" ON event_schedule;
CREATE POLICY "insert_own_event_schedule" ON event_schedule FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_schedule.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_event_schedule" ON event_schedule;
CREATE POLICY "update_own_event_schedule" ON event_schedule FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_schedule.event_id AND user_events.creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_schedule.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_event_schedule" ON event_schedule;
CREATE POLICY "delete_own_event_schedule" ON event_schedule FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_schedule.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "guest_read_event_schedule" ON event_schedule;
CREATE POLICY "guest_read_event_schedule" ON event_schedule FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS event_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES user_events(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_event_messages" ON event_messages;
CREATE POLICY "select_own_event_messages" ON event_messages FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_messages.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_event_messages" ON event_messages;
CREATE POLICY "insert_own_event_messages" ON event_messages FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_messages.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_event_messages" ON event_messages;
CREATE POLICY "delete_own_event_messages" ON event_messages FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_messages.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "guest_read_event_message" ON event_messages;
CREATE POLICY "guest_read_event_message" ON event_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "guest_insert_event_message" ON event_messages;
CREATE POLICY "guest_insert_event_message" ON event_messages FOR INSERT
  TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_messages.event_id AND user_events.is_published = true));

CREATE INDEX IF NOT EXISTS idx_user_events_creator ON user_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_event_guests_event ON event_guests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_schedule_event ON event_schedule(event_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_event ON event_messages(event_id);
