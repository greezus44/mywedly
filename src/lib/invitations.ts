import { supabase } from "./supabase";
import type { EventGuest, GuestGroupMember, SubEventGroupAssignment, GuestInvitationOverride, SubEvent } from "./supabase";

export interface ResolvedInvitation {
  guest: EventGuest;
  subEvents: SubEvent[];
  invitedSubEventIds: string[];
  allSubEventsInvited: boolean;
}

export async function resolveGuestInvitations(
  eventId: string,
  guestId: string
): Promise<ResolvedInvitation | null> {
  const { data: guest, error: guestError } = await supabase
    .from("event_guests")
    .select("*")
    .eq("id", guestId)
    .eq("event_id", eventId)
    .single();

  if (guestError || !guest) return null;

  const { data: subEvents } = await supabase
    .from("sub_events")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  const { data: groupMembers } = await supabase
    .from("guest_group_members")
    .select("*")
    .eq("guest_id", guestId);

  const groupIds = (groupMembers ?? []).map((m: GuestGroupMember) => m.group_id);

  let assignedSubEventIds: string[] = [];

  if (groupIds.length > 0) {
    const { data: assignments } = await supabase
      .from("sub_event_group_assignments")
      .select("*")
      .in("group_id", groupIds);

    assignedSubEventIds = (assignments ?? []).map(
      (a: SubEventGroupAssignment) => a.sub_event_id
    );
  }

  const { data: overrides } = await supabase
    .from("guest_invitation_overrides")
    .select("*")
    .eq("guest_id", guestId);

  const overrideList = overrides ?? [];
  const explicitAllow = new Set<string>();
  const explicitDeny = new Set<string>();

  for (const o of overrideList as GuestInvitationOverride[]) {
    if (o.sub_event_id) {
      if (o.allowed) {
        explicitAllow.add(o.sub_event_id);
      } else {
        explicitDeny.add(o.sub_event_id);
      }
    }
  }

  const invitedSubEventIds = (subEvents ?? []).map((s: SubEvent) => s.id).filter((id: string) => {
    if (explicitDeny.has(id)) return false;
    if (explicitAllow.has(id)) return true;
    return assignedSubEventIds.includes(id);
  });

  const allSubEventsInvited = invitedSubEventIds.length === (subEvents ?? []).length;

  return {
    guest,
    subEvents: subEvents ?? [],
    invitedSubEventIds,
    allSubEventsInvited,
  };
}

export async function getInvitedSubEventIds(
  eventId: string,
  guestId: string
): Promise<string[]> {
  const resolved = await resolveGuestInvitations(eventId, guestId);
  return resolved?.invitedSubEventIds ?? [];
}
