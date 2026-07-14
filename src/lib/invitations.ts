import type { SupabaseClient } from "@supabase/supabase-js";

export interface ResolvedInvitation {
  subEventId: string;
  invited: boolean;
  source: "group" | "override";
}

/**
 * Resolves whether a guest is invited to each sub-event of a parent event.
 *
 * Logic:
 *  1. Fetch all sub-events for the parent event.
 *  2. Fetch the guest's group memberships (guest_group_members -> guest_groups).
 *  3. Fetch sub_event_group_assignments for those groups.
 *  4. Fetch guest_invitation_overrides for the guest.
 *  5. For each sub-event, determine invited status:
 *     - If an override exists, use its is_invited value.
 *     - Otherwise, invited if any of the guest's groups are assigned to the sub-event.
 */
export async function resolveGuestInvitations(
  supabase: SupabaseClient,
  guestId: string,
  parentEventId: string,
): Promise<ResolvedInvitation[]> {
  const { data: subEvents, error: subEventsError } = await supabase
    .from("sub_events")
    .select("id")
    .eq("parent_event_id", parentEventId);

  if (subEventsError) throw subEventsError;
  if (!subEvents || subEvents.length === 0) return [];

  const subEventIds = subEvents.map((s) => s.id);

  // Get guest's group memberships
  const { data: memberships, error: membershipError } = await supabase
    .from("guest_group_members")
    .select("group_id")
    .eq("guest_id", guestId);

  if (membershipError) throw membershipError;

  const groupIds = (memberships ?? []).map((m) => m.group_id);

  // Get group assignments for sub-events
  let assignedSubEventIds = new Set<string>();
  if (groupIds.length > 0) {
    const { data: assignments, error: assignmentError } = await supabase
      .from("sub_event_group_assignments")
      .select("sub_event_id, group_id")
      .in("sub_event_id", subEventIds)
      .in("group_id", groupIds);

    if (assignmentError) throw assignmentError;

    assignedSubEventIds = new Set((assignments ?? []).map((a) => a.sub_event_id));
  }

  // Get overrides for the guest
  const { data: overrides, error: overrideError } = await supabase
    .from("guest_invitation_overrides")
    .select("sub_event_id, is_invited")
    .eq("guest_id", guestId)
    .in("sub_event_id", subEventIds);

  if (overrideError) throw overrideError;

  const overrideMap = new Map<string, boolean>();
  for (const o of overrides ?? []) {
    overrideMap.set(o.sub_event_id, o.is_invited);
  }

  const result: ResolvedInvitation[] = subEventIds.map((subEventId) => {
    if (overrideMap.has(subEventId)) {
      return {
        subEventId,
        invited: overrideMap.get(subEventId) ?? false,
        source: "override",
      };
    }
    return {
      subEventId,
      invited: assignedSubEventIds.has(subEventId),
      source: "group",
    };
  });

  return result;
}

export function getInvitedSubEventIds(invitations: ResolvedInvitation[]): string[] {
  return invitations.filter((i) => i.invited).map((i) => i.subEventId);
}
