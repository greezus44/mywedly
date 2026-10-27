/*
# Update guest_resolve_invitations to honor Main Event + sub-event invites

## Purpose
The previous version of guest_resolve_invitations granted Main Event
access to every guest whose event was published, and derived sub-event
invitations from sub_event_group_assignments + direct invites. It never
read the guest_event_invites table for the Main Event, and it ignored
per-guest overrides for the Main Event.

Now that the dashboard stores Main Event invitations as rows in
guest_event_invites with sub_event_id = NULL, the guest site must honor
them. A guest with no Main Event invite and no sub-event invites should
be blocked (has_main_event_access = false and no invited sub-events).

## New logic
1. Look up the guest row (must exist, event must be published).
2. Main Event access = true iff:
   - a guest_event_invites row exists with sub_event_id IS NULL and
     invite_type = 'include', AND
   - no guest_invitation_overrides row with sub_event_id IS NULL and
     is_invited = false exists (override removes Main Event access).
3. For each sub-event, isInvited = true iff:
   - the guest has a guest_event_invites row for that sub_event_id with
     invite_type = 'include', OR a group_event_invites row for the
     guest's group + that sub_event_id, AND
   - no guest_invitation_overrides row with is_invited = false for that
     sub_event_id exists (override removes access).
   - A guest_invitation_overrides row with is_invited = true grants
     access even without a guest_event_invites row.
4. Return has_main_event_access + the sub-event invitation list, as
   before.

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

  -- Main Event access: direct invite minus negative override
  SELECT EXISTS (
    SELECT 1 FROM guest_event_invites i
    WHERE i.guest_id = p_guest_id AND i.event_id = p_event_id
      AND i.sub_event_id IS NULL AND i.invite_type = 'include'
  ) INTO v_has_main_invite;

  SELECT NOT EXISTS (
    SELECT 1 FROM guest_invitation_overrides o
    WHERE o.guest_id = p_guest_id AND o.sub_event_id IS NULL
      AND o.is_invited = false
  ) INTO v_main_override;

  -- If a positive override exists for Main Event, treat as invited
  SELECT EXISTS (
    SELECT 1 FROM guest_invitation_overrides o
    WHERE o.guest_id = p_guest_id AND o.sub_event_id IS NULL
      AND o.is_invited = true
  ) INTO v_has_main_access;

  v_has_main_access := coalesce(v_has_main_access, false) OR (v_has_main_invite AND v_main_override);

  -- Sub-events: direct invite OR group invite OR positive override,
  -- minus negative override
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
             coalesce(o.is_invited,
               (s.id IN (SELECT sub_event_id FROM direct)
                OR s.id IN (SELECT sub_event_id FROM grp)))
             AND NOT EXISTS (
               SELECT 1 FROM overrides o2
               WHERE o2.sub_event_id = s.id AND o2.is_invited = false
             )
         ) ORDER BY s.display_order NULLS LAST, s.date NULLS LAST), '[]'::jsonb)
  INTO v_result
  FROM sub_events s
  LEFT JOIN overrides o ON o.sub_event_id = s.id
  WHERE s.parent_event_id = p_event_id;

  RETURN jsonb_build_object('has_main_event_access', v_has_main_access, 'invitations', coalesce(v_result, '[]'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.guest_resolve_invitations(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.guest_resolve_invitations(uuid, uuid) TO anon, authenticated;
