/*
# Fix Main Event invitations: allow nullable sub_event_id

## Problem
The "Main Event" is represented in the app by a NULL `sub_event_id`.
The `sub_event_id` columns on `guest_event_invites`,
`group_event_invites`, and `guest_invitation_overrides` were NOT NULL,
so every attempt to invite a guest/group to the Main Event was silently
rejected by the database. The dashboard tick/invite would appear to
succeed, then revert to "not invited" once the data refetched.

## Changes
- guest_event_invites: drop PK + sub_event_id FK, make sub_event_id
  nullable, re-add FK and PK. NULL = Main Event.
- group_event_invites: same treatment.
- guest_invitation_overrides: make sub_event_id nullable, re-add FK,
  rebuild unique index with COALESCE for NULL Main Event overrides.

## Security
- No RLS or grant changes. No data is modified or deleted.
*/

-- 1. guest_event_invites
ALTER TABLE public.guest_event_invites DROP CONSTRAINT IF EXISTS guest_event_invites_pkey;
ALTER TABLE public.guest_event_invites DROP CONSTRAINT IF EXISTS guest_event_invites_sub_event_id_fkey;
ALTER TABLE public.guest_event_invites ALTER COLUMN sub_event_id DROP NOT NULL;
ALTER TABLE public.guest_event_invites
  ADD CONSTRAINT guest_event_invites_sub_event_id_fkey
  FOREIGN KEY (sub_event_id) REFERENCES public.sub_events(id) ON DELETE CASCADE;
ALTER TABLE public.guest_event_invites
  ADD PRIMARY KEY (guest_id, event_id, sub_event_id);

-- 2. group_event_invites
ALTER TABLE public.group_event_invites DROP CONSTRAINT IF EXISTS group_event_invites_pkey;
ALTER TABLE public.group_event_invites DROP CONSTRAINT IF EXISTS group_event_invites_sub_event_id_fkey;
ALTER TABLE public.group_event_invites ALTER COLUMN sub_event_id DROP NOT NULL;
ALTER TABLE public.group_event_invites
  ADD CONSTRAINT group_event_invites_sub_event_id_fkey
  FOREIGN KEY (sub_event_id) REFERENCES public.sub_events(id) ON DELETE CASCADE;
ALTER TABLE public.group_event_invites
  ADD PRIMARY KEY (group_id, event_id, sub_event_id);

-- 3. guest_invitation_overrides
ALTER TABLE public.guest_invitation_overrides DROP CONSTRAINT IF EXISTS guest_invitation_overrides_sub_event_id_fkey;
ALTER TABLE public.guest_invitation_overrides ALTER COLUMN sub_event_id DROP NOT NULL;
ALTER TABLE public.guest_invitation_overrides
  ADD CONSTRAINT guest_invitation_overrides_sub_event_id_fkey
  FOREIGN KEY (sub_event_id) REFERENCES public.sub_events(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS guest_invitation_overrides_unique;
CREATE UNIQUE INDEX guest_invitation_overrides_unique
  ON public.guest_invitation_overrides (guest_id, COALESCE(sub_event_id, '00000000-0000-0000-0000-000000000000'::uuid));
