/*
# Update guest_resolve_invitations: direct invite wins over negative override

## Problem
The previous version treated any negative override (is_invited = false)
as removing access, even when the guest had a direct guest_event_invites
row. This meant a stale negative override could cancel a legitimate
group invitation.

## New precedence
For each sub-event (and the Main Event):
  1. Direct invite (guest_event_invites, invite_type = 'include') = invited, always wins.
  2. Positive override (is_invited = true) = invited.
  3. Negative override (is_invited = false) = NOT invited, ONLY if there is no direct invite.
  4. No invite and no override = NOT invited.

This ensures group invites (which create direct invites) are never
canceled by stale overrides, while the "Remove" button (which deletes
the direct invite) still works — once the direct invite is gone, any
remaining negative override takes effect.

## Security
- SECURITY DEFINER, search_path pinned to public, pg_temp.
- REVOKE from public/anon, GRANT to anon + authenticated (unchanged).
*/

CREATE OR REPLACE FUNCTION public.guest_resolve_invitations(p_guest_id uuid, p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_group_id uuid;
  v_guest_exists boolean;
  v_has_main_invite boolean;
  v_main_override boolean;
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

  -- Main Event: direct invite wins over negative override
  SELECT EXISTS (
    SELECT 1 FROM guest_event_invites i
    WHERE i.guest_id = p_guest_id AND i.event_id = p_event_id
      AND i.sub_event_id IS NULL AND i.invite_type = 'include'
  ) INTO v_has_main_invite;

  v_has_main_access := v_has_main_invite;

  -- If no direct invite, check for a positive override (and no negative override blocking it)
  IF NOT v_has_main_access THEN
    SELECT EXISTS (
      SELECT 1 FROM guest_invitation_overrides o
      WHERE o.guest_id = p_guest_id AND o.sub_event_id IS NULL
        AND o.is_invited = true
    ) AND NOT EXISTS (
      SELECT 1 FROM guest_invitation_overrides o
      WHERE o.guest_id = p_guest_id AND o.sub_event_id IS NULL
        AND o.is_invited = false
    ) INTO v_has_main_access;
  END IF;

  -- Sub-events: direct invite OR group invite OR positive override wins
  -- over negative override ONLY when no direct invite exists
  WITH direct AS (
    SELECT i.sub_event_id FROM guest_event_invites i
    WHERE i.guest_id = p_guest_id AND i.event_id = p_event_id
      AND i.sub_event_id IS NOT NULL AND i.invite_type = 'include'
  ),
  grp AS (
    SELECT gi.sub_event_id FROM group_event_invites gi
    WHERE gi.group_id = v_group_id AND gi.event_id = p_event_id
      AND gi.sub_event_id IS NOT NULL
  ),
  overrides AS (
    SELECT o.sub_event_id, o.is_invited FROM guest_invitation_overrides o
    WHERE o.guest_id = p_guest_id AND o.sub_event_id IS NOT NULL
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'subEventId', s.id,
           'subEventName', s.name,
           'isInvited',
             (s.id IN (SELECT sub_event_id FROM direct)
              OR s.id IN (SELECT sub_event_id FROM grp)
              OR EXISTS (SELECT 1 FROM overrides o WHERE o.sub_event_id = s.id AND o.is_invited = true))
             AND NOT (
               NOT (s.id IN (SELECT sub_event_id FROM direct))
               AND EXISTS (SELECT 1 FROM overrides o WHERE o.sub_event_id = s.id AND o.is_invited = false)
             )
         ) ORDER BY s.display_order NULLS LAST, s.date NULLS LAST), '[]'::jsonb)
  INTO v_result
  FROM sub_events s
  WHERE s.parent_event_id = p_event_id;

  RETURN jsonb_build_object('has_main_event_access', v_has_main_access, 'invitations', coalesce(v_result, '[]'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.guest_resolve_invitations(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.guest_resolve_invitations(uuid, uuid) TO anon, authenticated;
