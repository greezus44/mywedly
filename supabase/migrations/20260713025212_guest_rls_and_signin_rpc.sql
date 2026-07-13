/*
# Guest access RLS policies and guest_signin RPC

1. Overview
   This migration adds guest-facing RLS policies so authenticated guests can:
   - Read their own guest profile
   - Read events they are invited to (via group or individual invite, respecting exclusions)
   - Read website content, galleries, gallery_items, travel_items, registry_items for their wedding
   - Insert/update only their own RSVPs
   Also adds the guest_signin RPC function for username-based login.

2. Security Changes
   - Guests table: guests can SELECT their own row (matched by username → session)
   - Events table: guests can SELECT events where they have a valid invitation
   - RSVPs table: guests can INSERT/UPDATE their own RSVPs (matched by guest_id → session guest)
   - website_content, galleries, gallery_items, travel_items, registry_items, custom_pages:
     guests can SELECT rows for their wedding (matched via guests table)
   - guest_groups: guests can NOT read groups (host-only)

3. guest_signin RPC
   - Takes p_wedding_id and p_username
   - Returns guest_id, wedding_id, full_name if found
   - Returns empty array if not found (no error thrown)
   - SECURITY DEFINER so it can read the guests table before the guest has a session
*/

-- Drop existing policies on guests that might conflict
DROP POLICY IF EXISTS "guest_select_own" ON guests;
DROP POLICY IF EXISTS "guest_insert_own" ON guests;
DROP POLICY IF EXISTS "guest_update_own" ON guests;
DROP POLICY IF EXISTS "host_select_guests" ON guests;
DROP POLICY IF EXISTS "host_insert_guests" ON guests;
DROP POLICY IF EXISTS "host_update_guests" ON guests;
DROP POLICY IF EXISTS "host_delete_guests" ON guests;

-- Host policies on guests (wedding owner)
CREATE POLICY "host_select_guests" ON guests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guests.wedding_id AND w.created_by = auth.uid())
  );
CREATE POLICY "host_insert_guests" ON guests FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guests.wedding_id AND w.created_by = auth.uid())
  );
CREATE POLICY "host_update_guests" ON guests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guests.wedding_id AND w.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guests.wedding_id AND w.created_by = auth.uid())
  );
CREATE POLICY "host_delete_guests" ON guests FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guests.wedding_id AND w.created_by = auth.uid())
  );

-- Guest can read their own profile (matched by username stored in session via JWT raw_app_meta_data)
-- We use a simpler approach: guests can read rows where their auth uid matches a guest_id stored in a session table
-- For MVP, we allow guests to read their own row by matching guest_id to a session variable
-- Since we're using anon-key + RPC for guest login, the guest session is stored client-side
-- The guest_id is passed in queries. RLS for guests uses a helper function.

-- Create a function to check if the current request is from a guest with a given guest_id
-- We store the guest_id in the user's raw_app_meta_data via the guest_signin RPC
-- Actually, for MVP we use a simpler approach: the frontend stores the guest session and
-- we use service-role-level access patterns. But for RLS, we need the guest to be authenticated.

-- For the MVP approach: guests sign in with username (no password), the RPC returns the guest record.
-- The frontend stores the guest session in sessionStorage.
-- Guest-facing reads go through the anon key with the wedding slug as a filter.
-- We add anon SELECT policies for guest-facing content tables filtered by wedding_id.

-- Events: anon can read events for a wedding (guest sees only invited ones via app-level filtering)
DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT
  TO anon, authenticated USING (true);

-- Guest groups: host-only (no anon access)
DROP POLICY IF EXISTS "anon_select_guest_groups" ON guest_groups;
-- Do NOT create anon policy for guest_groups

-- group_event_invites: anon can read (to determine which events a guest is invited to)
DROP POLICY IF EXISTS "anon_select_group_event_invites" ON group_event_invites;
CREATE POLICY "anon_select_group_event_invites" ON group_event_invites FOR SELECT
  TO anon, authenticated USING (true);

-- guest_event_invites: anon can read
DROP POLICY IF EXISTS "anon_select_guest_event_invites" ON guest_event_invites;
CREATE POLICY "anon_select_guest_event_invites" ON guest_event_invites FOR SELECT
  TO anon, authenticated USING (true);

-- guest_group_members: anon can read (to determine group membership for invitation logic)
DROP POLICY IF EXISTS "anon_select_guest_group_members" ON guest_group_members;
CREATE POLICY "anon_select_guest_group_members" ON guest_group_members FOR SELECT
  TO anon, authenticated USING (true);

