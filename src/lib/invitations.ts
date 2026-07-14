import type { SupabaseClient } from "@supabase/supabase-js";

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
  // Fetch sub-events for the parent event
  const { data: subEvents } = await supabase
    .from("sub_events")
    .select("id")
    .eq("parent_event_id", parentEventId);

  if (!subEvents || subEvents.length === 0) {
    return { invitations: [] };
  }

  // Fetch guest group memberships
  const { data: memberships } = await supabase
    .from("guest_group_members")
    .select("*")
    .eq("guest_id", guestId);

  const groupIds = (memberships ?? []).map((m: { group_id: string }) => m.group_id);

  // Fetch sub_event_group_assignments for the groups the guest belongs to
  let groupAssignments: { sub_event_id: string; group_id: string }[] = [];
  if (groupIds.length > 0) {
    const { data } = await supabase
      .from("sub_event_group_assignments")
      .select("sub_event_id, group_id")
      .in("group_id", groupIds);
    groupAssignments = data ?? [];
  }

  // Map: subEventId -> Set of groupIds assigned
  const subEventGroupMap = new Map<string, Set<string>>();
  for (const a of groupAssignments) {
    if (!subEventGroupMap.has(a.sub_event_id)) {
      subEventGroupMap.set(a.sub_event_id, new Set());
    }
    subEventGroupMap.get(a.sub_event_id)!.add(a.group_id);
  }

  // Fetch guest_invitation_overrides for this guest
  const { data: overrides } = await supabase
    .from("guest_invitation_overrides")
    .select("*")
    .eq("guest_id", guestId);

  const overrideMap = new Map<string, boolean>();
  for (const o of overrides ?? []) {
    overrideMap.set(o.sub_event_id, o.is_invited);
  }

  const invitations: ResolvedInvitation[] = subEvents.map((se: { id: string }) => {
    const subEventId = se.id;

    // Override takes precedence
    if (overrideMap.has(subEventId)) {
      return {
        subEventId,
        invited: overrideMap.get(subEventId)!,
        source: "override",
      };
    }

    // Group assignment next
    const groups = subEventGroupMap.get(subEventId);
    if (groups && groups.size > 0) {
      return {
        subEventId,
        invited: true,
        source: "group",
      };
    }

    // Default: not invited (no group assignment and no override)
    return {
      subEventId,
      invited: false,
      source: "default",
    };
  });

  return { invitations };
}

export function getInvitedSubEventIds(invitations: ResolvedInvitation[]): string[] {
  return invitations.filter((i) => i.invited).map((i) => i.subEventId);
}
