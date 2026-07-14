import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "./supabase";

export interface ResolvedInvitation {
  subEventId: string;
  subEventName: string;
  isInvited: boolean;
  source: "default" | "group" | "override";
}

export interface ResolveResult {
  invitations: ResolvedInvitation[];
}

interface SubEventRow {
  id: string;
  name: string;
}

interface GroupAssignmentRow {
  sub_event_id: string;
}

interface GroupMemberRow {
  group_id: string;
}

interface OverrideRow {
  sub_event_id: string;
  is_invited: boolean;
}

export async function resolveGuestInvitations(
  supabase: SupabaseClient,
  guestId: string,
  parentEventId: string
): Promise<ResolveResult> {
  if (!guestId || !parentEventId) {
    return { invitations: [] };
  }

  // 1. Fetch all sub-events for the parent event
  const { data: subEvents, error: subError } = await supabase
    .from("sub_events")
    .select("id, name")
    .eq("event_id", parentEventId)
    .order("sort_order", { ascending: true });

  if (subError) {
    return { invitations: [] };
  }

  const subEventRows = (subEvents ?? []) as SubEventRow[];
  if (subEventRows.length === 0) {
    return { invitations: [] };
  }

  // 2. Fetch guest's group memberships
  const { data: groupMembers } = await supabase
    .from("guest_group_members")
    .select("group_id")
    .eq("guest_id", guestId);

  const groupIds = ((groupMembers ?? []) as GroupMemberRow[]).map((m) => m.group_id);

  // 3. Fetch group assignments for those groups
  let assignedSubEventIds = new Set<string>();
  if (groupIds.length > 0) {
    const { data: assignments } = await supabase
      .from("sub_event_group_assignments")
      .select("sub_event_id")
      .in("group_id", groupIds);

    assignedSubEventIds = new Set(
      ((assignments ?? []) as GroupAssignmentRow[]).map((a) => a.sub_event_id)
    );
  }

  // 4. Fetch per-guest overrides
  const { data: overrides } = await supabase
    .from("guest_invitation_overrides")
    .select("sub_event_id, is_invited")
    .eq("guest_id", guestId);

  const overrideMap = new Map<string, boolean>();
  for (const o of (overrides ?? []) as OverrideRow[]) {
    overrideMap.set(o.sub_event_id, o.is_invited);
  }

  // 5. Resolve: override > group > default (invited)
  const invitations: ResolvedInvitation[] = subEventRows.map((se) => {
    if (overrideMap.has(se.id)) {
      return {
        subEventId: se.id,
        subEventName: se.name,
        isInvited: overrideMap.get(se.id) ?? false,
        source: "override",
      };
    }
    if (assignedSubEventIds.size > 0) {
      // If there are group assignments, only invited if in a group
      return {
        subEventId: se.id,
        subEventName: se.name,
        isInvited: assignedSubEventIds.has(se.id),
        source: "group",
      };
    }
    // Default: invited to all
    return {
      subEventId: se.id,
      subEventName: se.name,
      isInvited: true,
      source: "default",
    };
  });

  return { invitations };
}

export function getInvitedSubEventIds(result: ResolveResult): string[] {
  return result.invitations.filter((i) => i.isInvited).map((i) => i.subEventId);
}

// Re-export Json for convenience
export type { Json };
