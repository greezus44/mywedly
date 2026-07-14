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
  parentEventId: string,
): Promise<ResolvedInvitation[]> {
  const [subEventsRes, membershipsRes, assignmentsRes, overridesRes] = await Promise.all([
    supabase
      .from("sub_events")
      .select("*")
      .eq("parent_event_id", parentEventId)
      .order("display_order", { ascending: true }),
    supabase
      .from("guest_group_members")
      .select("*")
      .eq("guest_id", guestId),
    supabase
      .from("sub_event_group_assignments")
      .select("*")
      .in("sub_event_id", (
        await supabase
          .from("sub_events")
          .select("id")
          .eq("parent_event_id", parentEventId)
      ).data?.map((r) => r.id) ?? []),
    supabase
      .from("guest_invitation_overrides")
      .select("*")
      .eq("guest_id", guestId),
  ]);

  const subEvents = (subEventsRes.data ?? []) as unknown as SubEvent[];
  const memberships = (membershipsRes.data ?? []) as unknown as GuestGroupMember[];
  const assignments = (assignmentsRes.data ?? []) as unknown as SubEventGroupAssignment[];
  const overrides = (overridesRes.data ?? []) as unknown as GuestInvitationOverride[];

  const guestGroupIds = new Set(memberships.map((m) => m.group_id));
  const assignmentsBySubEvent = new Map<string, Set<string>>();
  for (const a of assignments) {
    if (!assignmentsBySubEvent.has(a.sub_event_id)) {
      assignmentsBySubEvent.set(a.sub_event_id, new Set());
    }
    assignmentsBySubEvent.get(a.sub_event_id)!.add(a.group_id);
  }
  const overridesBySubEvent = new Map<string, boolean>();
  for (const o of overrides) {
    overridesBySubEvent.set(o.sub_event_id, o.is_invited);
  }

  const result: ResolvedInvitation[] = subEvents.map((se) => {
    if (overridesBySubEvent.has(se.id)) {
      return {
        subEventId: se.id,
        invited: overridesBySubEvent.get(se.id)!,
        source: "override",
      };
    }
    const assignedGroups = assignmentsBySubEvent.get(se.id);
    if (assignedGroups && assignedGroups.size > 0) {
      const isInvited = [...assignedGroups].some((gid) => guestGroupIds.has(gid));
      return {
        subEventId: se.id,
        invited: isInvited,
        source: "group",
      };
    }
    return {
      subEventId: se.id,
      invited: true,
      source: "default",
    };
  });

  return result;
}

export function getInvitedSubEventIds(invitations: ResolvedInvitation[]): string[] {
  return invitations.filter((i) => i.invited).map((i) => i.subEventId);
}
