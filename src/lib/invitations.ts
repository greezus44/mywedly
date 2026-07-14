import type { SupaClient } from "./supabase";

export interface ResolvedInvitation {
  subEventId: string;
  invited: boolean;
  source: "group" | "override" | "default";
}

export interface ResolveResult {
  invitations: ResolvedInvitation[];
}

export async function resolveGuestInvitations(
  supabase: SupaClient,
  guestId: string,
  parentEventId: string
): Promise<ResolveResult> {
  // Fetch all sub-events for the parent event
  const { data: subEvents } = await supabase
    .from("sub_events")
    .select("id")
    .eq("parent_event_id", parentEventId);

  const subEventIds = (subEvents ?? []).map((s: { id: string }) => s.id);

  if (subEventIds.length === 0) {
    return { invitations: [] };
  }

  // Fetch guest group memberships
  const { data: memberships } = await supabase
    .from("guest_group_members")
    .select("*")
    .eq("guest_id", guestId);

  const groupIds = (memberships ?? []).map(
    (m: { group_id: string }) => m.group_id
  );

  // Fetch sub_event_group_assignments for those groups
  const { data: assignments } = await supabase
    .from("sub_event_group_assignments")
    .select("*")
    .in("group_id", groupIds.length > 0 ? groupIds : ["__none__"]);

  const assignedSubEventIds = new Set(
    (assignments ?? []).map((a: { sub_event_id: string }) => a.sub_event_id)
  );

  // Fetch guest_invitation_overrides for this guest
  const { data: overrides } = await supabase
    .from("guest_invitation_overrides")
    .select("*")
    .eq("guest_id", guestId);

  const overrideMap = new Map<string, boolean>();
  for (const o of overrides ?? []) {
    overrideMap.set(
      (o as { sub_event_id: string; is_invited: boolean }).sub_event_id,
      (o as { sub_event_id: string; is_invited: boolean }).is_invited
    );
  }

  const invitations: ResolvedInvitation[] = subEventIds.map((subEventId) => {
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
    return {
      subEventId,
      invited: true,
      source: "default",
    };
  });

  return { invitations };
}

export function getInvitedSubEventIds(
  invitations: ResolvedInvitation[]
): string[] {
  return invitations.filter((i) => i.invited).map((i) => i.subEventId);
}
