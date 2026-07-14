import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubEvent, GuestGroupMember, SubEventGroupAssignment, GuestInvitationOverride } from "./supabase";

export interface ResolvedInvitation {
  subEventId: string;
  invited: boolean;
  source: "group" | "override" | "default";
}

export async function resolveGuestInvitations(
  supabase: SupabaseClient,
  guestId: string,
  parentEventId: string
): Promise<ResolvedInvitation[]> {
  // 1. Fetch all sub_events for the parent event
  const { data: subEvents, error: subEventsError } = await supabase
    .from("sub_events")
    .select("*")
    .eq("parent_event_id", parentEventId);

  if (subEventsError) throw subEventsError;

  const subEventList = (subEvents ?? []) as SubEvent[];
  if (subEventList.length === 0) return [];

  // 2. Fetch the guest's group memberships
  const { data: memberships, error: membershipsError } = await supabase
    .from("guest_group_members")
    .select("*")
    .eq("guest_id", guestId);

  if (membershipsError) throw membershipsError;

  const memberList = (memberships ?? []) as GuestGroupMember[];
  const guestGroupIds = memberList.map((m) => m.group_id);

  // 3. Fetch all sub_event_group_assignments for those groups
  let groupAssignments: SubEventGroupAssignment[] = [];
  if (guestGroupIds.length > 0) {
    const { data: assignments, error: assignmentsError } = await supabase
      .from("sub_event_group_assignments")
      .select("*")
      .in("group_id", guestGroupIds);

    if (assignmentsError) throw assignmentsError;
    groupAssignments = (assignments ?? []) as SubEventGroupAssignment[];
  }

  // Map: subEventId -> Set of groupIds assigned
  const assignmentsBySubEvent = new Map<string, Set<string>>();
  for (const assignment of groupAssignments) {
    if (!assignmentsBySubEvent.has(assignment.sub_event_id)) {
      assignmentsBySubEvent.set(assignment.sub_event_id, new Set());
    }
    assignmentsBySubEvent.get(assignment.sub_event_id)!.add(assignment.group_id);
  }

  // 4. Fetch all guest_invitation_overrides for this guest
  const { data: overridesData, error: overridesError } = await supabase
    .from("guest_invitation_overrides")
    .select("*")
    .eq("guest_id", guestId);

  if (overridesError) throw overridesError;

  const overrides = (overridesData ?? []) as GuestInvitationOverride[];
  const overridesBySubEvent = new Map<string, GuestInvitationOverride>();
  for (const override of overrides) {
    overridesBySubEvent.set(override.sub_event_id, override);
  }

  // 5. For each sub_event, determine if invited
  const results: ResolvedInvitation[] = subEventList.map((subEvent) => {
    const override = overridesBySubEvent.get(subEvent.id);

    // Check override first — it takes precedence
    if (override) {
      return {
        subEventId: subEvent.id,
        invited: override.is_invited,
        source: "override",
      };
    }

    // Check group assignments
    const assignedGroupIds = assignmentsBySubEvent.get(subEvent.id);
    if (assignedGroupIds && assignedGroupIds.size > 0) {
      // Check if any of the guest's groups are assigned
      const hasGroupMatch = guestGroupIds.some((gid) => assignedGroupIds.has(gid));
      if (hasGroupMatch) {
        return {
          subEventId: subEvent.id,
          invited: true,
          source: "group",
        };
      }
    }

    // Default: not invited
    return {
      subEventId: subEvent.id,
      invited: false,
      source: "default",
    };
  });

  return results;
}

export function getInvitedSubEventIds(invitations: ResolvedInvitation[]): string[] {
  return invitations.filter((inv) => inv.invited).map((inv) => inv.subEventId);
}
