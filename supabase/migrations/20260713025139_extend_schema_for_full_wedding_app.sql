/*
# Extend schema for full wedding app

1. Overview
   This migration extends the existing wedding schema to support:
   - Guest first/last name fields (alongside existing full_name)
   - Many-to-many guest-group membership (guests can belong to multiple groups)
   - Extended event details (description, maps link, images, RSVP deadline, capacity)
   - Invitation type on guest_event_invites (include/exclude for precedence)
   - Website content CMS table (key-value content blocks)
   - Galleries table for grouping images

2. New Tables
   - `guest_group_members` — many-to-many junction between guests and guest_groups
     * guest_id (uuid, FK → guests.id)
     * group_id (uuid, FK → guest_groups.id)
     * PRIMARY KEY (guest_id, group_id)
   - `website_content` — CMS content blocks keyed by section
     * id (uuid PK)
     * wedding_id (uuid FK → weddings.id)
     * section (text, e.g. 'hero', 'story', 'schedule', 'faq', 'registry', 'accommodation', 'travel', 'contact', 'footer')
     * title (text, nullable)
     * body (text, nullable)
     * image_url (text, nullable)
     * sort_order (integer, default 0)
     * is_published (boolean, default true)
     * created_at, updated_at (timestamptz)
   - `galleries` — gallery groupings
     * id (uuid PK)
     * wedding_id (uuid FK → weddings.id)
     * title (text)
     * sort_order (integer, default 0)
     * created_at (timestamptz)

3. Modified Tables
   - `guests` — add first_name, last_name, rsvp_status, dietary_requirements columns
   - `events` — add description, maps_url, image_url, rsvp_deadline, capacity columns
   - `guest_event_invites` — add invite_type column ('include' | 'exclude')
   - `gallery_items` — add gallery_id FK to galleries (nullable for backward compat)

4. Security
   - Enable RLS on all new tables
   - guest_group_members: host-only CRUD (via wedding ownership through guest → wedding)
   - website_content: host write, guest read (via wedding membership)
   - galleries: host write, guest read

5. Important Notes
   - All new columns are nullable or have defaults so existing rows remain valid
   - guest_group_members is ADDITIVE — the existing guests.group_id FK stays for backward compat
   - guest_event_invites.invite_type defaults to 'include' so existing rows keep working
*/

-- 1. Add columns to guests
ALTER TABLE guests ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS rsvp_status text DEFAULT 'pending';
ALTER TABLE guests ADD COLUMN IF NOT EXISTS dietary_requirements text;

-- 2. Add columns to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS maps_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rsvp_deadline date;
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity integer;

-- 3. Add invite_type to guest_event_invites
ALTER TABLE guest_event_invites ADD COLUMN IF NOT EXISTS invite_type text NOT NULL DEFAULT 'include';
ALTER TABLE guest_event_invites DROP CONSTRAINT IF EXISTS guest_event_invites_pkey;
ALTER TABLE guest_event_invites ADD PRIMARY KEY (guest_id, event_id);

-- 4. Create guest_group_members junction table
CREATE TABLE IF NOT EXISTS guest_group_members (
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES guest_groups(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (guest_id, group_id)
);
ALTER TABLE guest_group_members ENABLE ROW LEVEL SECURITY;

-- 5. Create website_content table
CREATE TABLE IF NOT EXISTS website_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  section text NOT NULL,
  title text,
  body text,
  image_url text,
  sort_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_website_content_wedding_section ON website_content(wedding_id, section);

-- 6. Create galleries table
CREATE TABLE IF NOT EXISTS galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

-- 7. Add gallery_id to gallery_items
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS gallery_id uuid REFERENCES galleries(id) ON DELETE SET NULL;

-- 8. RLS policies for guest_group_members (host-only via wedding ownership)
DROP POLICY IF EXISTS "host_select_group_members" ON guest_group_members;
CREATE POLICY "host_select_group_members" ON guest_group_members FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM guests g WHERE g.id = guest_group_members.guest_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = g.wedding_id AND w.created_by = auth.uid()))
  );
DROP POLICY IF EXISTS "host_insert_group_members" ON guest_group_members;
CREATE POLICY "host_insert_group_members" ON guest_group_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM guests g WHERE g.id = guest_group_members.guest_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = g.wedding_id AND w.created_by = auth.uid()))
  );
DROP POLICY IF EXISTS "host_delete_group_members" ON guest_group_members;
CREATE POLICY "host_delete_group_members" ON guest_group_members FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM guests g WHERE g.id = guest_group_members.guest_id
      AND EXISTS (SELECT 1 FROM weddings w WHERE w.id = g.wedding_id AND w.created_by = auth.uid()))
  );

-- 9. RLS policies for website_content
DROP POLICY IF EXISTS "host_select_content" ON website_content;
CREATE POLICY "host_select_content" ON website_content FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = website_content.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_insert_content" ON website_content;
CREATE POLICY "host_insert_content" ON website_content FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = website_content.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_update_content" ON website_content;
CREATE POLICY "host_update_content" ON website_content FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = website_content.wedding_id AND w.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = website_content.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_delete_content" ON website_content;
CREATE POLICY "host_delete_content" ON website_content FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = website_content.wedding_id AND w.created_by = auth.uid())
  );

-- 10. RLS policies for galleries
DROP POLICY IF EXISTS "host_select_galleries" ON galleries;
CREATE POLICY "host_select_galleries" ON galleries FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = galleries.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_insert_galleries" ON galleries;
CREATE POLICY "host_insert_galleries" ON galleries FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = galleries.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_update_galleries" ON galleries;
CREATE POLICY "host_update_galleries" ON galleries FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = galleries.wedding_id AND w.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = galleries.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_delete_galleries" ON galleries;
CREATE POLICY "host_delete_galleries" ON galleries FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = galleries.wedding_id AND w.created_by = auth.uid())
  );

-- 11. Add indexes
CREATE INDEX IF NOT EXISTS idx_guest_group_members_guest ON guest_group_members(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_group_members_group ON guest_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_guests_wedding ON guests(wedding_id);
CREATE INDEX IF NOT EXISTS idx_events_wedding ON events(wedding_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_wedding ON rsvps(wedding_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_guest ON rsvps(guest_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_groups_wedding ON guest_groups(wedding_id);
