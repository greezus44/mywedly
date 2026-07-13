/*
# Add slug, rsvp_deadline, table_number columns + event_slug_redirects table

## user_events changes
- Add `slug` text column for custom event URLs (unique, lowercase + hyphens only)
- Add `rsvp_deadline` timestamptz for RSVP closing date/time (nullable = never closes)
- Add `draft_slug` and `draft_rsvp_deadline` for draft/publish pattern

## event_guests changes
- Add `table_number` text column (supports both numbers and text like "VIP", "A3")
- Keep existing columns (name, email, phone, group_name, side, plus_ones, etc.)
  for backwards compatibility — the UI will use: full_name, table_number, plus_ones, group

## New table: event_slug_redirects
- Maps old slugs to event IDs so old links still work after slug changes
- RLS enabled with public read access (anyone can resolve a slug)
*/

ALTER TABLE user_events ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE user_events ADD COLUMN IF NOT EXISTS draft_slug text;
ALTER TABLE user_events ADD COLUMN IF NOT EXISTS rsvp_deadline timestamptz;
ALTER TABLE user_events ADD COLUMN IF NOT EXISTS draft_rsvp_deadline timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_events_slug ON user_events(slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_events_draft_slug ON user_events(draft_slug) WHERE draft_slug IS NOT NULL;

ALTER TABLE event_guests ADD COLUMN IF NOT EXISTS table_number text;

CREATE TABLE IF NOT EXISTS event_slug_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  event_id uuid NOT NULL REFERENCES user_events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_slug_redirects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_slug_redirects" ON event_slug_redirects;
CREATE POLICY "read_slug_redirects" ON event_slug_redirects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_slug_redirects" ON event_slug_redirects;
CREATE POLICY "insert_own_slug_redirects" ON event_slug_redirects FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_slug_redirects.event_id AND user_events.creator_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_slug_redirects" ON event_slug_redirects;
CREATE POLICY "delete_own_slug_redirects" ON event_slug_redirects FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM user_events WHERE user_events.id = event_slug_redirects.event_id AND user_events.creator_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_event_slug_redirects_slug ON event_slug_redirects(slug);
