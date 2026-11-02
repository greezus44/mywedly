/*
# Track which group an invitation came from, and clear it when the group is uninvited

1. Behaviour
- Every invitation created because a group was invited (or because a guest joined an invited group) now records the group it came from.
- Removing a group from an event or sub-event removes only the invitations that came from that group. Guests invited individually keep their invitation.
- Moving a guest out of a group removes the invitations that came from their old group.
- Inviting a guest individually claims the invitation, so it is kept when the group is later removed.

2. Schema changes
- `guest_event_invites.source_group_id` (uuid, nullable): the group that caused the invitation. Empty for individual invitations. Cleared to empty if the group is deleted.
- Index on (source_group_id, event_id, sub_event_id) for the removal lookups.

3. Existing data
- No existing rows are changed. Invitations created before this migration have no recorded source, so they are treated as individual invitations and are not removed when their group is uninvited.

4. Security
- The new removal function runs with elevated rights, like the existing invitation sync functions, so it can clear rows regardless of the caller's policies.
- EXECUTE is revoked from public roles; triggers still fire normally.
*/

ALTER TABLE public.guest_event_invites
  ADD COLUMN IF NOT EXISTS source_group_id uuid REFERENCES public.guest_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_guest_event_invites_source_group
  ON public.guest_event_invites (source_group_id, event_id, sub_event_id)
  WHERE source_group_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_guest_invites_from_group_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.group_id IS NOT NULL AND OLD.group_id IS DISTINCT FROM NEW.group_id THEN
    DELETE FROM public.guest_event_invites
    WHERE guest_id = NEW.id AND source_group_id = OLD.group_id;
  END IF;

  IF NEW.group_id IS NOT NULL THEN
    INSERT INTO public.guest_event_invites (guest_id, event_id, sub_event_id, invite_type, source_group_id)
    SELECT NEW.id, gei.event_id, gei.sub_event_id, 'include', NEW.group_id
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
  INSERT INTO public.guest_event_invites (guest_id, event_id, sub_event_id, invite_type, source_group_id)
  SELECT eg.id, NEW.event_id, NEW.sub_event_id, 'include', NEW.group_id
  FROM public.event_guests eg
  WHERE eg.group_id = NEW.group_id AND eg.event_id = NEW.event_id
  ON CONFLICT (guest_id, event_id, sub_event_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_group_members_invites_on_group_uninvite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.guest_event_invites
  WHERE source_group_id = OLD.group_id
    AND event_id = OLD.event_id
    AND sub_event_id IS NOT DISTINCT FROM OLD.sub_event_id;
  RETURN OLD;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_guest_invites_from_group_membership() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_group_members_from_group_invite() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.remove_group_members_invites_on_group_uninvite() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_remove_group_members_invites_on_group_uninvite ON public.group_event_invites;
CREATE TRIGGER trg_remove_group_members_invites_on_group_uninvite
AFTER DELETE ON public.group_event_invites
FOR EACH ROW EXECUTE FUNCTION public.remove_group_members_invites_on_group_uninvite();
