/*
# Automatically invite group members to events their group is invited to

1. Behaviour
- When a guest is added to a group, or moved into a group, that is already invited to an event (Main Event or a sub-event), the guest receives a direct invitation to the same event(s).
- When a group is newly invited to an event (Main Event or a sub-event), every current member receives that invitation.
- Removing a group invitation does NOT remove members' own direct invitations.

2. Backfill
- Existing group members of already-invited groups are invited now. Re-running is safe because duplicates are skipped.

3. Security
- Both trigger functions run with elevated rights so they can write invitation rows regardless of the caller's policies.
- EXECUTE is revoked from public roles; triggers still fire normally.

4. Notes
- Only inserts are made. No invitation rows are deleted or changed.
*/

CREATE OR REPLACE FUNCTION public.sync_guest_invites_from_group_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.group_id IS NOT NULL THEN
    INSERT INTO public.guest_event_invites (guest_id, event_id, sub_event_id, invite_type)
    SELECT NEW.id, gei.event_id, gei.sub_event_id, 'include'
    FROM public.group_event_invites gei
    WHERE gei.group_id = NEW.group_id AND gei.event_id = NEW.event_id
    ON CONFLICT (guest_id, event_id, sub_event_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_group_members_from_group_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.guest_event_invites (guest_id, event_id, sub_event_id, invite_type)
  SELECT eg.id, NEW.event_id, NEW.sub_event_id, 'include'
  FROM public.event_guests eg
  WHERE eg.group_id = NEW.group_id AND eg.event_id = NEW.event_id
  ON CONFLICT (guest_id, event_id, sub_event_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_guest_invites_from_group_membership() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_group_members_from_group_invite() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_guest_invites_from_group_membership ON public.event_guests;
CREATE TRIGGER trg_sync_guest_invites_from_group_membership
AFTER INSERT OR UPDATE OF group_id ON public.event_guests
FOR EACH ROW EXECUTE FUNCTION public.sync_guest_invites_from_group_membership();

DROP TRIGGER IF EXISTS trg_sync_group_members_from_group_invite ON public.group_event_invites;
CREATE TRIGGER trg_sync_group_members_from_group_invite
AFTER INSERT ON public.group_event_invites
FOR EACH ROW EXECUTE FUNCTION public.sync_group_members_from_group_invite();

INSERT INTO public.guest_event_invites (guest_id, event_id, sub_event_id, invite_type)
SELECT eg.id, gei.event_id, gei.sub_event_id, 'include'
FROM public.group_event_invites gei
JOIN public.event_guests eg ON eg.group_id = gei.group_id AND eg.event_id = gei.event_id
ON CONFLICT (guest_id, event_id, sub_event_id) DO NOTHING;