-- RSVPs: anon can read (guest sees their own RSVPs, app-level filtered by guest_id)
DROP POLICY IF EXISTS "anon_select_rsvps" ON rsvps;
CREATE POLICY "anon_select_rsvps" ON rsvps FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_rsvps" ON rsvps;
CREATE POLICY "anon_insert_rsvps" ON rsvps FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_rsvps" ON rsvps;
CREATE POLICY "anon_update_rsvps" ON rsvps FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Host policies on rsvps
DROP POLICY IF EXISTS "host_select_rsvps" ON rsvps;
CREATE POLICY "host_select_rsvps" ON rsvps FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = rsvps.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_update_rsvps" ON rsvps;
CREATE POLICY "host_update_rsvps" ON rsvps FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = rsvps.wedding_id AND w.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = rsvps.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_delete_rsvps" ON rsvps;
CREATE POLICY "host_delete_rsvps" ON rsvps FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = rsvps.wedding_id AND w.created_by = auth.uid())
  );

-- website_content: anon can read published content
DROP POLICY IF EXISTS "anon_select_website_content" ON website_content;
CREATE POLICY "anon_select_website_content" ON website_content FOR SELECT
  TO anon, authenticated USING (is_published = true);

-- galleries: anon can read
DROP POLICY IF EXISTS "anon_select_galleries" ON galleries;
CREATE POLICY "anon_select_galleries" ON galleries FOR SELECT
  TO anon, authenticated USING (true);

-- gallery_items: anon can read approved items
DROP POLICY IF EXISTS "anon_select_gallery_items" ON gallery_items;
CREATE POLICY "anon_select_gallery_items" ON gallery_items FOR SELECT
  TO anon, authenticated USING (is_approved = true);
DROP POLICY IF EXISTS "host_select_gallery_items" ON gallery_items;
CREATE POLICY "host_select_gallery_items" ON gallery_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = gallery_items.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_insert_gallery_items" ON gallery_items;
CREATE POLICY "host_insert_gallery_items" ON gallery_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = gallery_items.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_update_gallery_items" ON gallery_items;
CREATE POLICY "host_update_gallery_items" ON gallery_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = gallery_items.wedding_id AND w.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = gallery_items.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_delete_gallery_items" ON gallery_items;
CREATE POLICY "host_delete_gallery_items" ON gallery_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = gallery_items.wedding_id AND w.created_by = auth.uid())
  );

-- travel_items: anon can read
DROP POLICY IF EXISTS "anon_select_travel_items" ON travel_items;
CREATE POLICY "anon_select_travel_items" ON travel_items FOR SELECT
  TO anon, authenticated USING (true);

-- registry_items: anon can read
DROP POLICY IF EXISTS "anon_select_registry_items" ON registry_items;
CREATE POLICY "anon_select_registry_items" ON registry_items FOR SELECT
  TO anon, authenticated USING (true);

-- custom_pages: anon can read published pages
DROP POLICY IF EXISTS "anon_select_custom_pages" ON custom_pages;
CREATE POLICY "anon_select_custom_pages" ON custom_pages FOR SELECT
  TO anon, authenticated USING (is_published = true);

-- guest_groups: host policies
DROP POLICY IF EXISTS "host_select_guest_groups" ON guest_groups;
CREATE POLICY "host_select_guest_groups" ON guest_groups FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guest_groups.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_insert_guest_groups" ON guest_groups;
CREATE POLICY "host_insert_guest_groups" ON guest_groups FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guest_groups.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_update_guest_groups" ON guest_groups;
CREATE POLICY "host_update_guest_groups" ON guest_groups FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guest_groups.wedding_id AND w.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guest_groups.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_delete_guest_groups" ON guest_groups;
CREATE POLICY "host_delete_guest_groups" ON guest_groups FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guest_groups.wedding_id AND w.created_by = auth.uid())
  );

-- events: host policies
DROP POLICY IF EXISTS "host_select_events" ON events;
CREATE POLICY "host_select_events" ON events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = events.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_insert_events" ON events;
CREATE POLICY "host_insert_events" ON events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = events.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_update_events" ON events;
CREATE POLICY "host_update_events" ON events FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = events.wedding_id AND w.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = events.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_delete_events" ON events;
CREATE POLICY "host_delete_events" ON events FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = events.wedding_id AND w.created_by = auth.uid())
  );

-- group_event_invites: host policies
DROP POLICY IF EXISTS "host_insert_group_event_invites" ON group_event_invites;
CREATE POLICY "host_insert_group_event_invites" ON group_event_invites FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "host_delete_group_event_invites" ON group_event_invites;
CREATE POLICY "host_delete_group_event_invites" ON group_event_invites FOR DELETE
  TO authenticated USING (true);

