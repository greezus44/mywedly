/*
# Add Sharing, QR Code, and Analytics Tables

## Purpose
Supports the new sharing features: website QR codes, personalised guest QR codes with encrypted tokens, sharing analytics tracking, and saved custom themes.

## New Tables
1. guest_tokens — encrypted tokens for personalised guest QR codes
2. sharing_events — tracks sharing-related events (visits, scans, clicks)
3. saved_themes — stores custom themes for reuse

## Modified Tables
4. weddings — added cover_config, sharing_config, qr_token columns
*/

-- Add columns to weddings table
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS cover_config jsonb DEFAULT '{}'::jsonb;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS sharing_config jsonb DEFAULT '{}'::jsonb;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS qr_token text;

-- Generate a default QR token for existing weddings
UPDATE weddings SET qr_token = encode(gen_random_bytes(16), 'hex') WHERE qr_token IS NULL;

-- Create guest_tokens table
CREATE TABLE IF NOT EXISTS guest_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  qr_code_url text,
  bypass_login boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE guest_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_guest_tokens" ON guest_tokens;
CREATE POLICY "select_own_guest_tokens" ON guest_tokens
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = guest_tokens.wedding_id AND weddings.created_by = auth.uid()));

DROP POLICY IF EXISTS "insert_own_guest_tokens" ON guest_tokens;
CREATE POLICY "insert_own_guest_tokens" ON guest_tokens
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = guest_tokens.wedding_id AND weddings.created_by = auth.uid()));

DROP POLICY IF EXISTS "update_own_guest_tokens" ON guest_tokens;
CREATE POLICY "update_own_guest_tokens" ON guest_tokens
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = guest_tokens.wedding_id AND weddings.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = guest_tokens.wedding_id AND weddings.created_by = auth.uid()));

DROP POLICY IF EXISTS "delete_own_guest_tokens" ON guest_tokens;
CREATE POLICY "delete_own_guest_tokens" ON guest_tokens
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = guest_tokens.wedding_id AND weddings.created_by = auth.uid()));

DROP POLICY IF EXISTS "anon_read_guest_token_by_token" ON guest_tokens;
CREATE POLICY "anon_read_guest_token_by_token" ON guest_tokens
  FOR SELECT TO anon, authenticated USING (true);

-- Create sharing_events table
CREATE TABLE IF NOT EXISTS sharing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  source text,
  device_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sharing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sharing_events" ON sharing_events;
CREATE POLICY "select_own_sharing_events" ON sharing_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = sharing_events.wedding_id AND weddings.created_by = auth.uid()));

DROP POLICY IF EXISTS "insert_sharing_events" ON sharing_events;
CREATE POLICY "insert_sharing_events" ON sharing_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_own_sharing_events" ON sharing_events;
CREATE POLICY "delete_own_sharing_events" ON sharing_events
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = sharing_events.wedding_id AND weddings.created_by = auth.uid()));

-- Create saved_themes table
CREATE TABLE IF NOT EXISTS saved_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  theme_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  cover_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_saved_themes" ON saved_themes;
CREATE POLICY "select_own_saved_themes" ON saved_themes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = saved_themes.wedding_id AND weddings.created_by = auth.uid()));

DROP POLICY IF EXISTS "insert_own_saved_themes" ON saved_themes;
CREATE POLICY "insert_own_saved_themes" ON saved_themes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = saved_themes.wedding_id AND weddings.created_by = auth.uid()));

DROP POLICY IF EXISTS "update_own_saved_themes" ON saved_themes;
CREATE POLICY "update_own_saved_themes" ON saved_themes
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = saved_themes.wedding_id AND weddings.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = saved_themes.wedding_id AND weddings.created_by = auth.uid()));

DROP POLICY IF EXISTS "delete_own_saved_themes" ON saved_themes;
CREATE POLICY "delete_own_saved_themes" ON saved_themes
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM weddings WHERE weddings.id = saved_themes.wedding_id AND weddings.created_by = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guest_tokens_token ON guest_tokens(token);
CREATE INDEX IF NOT EXISTS idx_guest_tokens_wedding_id ON guest_tokens(wedding_id);
CREATE INDEX IF NOT EXISTS idx_sharing_events_wedding_id ON sharing_events(wedding_id);
CREATE INDEX IF NOT EXISTS idx_sharing_events_event_type ON sharing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sharing_events_created_at ON sharing_events(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_themes_wedding_id ON saved_themes(wedding_id);
