/*
# Fix Guest RLS: Add authenticated role to guest SELECT policies

## Problem
The guest SELECT policies on `sub_event_group_assignments` and
`guest_invitation_overrides` were scoped to `anon` only. When a host
is signed in via Supabase auth and views the guest RSVP page (or when
any client has an authenticated session), these tables return zero
rows, silently breaking group-based event invitations and per-guest
overrides — including +1 permissions.

## Fix
Drop and recreate the two guest SELECT policies to include both
`anon` and `authenticated` roles, matching the pattern already used
by `guest_event_invites`, `guest_group_members`, and other guest-read
tables.

## Security
No new access is granted beyond what `anon` already had. The
`authenticated` role gains the same read access that `anon` already
has — both can only see rows belonging to published events. Host-only
policies (INSERT/UPDATE/DELETE) are unchanged.
*/

-- sub_event_group_assignments: allow authenticated guests to read
DROP POLICY IF EXISTS "guest_select_sub_event_group_assignments" ON sub_event_group_assignments;
CREATE POLICY "guest_select_sub_event_group_assignments"
ON sub_event_group_assignments FOR SELECT
TO anon, authenticated
USING (EXISTS ( SELECT 1
   FROM (sub_events se
     JOIN user_events ue ON ((ue.id = se.parent_event_id)))
  WHERE ((se.id = sub_event_group_assignments.sub_event_id) AND (ue.is_published = true))));

-- guest_invitation_overrides: allow authenticated guests to read
DROP POLICY IF EXISTS "guest_select_guest_invitation_overrides" ON guest_invitation_overrides;
CREATE POLICY "guest_select_guest_invitation_overrides"
ON guest_invitation_overrides FOR SELECT
TO anon, authenticated
USING (EXISTS ( SELECT 1
   FROM (sub_events se
     JOIN user_events ue ON ((ue.id = se.parent_event_id)))
  WHERE ((se.id = guest_invitation_overrides.sub_event_id) AND (ue.is_published = true))));