/*
# Eliminate guest_invitation_overrides as a source of truth, unify invitation system

## Problem
The `guest_invitation_overrides` table was created as a per-guest override system
but now conflicts with the direct-invite (`guest_event_invites`) and group-invite
(`group_event_invites`) tables. 98 stale negative overrides remain that block
group invites from working — when a group is invited to a sub-event, the negative
override still cancels the inherited group invite on the guest site.

## Changes

1. **Delete all remaining negative overrides** (`is_invited = false`).
   These are all stale rows that block group invites. After deletion, no
   negative overrides remain in the system.

2. **Rewrite `guest_resolve_invitations` RPC** to ignore the overrides table
   entirely. Invitation state is now determined by exactly two sources:
   - A direct `guest_event_invites` row (invite_type = 'include')
   - A `group_event_invites` row for the guest's group
   A guest is invited to a sub-event if EITHER source grants access.
   Main Event access = direct invite with sub_event_id IS NULL.
   (Group invites for Main Event are also honored if present.)

3. **No schema changes** — the `guest_invitation_overrides` table is left in
   place for safety but is no longer read or written by the application.

## Security
- No RLS or policy changes.
- The RPC remains SECURITY DEFINER with search_path pinned to public, pg_temp.
*/

-- Step 1: Delete all negative overrides that are blocking group invites
DELETE FROM guest_invitation_overrides WHERE is_invited = false;

-- Step 2: Rewrite the RPC to use only direct + group invites (no overrides)
CREATE OR REPLACE FUNCTION public.guest_resolve_invitations(p_guest_id uuid, p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_group_id uuid;
  v_guest_exists boolean;
  v_has_main_access boolean;
  v_result jsonb;
BEGIN
  SELECT g.group_id, true INTO v_group_id, v_guest_exists
  FROM event_guests g
  JOIN user_events e ON e.id = g.event_id
  WHERE g.id = p_guest_id AND g.event_id = p_event_id AND e.is_published = true
  LIMIT 1;

  IF NOT coalesce(v_guest_exists, false) THEN
    RETURN jsonb_build_object('has_main_event_access', false, 'invitations', '[]'::jsonb);
  END IF;

  -- Main Event access: direct invite OR group invite for Main Event
  SELECT EXISTS (
    SELECT 1 FROM guest_event_invites i
    WHERE i.guest_id = p_guest_id AND i.event_id = p_event_id
    AND i.sub_event_id IS NULL AND i.invite_type = 'include'
  ) OR EXISTS (
    SELECT 1 FROM group_event_invites gi
    WHERE gi.group_id = v_group_id AND gi.event_id = p_event_id
    AND gi.sub_event_id IS NULL
  ) INTO v_has_main_access;

  -- Sub-events: direct invite OR group invite
  WITH direct AS (
    SELECT i.sub_event_id FROM guest_event_invites i
    WHERE i.guest_id = p_guest_id AND i.event_id = p_event_id
    AND i.sub_event_id IS NOT NULL AND i.invite_type = 'include'
  ),
  grp AS (
    SELECT gi.sub_event_id FROM group_event_invites gi
    WHERE gi.group_id = v_group_id AND gi.event_id = p_event_id
    AND gi.sub_event_id IS NOT NULL
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'subEventId', s.id,
    'subEventName', s.name,
    'isInvited', (s.id IN (SELECT sub_event_id FROM direct) OR s.id IN (SELECT sub_event_id FROM grp))
  ) ORDER BY s.display_order NULLS LAST, s.date NULLS LAST), '[]'::jsonb)
  INTO v_result
  FROM sub_events s
  WHERE s.parent_event_id = p_event_id;

  RETURN jsonb_build_object('has_main_event_access', v_has_main_access, 'invitations', coalesce(v_result, '[]'::jsonb));
END;
$function$;