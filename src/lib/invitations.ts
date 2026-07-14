import { supabase, type EventGuest, type SubEventGroupAssignment, type GuestInvitationOverride } from "./supabase";

export interface ResolvedInvitation {
  subEventId: string;
  isInvited: boolean;
  source: "group" | "override" | "default";
}

export async function resolveGuestInvitations(
  guest: EventGuest,
  subEvents: { id: string; name: string }[],
): Promise<ResolvedInvitation[]> {
  if (subEvents.length === 0) return [];

  const groupId = guest.group_id;
  const guestId = guest.id;

  const [{ data: assignments }, { data: overrides }] = await Promise.all([
    groupId
      ? supabase
          .from("sub_event_group_assignments")
          .select("*")
          .eq("group_id", groupId)
      : Promise.resolve({ data: null as SubEventGroupAssignment[] | null, error: null }),
    supabase
      .from("guest_invitation_overrides")
      .select("*")
      .eq("guest_id", guestId),
  ]);

  const assignedSubEvents = new Set((assignments ?? []).map((a) => a.sub_event_id));
  const overrideMap = new Map((overrides ?? []).map((o: GuestInvitationOverride) => [o.sub_event_id, o.is_invited]));

  return subEvents.map((se) => {
    if (overrideMap.has(se.id)) {
      return { subEventId: se.id, isInvited: overrideMap.get(se.id)!, source: "override" as const };
    }
    if (assignedSubEvents.has(se.id)) {
      return { subEventId: se.id, isInvited: true, source: "group" as const };
    }
    return { subEventId: se.id, isInvited: false, source: "default" as const };
  });
}
