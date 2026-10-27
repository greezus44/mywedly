/*
# Use UNIQUE index (NULLS NOT DISTINCT) instead of PK for nullable sub_event_id

## Problem
Postgres primary key columns are always NOT NULL, so the prior migration's
re-adding the PK on (guest_id, event_id, sub_event_id) silently made
sub_event_id NOT NULL again, defeating the nullable change. We cannot
have a nullable column in a PK.

## Fix
- Drop the PK on guest_event_invites and group_event_invites.
- Replace each with a UNIQUE index using NULLS NOT DISTINCT, so NULL
  (Main Event) is treated as equal for uniqueness but the column stays
  nullable.
- Add an `id` surrogate column is NOT needed; the unique index enforces
  one Main Event row + one per sub-event per guest/group.

## Security
- No RLS or grant changes.
*/

-- guest_event_invites: drop PK, replace with UNIQUE index NULLS NOT DISTINCT
ALTER TABLE public.guest_event_invites DROP CONSTRAINT IF EXISTS guest_event_invites_pkey;

CREATE UNIQUE INDEX IF NOT EXISTS guest_event_invites_guest_event_sub_unique
  ON public.guest_event_invites (guest_id, event_id, sub_event_id)
  NULLS NOT DISTINCT;

-- group_event_invites: drop PK, replace with UNIQUE index NULLS NOT DISTINCT
ALTER TABLE public.group_event_invites DROP CONSTRAINT IF EXISTS group_event_invites_pkey;

CREATE UNIQUE INDEX IF NOT EXISTS group_event_invites_group_event_sub_unique
  ON public.group_event_invites (group_id, event_id, sub_event_id)
  NULLS NOT DISTINCT;
