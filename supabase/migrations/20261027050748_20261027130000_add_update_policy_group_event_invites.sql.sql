/*
# Add UPDATE RLS policy on group_event_invites

## Problem
The group invite feature uses an upsert (.upsert()) on group_event_invites.
The table has INSERT, DELETE, and SELECT policies but NO UPDATE policy.
When a row already exists for a (group_id, event_id, sub_event_id) tuple,
the upsert tries to UPDATE it, which RLS blocks — causing a silent failure.

## Changes
1. Add an UPDATE policy on group_event_invites scoped to the event owner,
   matching the same ownership predicate as the existing INSERT/DELETE/SELECT
   policies.

## Security
- The policy uses the same ownership check as all other group_event_invites
  policies: the group must belong to an event whose creator is the
  authenticated user.
- No grants changes needed — the existing grants already include UPDATE.
*/

DROP POLICY IF EXISTS "host_update_group_event_invites" ON group_event_invites;

CREATE POLICY "host_update_group_event_invites"
ON group_event_invites FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM guest_groups
    JOIN user_events ON user_events.id = guest_groups.event_id
    WHERE guest_groups.id = group_event_invites.group_id
    AND user_events.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM guest_groups
    JOIN user_events ON user_events.id = guest_groups.event_id
    WHERE guest_groups.id = group_event_invites.group_id
    AND user_events.creator_id = auth.uid()
  )
);