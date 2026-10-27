/*
# Clean up stale negative invitation overrides

## Problem
The old "Edit Guest" form wrote a guest_invitation_overrides row with
is_invited = false for every sub-event a guest was NOT ticked for —
even when the guest had no direct invite to cancel. These 618 stale
rows now block group invitations: when a host invites a group to a
sub-event, a direct guest_event_invites row is created, but the stale
negative override immediately cancels it on both the dashboard and the
guest site.

## Fix
Delete guest_invitation_overrides rows where:
  - is_invited = false, AND
  - the guest has NO matching guest_event_invites row (same sub_event_id)
    with invite_type = 'include'.

This removes only the orphaned negative overrides — the ones that were
canceling invitations that no longer exist (or never existed). Legitimate
negative overrides (explicitly un-inviting a guest who has a direct
invite) are preserved.

Positive overrides (is_invited = true) are all preserved — they grant
access and never block anything.

## Security
- No RLS or grant changes. Data cleanup only.
*/

DELETE FROM public.guest_invitation_overrides o
WHERE o.is_invited = false
  AND NOT EXISTS (
    SELECT 1 FROM public.guest_event_invites i
    WHERE i.guest_id = o.guest_id
      AND (i.sub_event_id IS NOT DISTINCT FROM o.sub_event_id)
      AND i.invite_type = 'include'
  );
