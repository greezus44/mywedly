import type { SupabaseClient } from "@supabase/supabase-js";
import { SubEventGroupAssignment, GuestInvitationOverride, GuestGroupMember } from "./supabase";

export interface ResolvedInvitation {
  subEventId: string;
  invited: boolean;
  source: "group" | "override" | "default";
}

/**
 * Resolve which sub-events a guest is invited to.
 *
 * Logic:
 * 1. Check GuestInvitationOverride for explicit per-guest, per-sub-event decisions.
 * 2. If no override, check SubEventGroupAssignment — if any of the guest's groups
 *    are assigned to the sub-event, the guest is invited.
 * 3. If no override and no group assignment exists for the sub-event, default to invited.
 */
export async function resolveGuestInvitations(
  supabase: SupabaseClient,
  guestId: string,
  parentEventId: string
): Promise<ResolvedInvitation[]> {
  // 1. Get all sub-events for the parent event
  const { data: subEvents, error: subEventError } = await supabase
    .from("sub_events")
    .select("id")
    .eq("parent_event_id", parentEventId);

  if (subEventError) throw subEventError;
  if (!subEvents || subEvents.length === 0) return [];

  const subEventIds = subEvents.map((s) => s.id);

  // 2. Get the guest's groups
  const { data: memberships, error: memberError } = await supabase
    .from("guest_group_members")
    .select("*")
    .eq("guest_id", guestId);

  if (memberError) throw memberError;
  const guestGroupIds = (memberships ?? []).map((m) => m.group_id);

  // 3. Get all group assignments for these sub-events
  let groupAssignments: SubEventGroupAssignment[] = [];
  if (guestGroupIds.length > 0) {
    const { data: assignments, error: assignError } = await supabase
      .from("sub_event_group_assignments")
      .select("*")
      .in("sub_event_id", subEventIds)
      .in("group_id", guestGroupIds) as { data: SubEventGroupAssignment[] | null; error: null };

    if (assignError) throw assignError;
    groupAssignments = assignments ?? [];
  }

  // 4. Get all overrides for this guest
  const { data: overrides, error: overrideError } = await supabase
    .from("guest_invitation_overrides")
    .select("*")
    .eq("guest_id", guestId)
    .in("sub_event_id", subEventIds) as { data: GuestInvitationOverride[] | null; error: null };

  if (overrideError) throw overrideError;

  const overrideMap = new Map<string, boolean>();
  for (const o of overrides ?? []) {
    overrideMap.set(o.sub_event_id, o.is_invited);
  }

  // 5. Build the assignment set for quick lookup
  const assignedSubEventIds = new Set(groupAssignments.map((a) => a.sub_event_id));

  // 6. Resolve each sub-event
  const results: ResolvedInvitation[] = subEventIds.map((subEventId) => {
    if (overrideMap.has(subEventId)) {
      return {
        subEventId,
        invited: overrideMap.get(subEventId)!,
        source: "override",
      };
    }

    if (assignedSubEventIds.has(subEventId)) {
      return {
        subEventId,
        invited: true,
        source: "group",
      };
    }

    // No override and no group assignment — default to invited
    return {
      subEventId,
      invited: true,
      source: "default",
    };
  });

  return results;
}

export function getInvitedSubEventIds(invitations: ResolvedInvitation[]): string[] {
  return invitations.filter((i) => i.invited).map((i) => i.subEventId);
}
