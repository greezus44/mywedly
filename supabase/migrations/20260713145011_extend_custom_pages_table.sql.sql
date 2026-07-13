/*
# Extend custom_pages table for Custom Pages feature

## Purpose
The existing `custom_pages` table has `wedding_id` but the app uses `user_events`.
This migration adds the missing columns needed for the Custom Pages feature
without dropping or renaming existing columns.

## Changes
- Add `event_id` (uuid, FK to user_events.id, ON DELETE CASCADE) — nullable for backward compat
- Add `nav_label` (text) — defaults to title
- Add `icon` (text) — optional lucide icon name
- Add `show_in_nav` (boolean, default true)
- Add `blocks` (jsonb, default '[]') — page builder content blocks
- Add `is_footer` (boolean, default false) — marks page as event footer
- Add unique index on (event_id, slug)
- Add index on event_id
- Enable RLS and add policies for host (via user_events.creator_id) and guest (published pages)
*/

-- Add missing columns
ALTER TABLE custom_pages ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES user_events(id) ON DELETE CASCADE;
ALTER TABLE custom_pages ADD COLUMN IF NOT EXISTS nav_label text DEFAULT '';
ALTER TABLE custom_pages ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE custom_pages ADD COLUMN IF NOT EXISTS show_in_nav boolean NOT NULL DEFAULT true;
ALTER TABLE custom_pages ADD COLUMN IF NOT EXISTS blocks jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE custom_pages ADD COLUMN IF NOT EXISTS is_footer boolean NOT NULL DEFAULT false;

-- Set nav_label default to title for existing rows
UPDATE custom_pages SET nav_label = title WHERE nav_label = '' OR nav_label IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS custom_pages_event_id_idx ON custom_pages (event_id);
CREATE UNIQUE INDEX IF NOT EXISTS custom_pages_event_slug_idx ON custom_pages (event_id, slug) WHERE event_id IS NOT NULL;

-- Enable RLS
ALTER TABLE custom_pages ENABLE ROW LEVEL SECURITY;

-- Host policies (scoped through user_events.creator_id)
DROP POLICY IF EXISTS "host_select_custom_pages" ON custom_pages;
CREATE POLICY "host_select_custom_pages" ON custom_pages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = custom_pages.event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "host_insert_custom_pages" ON custom_pages;
CREATE POLICY "host_insert_custom_pages" ON custom_pages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = custom_pages.event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "host_update_custom_pages" ON custom_pages;
CREATE POLICY "host_update_custom_pages" ON custom_pages FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = custom_pages.event_id AND user_events.creator_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = custom_pages.event_id AND user_events.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "host_delete_custom_pages" ON custom_pages;
CREATE POLICY "host_delete_custom_pages" ON custom_pages FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = custom_pages.event_id AND user_events.creator_id = auth.uid())
  );

-- Guest policies (anon can read published pages on published events)
DROP POLICY IF EXISTS "guest_select_custom_pages" ON custom_pages;
CREATE POLICY "guest_select_custom_pages" ON custom_pages FOR SELECT
  TO anon, authenticated USING (
    is_published = true AND
    EXISTS (SELECT 1 FROM user_events WHERE user_events.id = custom_pages.event_id AND user_events.is_published = true)
  );
