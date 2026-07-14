import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubEvent } from "./supabase";

export interface ResolvedInvitation {
  subEventId: string;
  invited: boolean;
  source: "group" | "override" | "default";
}

export interface ResolveResult {
  invitations: ResolvedInvitation[];
}

interface GuestGroupMemberRow {
  guest_id: string;
  group_id: string;
}

interface SubEventGroupAssignmentRow {
  id: string;
  sub_event_id: string;
  group_id: string;
}

interface GuestInvitationOverrideRow {
  id: string;
  sub_event_id: string;
  guest_id: string;
  is_invited: boolean;
}

export async function resolveGuestInvitations(
  client: SupabaseClient,
  guestId: string,
  parentEventId: string,
): Promise<ResolveResult> {
  // Fetch sub-events for the parent event
  const { data: subEvents, error: subEventsError } = await client
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
  const { data: memberships } = await client
    .from("guest_group_members")
    .select("*")
    .eq("guest_id", guestId);

  const memberRows = (memberships ?? []) as unknown as GuestGroupMemberRow[];
  const guestGroupIds = new Set(memberRows.map((m) => m.group_id));

  // Fetch sub-event group assignments
  const { data: assignments } = await client
    .from("sub_event_group_assignments")
    .select("*");

  const assignmentRows = (assignments ?? []) as unknown as SubEventGroupAssignmentRow[];
  const subEventGroupMap = new Map<string, Set<string>>();
  for (const a of assignmentRows) {
    if (!subEventGroupMap.has(a.sub_event_id)) {
      subEventGroupMap.set(a.sub_event_id, new Set());
    }
    subEventGroupMap.get(a.sub_event_id)!.add(a.group_id);
  }

  // Fetch guest invitation overrides
  const { data: overrides } = await client
    .from("guest_invitation_overrides")
    .select("*")
    .eq("guest_id", guestId);

  const overrideRows = (overrides ?? []) as unknown as GuestInvitationOverrideRow[];
  const overrideMap = new Map<string, boolean>();
  for (const o of overrideRows) {
    overrideMap.set(o.sub_event_id, o.is_invited);
  }

  // Resolve invitations: override takes precedence over group, group over default
  const invitations: ResolvedInvitation[] = (subEvents as SubEvent[]).map((se) => {
    if (overrideMap.has(se.id)) {
      return {
        subEventId: se.id,
        invited: overrideMap.get(se.id)!,
        source: "override",
      };
    }
    const groupIds = subEventGroupMap.get(se.id);
    if (groupIds && groupIds.size > 0) {
      const inGroup = Array.from(groupIds).some((gid) => guestGroupIds.has(gid));
      return {
        subEventId: se.id,
        invited: inGroup,
        source: "group",
      };
    }
    // Default: invited (no group assignments means all guests are invited)
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
