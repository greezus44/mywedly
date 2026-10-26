/*
# Update guest_event_invites primary key to include sub_event_id

## Problem
The primary key on `guest_event_invites` was `(guest_id, event_id)`, but
the table also has a `sub_event_id` column for per-sub-event invitations.
With the old PK, a guest could only have ONE invite row per event,
making it impossible to invite them to multiple sub-events. Bulk invites
would also fail with duplicate-key errors if any guest already had a row.

## Changes
1. Drop the old primary key constraint.
2. Create a new primary key on `(guest_id, event_id, sub_event_id)`.
   Note: PostgreSQL treats NULL as distinct in unique constraints, so
   a row with `sub_event_id = NULL` and one with a specific sub_event_id
   can coexist for the same guest/event pair.

## Security
- No RLS or grant changes (policies already updated in prior migration).
*/

ALTER TABLE guest_event_invites DROP CONSTRAINT guest_event_invites_pkey;
ALTER TABLE guest_event_invites ADD PRIMARY KEY (guest_id, event_id, sub_event_id);
