import type { SupabaseClient } from "@supabase/supabase-js";

export interface ResolvedInvitation {
  subEventId: string;
  invited: boolean;
  source: "group" | "override" | "default";
}

export interface ResolveResult {
  invitations: ResolvedInvitation[];
}

interface SubEventRow {
  id: string;
}

interface GroupMemberRow {
  group_id: string;
}

interface SubEventGroupAssignmentRow {
  sub_event_id: string;
  group_id: string;
}

interface GuestInvitationOverrideRow {
  sub_event_id: string;
  is_invited: boolean;
}

export async function resolveGuestInvitations(
  supabase: SupabaseClient,
  guestId: string,
  parentEventId: string
): Promise<ResolveResult> {
  const [subEventsRes, membershipsRes, assignmentsRes, overridesRes] = await Promise.all([
    supabase.from("sub_events").select("id").eq("parent_event_id", parentEventId),
    supabase.from("guest_group_members").select("*").eq("guest_id", guestId),
    supabase.from("sub_event_group_assignments").select("sub_event_id, group_id"),
    supabase.from("guest_invitation_overrides").select("*").eq("guest_id", guestId),
  ]);

  const subEvents = (subEventsRes.data ?? []) as SubEventRow[];
  const memberships = (membershipsRes.data ?? []) as GroupMemberRow[];
  const assignments = (assignmentsRes.data ?? []) as SubEventGroupAssignmentRow[];
  const overrides = (overridesRes.data ?? []) as GuestInvitationOverrideRow[];

  const guestGroupIds = new Set(memberships.map((m) => m.group_id));
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
      return { subEventId: se.id, invited: overrideMap.get(se.id)!, source: "override" };
    }
    const groupIds = assignmentMap.get(se.id);
    if (groupIds && guestGroupIds.size > 0) {
      for (const gid of groupIds) {
        if (guestGroupIds.has(gid)) {
          return { subEventId: se.id, invited: true, source: "group" };
        }
      }
    }
    return { subEventId: se.id, invited: true, source: "default" };
  });

  return { invitations };
}

export function getInvitedSubEventIds(invitations: ResolvedInvitation[]): string[] {
  return invitations.filter((i) => i.invited).map((i) => i.subEventId);
}
