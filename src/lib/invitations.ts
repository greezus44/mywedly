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
  parentEventId: string
): Promise<ResolveResult> {
  // Fetch all sub-events for the parent event
  const { data: subEvents, error: subEventsError } = await supabase
    .from("sub_events")
    .select("*")
    .eq("parent_event_id", parentEventId);

  if (subEventsError) {
    return { invitations: [] };
  }

  if (!subEvents || subEvents.length === 0) {
    return { invitations: [] };
  }

  // Fetch guest group memberships
  const { data: memberships, error: membershipsError } = await supabase
    .from("guest_group_members")
    .select("*")
    .eq("guest_id", guestId);

  if (membershipsError) {
    return { invitations: [] };
  }

  // Fetch sub_event_group_assignments
  const { data: assignments, error: assignmentsError } = await supabase
    .from("sub_event_group_assignments")
    .select("*");

  if (assignmentsError) {
    return { invitations: [] };
  }

  // Fetch guest_invitation_overrides for this guest
  const { data: overrides, error: overridesError } = await supabase
    .from("guest_invitation_overrides")
    .select("*")
    .eq("guest_id", guestId);

  if (overridesError) {
    return { invitations: [] };
  }

  const typedMemberships = (memberships ?? []) as GuestGroupMember[];
  const typedAssignments = (assignments ?? []) as SubEventGroupAssignment[];
  const typedOverrides = (overrides ?? []) as GuestInvitationOverride[];

  const guestGroupIds = new Set(typedMemberships.map((m) => m.group_id));
  const overrideMap = new Map<string, boolean>();
  for (const o of typedOverrides) {
    overrideMap.set(o.sub_event_id, o.is_invited);
  }
  const assignmentMap = new Map<string, Set<string>>();
  for (const a of typedAssignments) {
    if (!assignmentMap.has(a.sub_event_id)) {
      assignmentMap.set(a.sub_event_id, new Set());
    }
    assignmentMap.get(a.sub_event_id)!.add(a.group_id);
  }

  const invitations: ResolvedInvitation[] = (subEvents as SubEvent[]).map((se) => {
    // Override takes precedence over group, group over default
    if (overrideMap.has(se.id)) {
      return {
        subEventId: se.id,
        invited: overrideMap.get(se.id)!,
        source: "override",
      };
    }
    const assignedGroups = assignmentMap.get(se.id);
    if (assignedGroups && guestGroupIds.size > 0) {
      const hasGroup = Array.from(assignedGroups).some((g) => guestGroupIds.has(g));
      if (hasGroup) {
        return {
          subEventId: se.id,
          invited: true,
          source: "group",
        };
      }
      // Group assignments exist for this sub-event but guest is not in any — not invited
      return {
        subEventId: se.id,
        invited: false,
        source: "group",
      };
    }
    // Default: invited (no restrictions defined)
    return {
      subEventId: se.id,
      invited: true,
      source: "default",
    };
  });

  return { invitations };
}

export function getInvitedSubEventIds(invitations: ResolvedInvitation[]): string[] {
  return invitations.filter((i) => i.invited).map((i) => i.subEventId);
}
