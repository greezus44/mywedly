-- Guest invitation resolution moved server-side so the guest site no longer needs
-- anonymous read access to guest, group, assignment or override tables.
CREATE OR REPLACE FUNCTION public.guest_resolve_invitations(p_guest_id uuid, p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_group_id uuid;
  v_exists boolean;
  v_result jsonb;
BEGIN
  SELECT g.group_id, true INTO v_group_id, v_exists
  FROM event_guests g
  JOIN user_events e ON e.id = g.event_id
  WHERE g.id = p_guest_id AND g.event_id = p_event_id AND e.is_published = true
  LIMIT 1;

  IF NOT coalesce(v_exists, false) THEN
    RETURN jsonb_build_object('has_main_event_access', false, 'invitations', '[]'::jsonb);
  END IF;

  WITH group_ids AS (
    SELECT v_group_id AS group_id WHERE v_group_id IS NOT NULL
    UNION
    SELECT m.group_id FROM guest_group_members m WHERE m.guest_id = p_guest_id
  ),
  assigned AS (
    SELECT a.sub_event_id FROM sub_event_group_assignments a
    WHERE a.group_id IN (SELECT group_id FROM group_ids)
  ),
  direct AS (
    SELECT i.sub_event_id FROM guest_event_invites i
    WHERE i.guest_id = p_guest_id AND i.invite_type = 'include' AND i.sub_event_id IS NOT NULL
  ),
  overrides AS (
    SELECT o.sub_event_id, o.is_invited FROM guest_invitation_overrides o
    WHERE o.guest_id = p_guest_id
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'subEventId', s.id,
           'subEventName', s.name,
           'isInvited', coalesce(o.is_invited,
             (s.id IN (SELECT sub_event_id FROM assigned) OR s.id IN (SELECT sub_event_id FROM direct)))
         ) ORDER BY s.display_order NULLS LAST, s.date NULLS LAST), '[]'::jsonb)
  INTO v_result
  FROM sub_events s
  LEFT JOIN overrides o ON o.sub_event_id = s.id
  WHERE s.parent_event_id = p_event_id;

  RETURN jsonb_build_object('has_main_event_access', true, 'invitations', coalesce(v_result, '[]'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.guest_resolve_invitations(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.guest_resolve_invitations(uuid, uuid) TO anon, authenticated;
