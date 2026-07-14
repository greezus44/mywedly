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
  parentEventId: string,
): Promise<ResolveResult> {
  const [subEventsRes, membershipsRes, overridesRes] = await Promise.all([
    supabase
      .from("sub_events")
      .select("id")
      .eq("parent_event_id", parentEventId),
    supabase
      .from("guest_group_members")
      .select("*")
      .eq("guest_id", guestId),
    supabase
      .from("guest_invitation_overrides")
      .select("*")
      .eq("guest_id", guestId),
  ]);

  const subEventIds: string[] = (subEventsRes.data ?? []).map((s: { id: string }) => s.id);

  let assignmentsData: { sub_event_id: string; group_id: string }[] = [];
  if (subEventIds.length > 0) {
    const assignmentsRes = await supabase
      .from("sub_event_group_assignments")
      .select("sub_event_id, group_id")
      .in("sub_event_id", subEventIds);
    assignmentsData = (assignmentsRes.data ?? []) as { sub_event_id: string; group_id: string }[];
  }

  const groupIds: string[] = (membershipsRes.data ?? []).map((m: { group_id: string }) => m.group_id);
  const assignmentMap = new Map<string, Set<string>>();
  for (const a of assignmentsData) {
    let set = assignmentMap.get(a.sub_event_id);
    if (!set) {
      set = new Set();
      assignmentMap.set(a.sub_event_id, set);
    }
    set.add(a.group_id);
  }
  const overrideMap = new Map<string, boolean>();
  for (const o of (overridesRes.data ?? []) as { sub_event_id: string; is_invited: boolean }[]) {
    overrideMap.set(o.sub_event_id, o.is_invited);
  }

  const invitations: ResolvedInvitation[] = subEventIds.map((subEventId) => {
    if (overrideMap.has(subEventId)) {
      return {
        subEventId,
        invited: overrideMap.get(subEventId)!,
        source: "override",
      };
    }
    const assignedGroups = assignmentMap.get(subEventId);
    if (assignedGroups && groupIds.some((g) => assignedGroups.has(g))) {
      return { subEventId, invited: true, source: "group" };
    }
    return { subEventId, invited: true, source: "default" };
  });

  return { invitations };
}

export function getInvitedSubEventIds(invitations: ResolvedInvitation[]): string[] {
  return invitations.filter((i) => i.invited).map((i) => i.subEventId);
}
