/*
# Fix guest username login on mobile — add anon SELECT on event_guests

## Problem
The guest sign-in flow queries `event_guests` by username using the anon key
(guests are not Supabase-authenticated). The table had no SELECT policy for
the `anon` role — only `authenticated` (the host) could read rows.

On desktop this appeared to work because the host was logged in with an
authenticated Supabase session, so `select_own_event_guests` allowed the read.
On mobile (no host session), the anon key was used and RLS returned zero rows,
producing "Username not found" for every valid username.

## Fix
Add a SELECT policy for `anon, authenticated` that allows reading guest rows
for published events. This is the same access pattern already used for
INSERT and UPDATE by guests (guest_insert_event_guests, guest_update_event_guests).

## Security
- anon can only SELECT guests for events where is_published = true.
- The host's authenticated policies remain unchanged.
- No other tables are affected.
*/

DROP POLICY IF EXISTS "anon_select_event_guests" ON event_guests;

CREATE POLICY "anon_select_event_guests" ON event_guests FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM user_events
            WHERE user_events.id = event_guests.event_id
              AND user_events.is_published = true)
  );