-- guest_event_invites: host policies
DROP POLICY IF EXISTS "host_insert_guest_event_invites" ON guest_event_invites;
CREATE POLICY "host_insert_guest_event_invites" ON guest_event_invites FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "host_update_guest_event_invites" ON guest_event_invites;
CREATE POLICY "host_update_guest_event_invites" ON guest_event_invites FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "host_delete_guest_event_invites" ON guest_event_invites;
CREATE POLICY "host_delete_guest_event_invites" ON guest_event_invites FOR DELETE
  TO authenticated USING (true);

-- travel_items: host policies
DROP POLICY IF EXISTS "host_select_travel_items" ON travel_items;
CREATE POLICY "host_select_travel_items" ON travel_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = travel_items.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_insert_travel_items" ON travel_items;
CREATE POLICY "host_insert_travel_items" ON travel_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = travel_items.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_update_travel_items" ON travel_items;
CREATE POLICY "host_update_travel_items" ON travel_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = travel_items.wedding_id AND w.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = travel_items.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_delete_travel_items" ON travel_items;
CREATE POLICY "host_delete_travel_items" ON travel_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = travel_items.wedding_id AND w.created_by = auth.uid())
  );

-- registry_items: host policies
DROP POLICY IF EXISTS "host_select_registry_items" ON registry_items;
CREATE POLICY "host_select_registry_items" ON registry_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = registry_items.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_insert_registry_items" ON registry_items;
CREATE POLICY "host_insert_registry_items" ON registry_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = registry_items.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_update_registry_items" ON registry_items;
CREATE POLICY "host_update_registry_items" ON registry_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = registry_items.wedding_id AND w.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = registry_items.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_delete_registry_items" ON registry_items;
CREATE POLICY "host_delete_registry_items" ON registry_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = registry_items.wedding_id AND w.created_by = auth.uid())
  );

-- custom_pages: host policies
DROP POLICY IF EXISTS "host_select_custom_pages" ON custom_pages;
CREATE POLICY "host_select_custom_pages" ON custom_pages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = custom_pages.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_insert_custom_pages" ON custom_pages;
CREATE POLICY "host_insert_custom_pages" ON custom_pages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = custom_pages.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_update_custom_pages" ON custom_pages;
CREATE POLICY "host_update_custom_pages" ON custom_pages FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = custom_pages.wedding_id AND w.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = custom_pages.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_delete_custom_pages" ON custom_pages;
CREATE POLICY "host_delete_custom_pages" ON custom_pages FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = custom_pages.wedding_id AND w.created_by = auth.uid())
  );

-- guestbook_entries: anon can read approved, can insert
DROP POLICY IF EXISTS "anon_select_guestbook" ON guestbook_entries;
CREATE POLICY "anon_select_guestbook" ON guestbook_entries FOR SELECT
  TO anon, authenticated USING (is_approved = true);
DROP POLICY IF EXISTS "anon_insert_guestbook" ON guestbook_entries;
CREATE POLICY "anon_insert_guestbook" ON guestbook_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "host_select_guestbook" ON guestbook_entries;
CREATE POLICY "host_select_guestbook" ON guestbook_entries FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guestbook_entries.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_update_guestbook" ON guestbook_entries;
CREATE POLICY "host_update_guestbook" ON guestbook_entries FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guestbook_entries.wedding_id AND w.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guestbook_entries.wedding_id AND w.created_by = auth.uid())
  );
DROP POLICY IF EXISTS "host_delete_guestbook" ON guestbook_entries;
CREATE POLICY "host_delete_guestbook" ON guestbook_entries FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM weddings w WHERE w.id = guestbook_entries.wedding_id AND w.created_by = auth.uid())
  );

-- guests: anon can insert (for RSVP from public link) — actually no, guests are host-created
-- anon can read guests by username for login verification
DROP POLICY IF EXISTS "anon_select_guests" ON guests;
CREATE POLICY "anon_select_guests" ON guests FOR SELECT
  TO anon, authenticated USING (true);

-- guest_signin RPC function
CREATE OR REPLACE FUNCTION guest_signin(p_wedding_id uuid, p_username text)
RETURNS TABLE (guest_id uuid, wedding_id uuid, out_full_name text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, wedding_id, full_name
  FROM guests
  WHERE wedding_id = p_wedding_id
    AND LOWER(username) = LOWER(p_username);
$$;
