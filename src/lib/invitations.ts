import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GuestInvitationOverride,
  SubEventGroupAssignment,
} from "./supabase";

export interface ResolvedInvitation {
  subEventId: string;
  invited: boolean;
  source: "override" | "group" | "default";
}

export async function resolveGuestInvitations(
  supabase: SupabaseClient,
  guestId: string,
  parentEventId: string
): Promise<ResolvedInvitation[]> {
  // Fetch all sub-events for the parent event
  const { data: subEvents, error: subEventsError } = await supabase
    .from("sub_events")
    .select("id")
    .eq("parent_event_id", parentEventId)
    .order("display_order", { ascending: true });

  if (subEventsError) throw subEventsError;
  if (!subEvents || subEvents.length === 0) return [];

  const subEventIds = subEvents.map((s) => s.id);

  // Fetch manual overrides for this guest
  const { data: overrides, error: overrideError } = await supabase
    .from("guest_invitation_overrides")
    .select("*")
    .eq("guest_id", guestId)
    .in("sub_event_id", subEventIds);

  if (overrideError) throw overrideError;

  const overrideMap = new Map<string, GuestInvitationOverride>();
  for (const o of overrides ?? []) {
    overrideMap.set((o as GuestInvitationOverride).sub_event_id, o as GuestInvitationOverride);
  }

  // Fetch group assignments for sub-events that don't have overrides
  const needsGroupLookup = subEventIds.filter((id) => !overrideMap.has(id));

  // Fetch guest's groups
  const { data: groupMembers, error: groupMemberError } = await supabase
    .from("guest_group_members")
    .select("group_id")
    .eq("guest_id", guestId);

  if (groupMemberError) throw groupMemberError;

  const guestGroupIds = (groupMembers ?? []).map((g) => (g as { group_id: string }).group_id);

  let groupAssignmentMap = new Map<string, boolean>();

  if (needsGroupLookup.length > 0 && guestGroupIds.length > 0) {
    const { data: groupAssignments, error: groupAssignError } = await supabase
      .from("sub_event_group_assignments")
      .select("*")
      .in("sub_event_id", needsGroupLookup)
      .in("group_id", guestGroupIds);

    if (groupAssignError) throw groupAssignError;

    for (const ga of groupAssignments ?? []) {
      const g = ga as SubEventGroupAssignment;
      groupAssignmentMap.set(g.sub_event_id, true);
    }
  }

  const result: ResolvedInvitation[] = subEventIds.map((subEventId) => {
    const override = overrideMap.get(subEventId);
    if (override) {
      return {
        subEventId,
        invited: override.is_invited,
        source: "override",
      };
    }
    if (groupAssignmentMap.has(subEventId)) {
      return {
        subEventId,
        invited: true,
        source: "group",
      };
    }
    return {
      subEventId,
      invited: false,
      source: "default",
    };
  });

  return result;
}

export function getInvitedSubEventIds(invitations: ResolvedInvitation[]): string[] {
  return invitations.filter((i) => i.invited).map((i) => i.subEventId);
}
