/*
# Fix unrestricted INSERT policy on sharing_events

1. Security Changes
- Drop the existing `insert_sharing_events` policy that had `WITH CHECK (true)`, which allowed unrestricted inserts from anon/authenticated roles.
- Create a replacement INSERT policy that only allows inserts when the referenced `wedding_id` belongs to a published wedding. This lets guests (anon + authenticated) track visits/QR scans/link clicks/RSVPs for real weddings while preventing arbitrary data injection.

2. Important Notes
- The new policy checks `EXISTS` against the `weddings` table for `is_published = true`, so only public wedding events can be tracked.
- Anon access is still required because guest visit tracking happens before sign-in.
*/

DROP POLICY IF EXISTS "insert_sharing_events" ON sharing_events;

CREATE POLICY "insert_sharing_events" ON sharing_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = sharing_events.wedding_id
        AND weddings.is_published = true
    )
  );
