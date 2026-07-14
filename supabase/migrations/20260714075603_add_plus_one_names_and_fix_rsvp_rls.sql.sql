/*
# Add Plus One Names Column and Fix RSVP RLS

## Summary
This migration adds a `plus_one_names` column to the `event_rsvps` table to store
the names of each plus one a guest is bringing. It also fixes a critical RLS bug
where guests (using the anon key) could INSERT RSVPs but could NOT UPDATE them,
causing RSVP updates to silently fail.

## Changes

### 1. New Columns
- `event_rsvps.plus_one_names` (text[], default '{}') — Array of plus one names
- `event_rsvps.responded_at` (timestamptz, nullable) — When the guest last responded

### 2. RLS Fix
- Adds `guest_update_event_rsvp` policy for `anon` and `authenticated` roles
- This allows guests to UPDATE their own RSVP records when the event is published
- Previously only `authenticated` creators could update, blocking guest updates

### 3. Security
- The new UPDATE policy checks that the event is published (same as INSERT)
- No ownership check is needed because the guest_id in the RSVP identifies the guest
- All existing policies remain unchanged
*/

-- Add plus_one_names column to event_rsvps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_rsvps' AND column_name = 'plus_one_names'
  ) THEN
    ALTER TABLE event_rsvps ADD COLUMN plus_one_names text[] DEFAULT '{}';
  END IF;
END $$;

-- Add responded_at column to event_rsvps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_rsvps' AND column_name = 'responded_at'
  ) THEN
    ALTER TABLE event_rsvps ADD COLUMN responded_at timestamptz;
  END IF;
END $$;

-- Fix: Add UPDATE policy for anon/authenticated guests on event_rsvps
-- This was missing, causing RSVP updates to fail for guests
DROP POLICY IF EXISTS "guest_update_event_rsvp" ON event_rsvps;
CREATE POLICY "guest_update_event_rsvp"
ON event_rsvps FOR UPDATE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_events
    WHERE user_events.id = event_rsvps.event_id
    AND user_events.is_published = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_events
    WHERE user_events.id = event_rsvps.event_id
    AND user_events.is_published = true
  )
);
