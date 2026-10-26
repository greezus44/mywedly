/*
# Fix group_event_invites primary key and foreign key

## Problem
The `group_event_invites` table had two bugs that prevented the
"Manage Groups" sub-event toggles from working:

1. The primary key was `(group_id, event_id)` and did NOT include
   `sub_event_id`. So a group could only have ONE invite row per event.
   Ticking a second sub-event checkbox for the same group failed with a
   duplicate-key error that was never surfaced to the UI, so the checkbox
   appeared to do nothing.

2. The `event_id` foreign key referenced the legacy `events` table, which
   has 0 rows. The application uses `user_events` (a separate table) as
   the event identifier, so every insert with a `user_events` id failed
   the FK constraint before it ever reached the duplicate-key issue.

## Changes
1. Drop the `group_event_invites_event_id_fkey` constraint (FK to events).
2. Add a new FK from `group_event_invites.event_id` to `user_events(id)`.
3. Drop the old primary key `(group_id, event_id)`.
4. Create a new primary key `(group_id, event_id, sub_event_id)`.
   Postgres treats NULL as distinct in unique constraints, so a row with
   `sub_event_id = NULL` (Main Event) and rows with specific sub_event_id
   values can coexist for the same group/event pair.

## Security
- No RLS or grant changes. Existing policies (scoped to `authenticated`
  with ownership checks via `user_events`) continue to apply.
*/

-- 1. Repoint event_id FK from events -> user_events
ALTER TABLE public.group_event_invites
  DROP CONSTRAINT IF EXISTS group_event_invites_event_id_fkey;

ALTER TABLE public.group_event_invites
  ADD CONSTRAINT group_event_invites_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.user_events(id) ON DELETE CASCADE;

-- 2. Update primary key to include sub_event_id
ALTER TABLE public.group_event_invites
  DROP CONSTRAINT IF EXISTS group_event_invites_pkey;

ALTER TABLE public.group_event_invites
  ADD PRIMARY KEY (group_id, event_id, sub_event_id);
