/*
# Fix guest_event_invites RLS policies for event platform

## Problem
The `guest_event_invites` table had RLS policies referencing the OLD schema
(`events` table with `wedding_id`, `guests` table with `wedding_id`).
The app now uses the NEW event platform (`user_events` with `creator_id`,
`event_guests` with `event_id`). Since `event_guests` has no `wedding_id`
column and `event_id` references `user_events` (not the old `events` table),
every INSERT failed the RLS ownership check — causing "Failed to invite"
errors in the bulk invite / manage invitations feature.

## Changes
1. Drop all existing policies on `guest_event_invites` (old-schema-based).
2. Create new policies using the event platform schema:
   - SELECT: event owner (`user_events.creator_id = auth.uid()`) can read;
     anon can read for guest-side invitation resolution.
   - INSERT: event owner can insert invites for their event + guests.
   - UPDATE: event owner can update invites.
   - DELETE: event owner can delete invites.
3. Ensure grants are correct for both `anon` and `authenticated`.

## Security
- Ownership is verified through `user_events.creator_id = auth.uid()`,
  matching the same pattern used on `event_guests`.
- The guest referenced by `guest_id` must belong to the same event
  (`event_guests.event_id = guest_event_invites.event_id`).
- Anon SELECT remains for guest-side invitation resolution (same as before).
*/

-- Drop all old policies
DROP POLICY IF EXISTS "guest_event_invites_member_all" ON guest_event_invites;
DROP POLICY IF EXISTS "host_insert_guest_event_invites" ON guest_event_invites;
DROP POLICY IF EXISTS "host_update_guest_event_invites" ON guest_event_invites;
DROP POLICY IF EXISTS "host_delete_guest_event_invites" ON guest_event_invites;
DROP POLICY IF EXISTS "anon_select_guest_event_invites" ON guest_event_invites;

-- SELECT: anon can read (for guest-side invitation resolution),
-- authenticated event owners can read their own invites
GRANT SELECT ON guest_event_invites TO anon, authenticated;

CREATE POLICY "anon_select_guest_event_invites" ON guest_event_invites FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "owner_select_guest_event_invites" ON guest_event_invites FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events
      WHERE user_events.id = guest_event_invites.event_id
      AND user_events.creator_id = auth.uid())
  );

-- INSERT: event owner can insert invites for guests in their event
GRANT INSERT ON guest_event_invites TO authenticated;

CREATE POLICY "owner_insert_guest_event_invites" ON guest_event_invites FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_events
      WHERE user_events.id = guest_event_invites.event_id
      AND user_events.creator_id = auth.uid())
    AND EXISTS (SELECT 1 FROM event_guests
      WHERE event_guests.id = guest_event_invites.guest_id
      AND event_guests.event_id = guest_event_invites.event_id)
  );

-- UPDATE: event owner can update invites
GRANT UPDATE ON guest_event_invites TO authenticated;

CREATE POLICY "owner_update_guest_event_invites" ON guest_event_invites FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events
      WHERE user_events.id = guest_event_invites.event_id
      AND user_events.creator_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_events
      WHERE user_events.id = guest_event_invites.event_id
      AND user_events.creator_id = auth.uid())
  );

-- DELETE: event owner can delete invites
GRANT DELETE ON guest_event_invites TO authenticated;

CREATE POLICY "owner_delete_guest_event_invites" ON guest_event_invites FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_events
      WHERE user_events.id = guest_event_invites.event_id
      AND user_events.creator_id = auth.uid())
  );
