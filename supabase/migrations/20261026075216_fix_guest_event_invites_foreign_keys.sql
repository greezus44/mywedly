/*
# Fix broken foreign keys on guest_event_invites

## What changed
The `guest_event_invites` table has two foreign keys that point to the
wrong (legacy, empty) tables:

- `guest_event_invites_event_id_fkey` → `events(id)` (0 rows)
- `guest_event_invites_guest_id_fkey` → `guests(id)` (0 rows)

The rest of the app uses `user_events` (1+ rows) and `event_guests`
(100+ rows). The `open_rsvp_register` SECURITY DEFINER function inserts
a guest into `event_guests`, then tries to insert into
`guest_event_invites` referencing that `event_guests.id` and
`user_events.id` — but the FKs require the ids to exist in `events` and
`guests` (both empty). Every insert fails with a FK violation, which the
guest-facing RSVP page surfaces as "We couldn't submit your RSVP."

This migration drops the two wrong FKs and recreates them pointing to the
correct tables: `user_events(id)` for `event_id` and `event_guests(id)`
for `guest_id`, with `ON DELETE CASCADE` to match the original intent.

## Security
- No RLS / policy / grant changes.
- No column changes — only constraint replacement.
*/

ALTER TABLE public.guest_event_invites
  DROP CONSTRAINT IF EXISTS guest_event_invites_event_id_fkey,
  DROP CONSTRAINT IF EXISTS guest_event_invites_guest_id_fkey;

ALTER TABLE public.guest_event_invites
  ADD CONSTRAINT guest_event_invites_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.user_events(id) ON DELETE CASCADE,
  ADD CONSTRAINT guest_event_invites_guest_id_fkey
    FOREIGN KEY (guest_id) REFERENCES public.event_guests(id) ON DELETE CASCADE;
