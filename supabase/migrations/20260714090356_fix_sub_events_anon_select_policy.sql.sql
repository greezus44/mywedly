/*
# Fix Public Website Not Loading — Add anon SELECT policy to sub_events

## Summary
The `sub_events` table has RLS enabled but only has `authenticated` (owner-scoped)
SELECT/INSERT/UPDATE/DELETE policies. There is NO `anon` SELECT policy.

When a guest visits the public invitation website, the frontend uses the Supabase
anon key. Without an `anon` SELECT policy on `sub_events`, all queries to this
table return zero rows. This means:
- The RSVP page shows "No Events to RSVP" even when events exist
- The invitation resolver can't determine which events a guest is invited to
- The guest website appears broken/empty

## Fix
Add a `guest_select_sub_events` SELECT policy for `anon` and `authenticated`
that allows reading sub_events when the parent event is published.

## Security
- Only published parent events expose their sub_events publicly
- Unpublished/draft events remain private (only the creator can see them)
- No write access is granted to anon
*/

DROP POLICY IF EXISTS "guest_select_sub_events" ON sub_events;
CREATE POLICY "guest_select_sub_events"
ON sub_events FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_events
    WHERE user_events.id = sub_events.parent_event_id
    AND user_events.is_published = true
  )
);
