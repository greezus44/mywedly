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

/**
 * Resolve which sub-events a guest is invited to.
 *
 * Precedence: override > group > default.
 * - If a guest_invitation_override row exists for the guest + sub-event, use its is_invited.
 * - Otherwise, if the guest belongs to a group that is assigned to the sub-event, invited = true.
 * - Otherwise, invited = true (default — invited unless explicitly excluded).
 */
export async function resolveGuestInvitations(
  supabase: SupabaseClient,
  guestId: string,
  parentEventId: string,
): Promise<ResolveResult> {
  // fetch sub_events for the parent event
  const { data: subEvents, error: subError } = await supabase
    .from("sub_events")
    .select("*")
    .eq("parent_event_id", parentEventId);

  if (subError) throw subError;
  const subEventList = (subEvents ?? []) as SubEvent[];

  // fetch guest group memberships
  const { data: memberships, error: memberError } = await supabase
    .from("guest_group_members")
    .select("*")
    .eq("guest_id", guestId);

  if (memberError) throw memberError;
  const membershipList = (memberships ?? []) as GuestGroupMember[];
  const guestGroupIds = new Set(membershipList.map((m) => m.group_id));

  // fetch sub_event_group_assignments
  const { data: assignments, error: assignError } = await supabase
    .from("sub_event_group_assignments")
    .select("*");

  if (assignError) throw assignError;
  const assignmentList = (assignments ?? []) as SubEventGroupAssignment[];

  // fetch guest_invitation_overrides for this guest
  const { data: overrides, error: overrideError } = await supabase
    .from("guest_invitation_overrides")
    .select("*")
    .eq("guest_id", guestId);

  if (overrideError) throw overrideError;
  const overrideList = (overrides ?? []) as GuestInvitationOverride[];

  const overrideMap = new Map<string, boolean>();
  for (const o of overrideList) {
    overrideMap.set(o.sub_event_id, o.is_invited);
  }

  const assignmentMap = new Map<string, Set<string>>();
  for (const a of assignmentList) {
    let set = assignmentMap.get(a.sub_event_id);
    if (!set) {
      set = new Set();
      assignmentMap.set(a.sub_event_id, set);
    }
    set.add(a.group_id);
  }

  const invitations: ResolvedInvitation[] = subEventList.map((sub) => {
    if (overrideMap.has(sub.id)) {
      return {
        subEventId: sub.id,
        invited: overrideMap.get(sub.id)!,
        source: "override",
      };
    }
    const assignedGroups = assignmentMap.get(sub.id);
    if (assignedGroups && guestGroupIds.size > 0) {
      let inGroup = false;
      for (const gid of guestGroupIds) {
        if (assignedGroups.has(gid)) {
          inGroup = true;
          break;
        }
      }
      if (inGroup) {
        return { subEventId: sub.id, invited: true, source: "group" };
      }
    }
    return { subEventId: sub.id, invited: true, source: "default" };
  });

  return { invitations };
}

export function getInvitedSubEventIds(invitations: ResolvedInvitation[]): string[] {
  return invitations.filter((i) => i.invited).map((i) => i.subEventId);
}
