/*
# Drop NOT NULL on sub_event_id now that PK is replaced

## Problem
The first migration dropped NOT NULL and re-added a PK (which forces
NOT NULL again). The second migration replaced the PK with a UNIQUE
index (NULLS NOT DISTINCT), but the column nullability was never
re-relaxed. The columns are still NOT NULL.

## Fix
- Drop NOT NULL on sub_event_id for guest_event_invites and
  group_event_invites. The UNIQUE index with NULLS NOT DISTINCT still
  enforces uniqueness for the Main Event (NULL) case.

## Security
- No RLS or grant changes.
*/

ALTER TABLE public.guest_event_invites ALTER COLUMN sub_event_id DROP NOT NULL;
ALTER TABLE public.group_event_invites ALTER COLUMN sub_event_id DROP NOT NULL;
