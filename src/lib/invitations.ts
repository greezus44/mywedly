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
  const [subEventsRes, membershipsRes, assignmentsRes, overridesRes] = await Promise.all([
    supabase.from("sub_events").select("*").eq("parent_event_id", parentEventId),
    supabase.from("guest_group_members").select("*").eq("guest_id", guestId),
    supabase.from("sub_event_group_assignments").select("*"),
    supabase.from("guest_invitation_overrides").select("*").eq("guest_id", guestId),
  ]);

  const subEvents = (subEventsRes.data ?? []) as { id: string }[];
  const memberships = (membershipsRes.data ?? []) as { group_id: string }[];
  const assignments = (assignmentsRes.data ?? []) as { sub_event_id: string; group_id: string }[];
  const overrides = (overridesRes.data ?? []) as { sub_event_id: string; is_invited: boolean }[];

  const groupIds = new Set(memberships.map((m) => m.group_id));
  const assignmentMap = new Map<string, Set<string>>();
  for (const a of assignments) {
    if (!assignmentMap.has(a.sub_event_id)) assignmentMap.set(a.sub_event_id, new Set());
    assignmentMap.get(a.sub_event_id)!.add(a.group_id);
  }
  const overrideMap = new Map<string, boolean>();
  for (const o of overrides) {
    overrideMap.set(o.sub_event_id, o.is_invited);
  }

  const invitations: ResolvedInvitation[] = subEvents.map((se) => {
    if (overrideMap.has(se.id)) {
      return { subEventId: se.id, invited: overrideMap.get(se.id)!, source: "override" as const };
    }
    const assignedGroups = assignmentMap.get(se.id);
    if (assignedGroups && assignedGroups.size > 0) {
      const inGroup = [...assignedGroups].some((g) => groupIds.has(g));
      return { subEventId: se.id, invited: inGroup, source: "group" as const };
    }
    return { subEventId: se.id, invited: true, source: "default" as const };
  });

  return { invitations };
}

export function getInvitedSubEventIds(invitations: ResolvedInvitation[]): string[] {
  return invitations.filter((i) => i.invited).map((i) => i.subEventId);
}
