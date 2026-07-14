import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubEvent, GuestGroupMember, SubEventGroupAssignment, GuestInvitationOverride } from "./supabase";

export interface ResolvedInvitation {
  subEventId: string;
  invited: boolean;
  source: "group" | "override" | "default";
}

export interface ResolveResult {
  invitations: ResolvedInvitation[];
}

export async function resolveGuestInvitations(
  supabase: SupabaseClient,
  guestId: string,
  parentEventId: string,
): Promise<ResolveResult> {
  // Fetch sub-events for the parent event
  const { data: subEvents } = (await supabase
    .from("sub_events")
    .select("*")
    .eq("parent_event_id", parentEventId)) as { data: SubEvent[] | null };

  if (!subEvents || subEvents.length === 0) {
    return { invitations: [] };
  }

  // Fetch guest group memberships
  const { data: memberships } = (await supabase
    .from("guest_group_members")
    .select("*")
    .eq("guest_id", guestId)) as { data: GuestGroupMember[] | null };

  const groupIds = (memberships ?? []).map((m) => m.group_id);

  // Fetch sub_event_group_assignments
  let assignments: SubEventGroupAssignment[] = [];
  if (groupIds.length > 0) {
    const { data: assignmentData } = (await supabase
      .from("sub_event_group_assignments")
      .select("*")
      .in("group_id", groupIds)) as { data: SubEventGroupAssignment[] | null };
    assignments = assignmentData ?? [];
  }

  // Fetch guest_invitation_overrides for this guest
  const { data: overrideData } = (await supabase
    .from("guest_invitation_overrides")
    .select("*")
    .eq("guest_id", guestId)) as { data: GuestInvitationOverride[] | null };

  const overrides = overrideData ?? [];

  // Build a map of subEventId -> groupIds assigned
  const subEventGroupMap = new Map<string, Set<string>>();
  for (const a of assignments) {
    if (!subEventGroupMap.has(a.sub_event_id)) {
      subEventGroupMap.set(a.sub_event_id, new Set());
    }
    subEventGroupMap.get(a.sub_event_id)!.add(a.group_id);
  }

  // Build a map of subEventId -> is_invited override
  const overrideMap = new Map<string, boolean>();
  for (const o of overrides) {
    overrideMap.set(o.sub_event_id, o.is_invited);
  }

  const guestGroupSet = new Set(groupIds);

  const invitations: ResolvedInvitation[] = subEvents.map((sub) => {
    // Override takes precedence
    if (overrideMap.has(sub.id)) {
      return {
        subEventId: sub.id,
        invited: overrideMap.get(sub.id)!,
        source: "override",
      };
    }

    // Group assignment
    const assignedGroups = subEventGroupMap.get(sub.id);
    if (assignedGroups && guestGroupSet.size > 0) {
      const inGroup = Array.from(assignedGroups).some((g) => guestGroupSet.has(g));
      return {
        subEventId: sub.id,
        invited: inGroup,
        source: "group",
      };
    }

    // Default: invited if there are group assignments for this sub-event but guest is not in them,
    // or no group assignments at all (default invited)
    if (!assignedGroups || assignedGroups.size === 0) {
      return {
        subEventId: sub.id,
        invited: true,
        source: "default",
      };
    }

    return {
      subEventId: sub.id,
      invited: false,
      source: "group",
    };
  });

  return { invitations };
}

export function getInvitedSubEventIds(invitations: ResolvedInvitation[]): string[] {
  return invitations.filter((i) => i.invited).map((i) => i.subEventId);
}
