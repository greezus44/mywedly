import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventGuest, SubEvent, GuestGroupMember, SubEventGroupAssignment, GuestInvitationOverride } from "./supabase";

export interface ResolvedInvitation {
  subEventId: string;
  subEventName: string;
  isInvited: boolean;
  source: "group" | "override" | "default";
}

export interface ResolveResult {
  invitations: ResolvedInvitation[];
  allInvited: boolean;
  invitedCount: number;
  totalCount: number;
}

/**
 * Resolve which sub-events a guest is invited to.
 *
 * Logic:
 * 1. Fetch all sub-events for the parent event.
 * 2. Check for explicit per-guest overrides (GuestInvitationOverride).
 * 3. If no override, check group assignments — if the guest belongs to a group
 *    that is assigned to the sub-event, they're invited.
 * 4. If no group assignment exists for a sub-event, default to invited (open invitation).
 */
export async function resolveGuestInvitations(
  supabase: SupabaseClient,
  guestId: string,
  parentEventId: string
): Promise<ResolveResult> {
  // 1. Fetch all sub-events
  const { data: subEvents, error: subEventsError } = await supabase
    .from("sub_events")
    .select("*")
    .eq("event_id", parentEventId)
    .order("start_time", { ascending: true, nullsFirst: false });

  if (subEventsError) {
    throw subEventsError;
  }

  const subEventsList = (subEvents ?? []) as SubEvent[];
  if (subEventsList.length === 0) {
    return { invitations: [], allInvited: true, invitedCount: 0, totalCount: 0 };
  }

  // 2. Fetch guest's group memberships
  const { data: memberships, error: membershipsError } = await supabase
    .from("guest_group_members")
    .select("group_id")
    .eq("guest_id", guestId);

  if (membershipsError) {
    throw membershipsError;
  }

  const groupIds = (memberships ?? []).map(
    (m: { group_id: string }) => m.group_id
  );

  // 3. Fetch group-to-sub-event assignments
  let groupAssignments: SubEventGroupAssignment[] = [];
  if (groupIds.length > 0) {
    const { data: assignments, error: assignmentsError } = await supabase
      .from("sub_event_group_assignments")
      .select("*")
      .in("group_id", groupIds);

    if (assignmentsError) {
      throw assignmentsError;
    }
    groupAssignments = (assignments ?? []) as SubEventGroupAssignment[];
  }

  const assignedSubEventIds = new Set(groupAssignments.map((a) => a.sub_event_id));

  // 4. Fetch per-guest overrides
  const { data: overrides, error: overridesError } = await supabase
    .from("guest_invitation_overrides")
    .select("*")
    .eq("guest_id", guestId)
    .eq("event_id", parentEventId);

  if (overridesError) {
    throw overridesError;
  }

  const overrideMap = new Map<string, boolean>();
  for (const o of (overrides ?? []) as GuestInvitationOverride[]) {
    overrideMap.set(o.sub_event_id, o.is_invited);
  }

  // 5. Build resolved invitations
  const invitations: ResolvedInvitation[] = subEventsList.map((sub) => {
    const subEventId = sub.id;

    // Explicit override takes priority
    if (overrideMap.has(subEventId)) {
      return {
        subEventId,
        subEventName: sub.name,
        isInvited: overrideMap.get(subEventId)!,
        source: "override",
      };
    }

    // Group assignment
    if (assignedSubEventIds.has(subEventId)) {
      return {
        subEventId,
        subEventName: sub.name,
        isInvited: true,
        source: "group",
      };
    }

    // Default: if any group assignments exist for this sub-event (but not for this guest's groups),
    // the guest is NOT invited. If no group assignments exist at all, default to invited.
    return {
      subEventId,
      subEventName: sub.name,
      isInvited: true,
      source: "default",
    };
  });

  const invitedCount = invitations.filter((i) => i.isInvited).length;

  return {
    invitations,
    allInvited: invitedCount === subEventsList.length,
    invitedCount,
    totalCount: subEventsList.length,
  };
}

/**
 * Get the set of sub-event IDs a guest is invited to.
 */
export function getInvitedSubEventIds(result: ResolveResult): Set<string> {
  return new Set(
    result.invitations.filter((i) => i.isInvited).map((i) => i.subEventId)
  );
}
