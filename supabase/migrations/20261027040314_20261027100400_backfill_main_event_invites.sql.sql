/*
# Backfill Main Event invitations for existing guests

## Purpose
After making sub_event_id nullable on guest_event_invites, insert a Main
Event invitation (sub_event_id = NULL) for every existing guest who does
not already have one. This preserves existing access so no one is locked
out of the guest site.

## Security
- Read-only select + insert of new rows only. No RLS or grant changes.
*/

INSERT INTO public.guest_event_invites (guest_id, event_id, sub_event_id, invite_type)
SELECT g.id, g.event_id, NULL, 'include'
FROM public.event_guests g
WHERE NOT EXISTS (
  SELECT 1 FROM public.guest_event_invites i
  WHERE i.guest_id = g.id
    AND i.event_id = g.event_id
    AND i.sub_event_id IS NULL
);
