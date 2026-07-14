import type { SupabaseClient } from "@supabase/supabase-js";

export interface ResolvedInvitation {
  subEventId: string;
  subEventName: string;
  isInvited: boolean;
}

export interface ResolveResult {
  invitations: ResolvedInvitation[];
  error: string | null;
}

export async function resolveGuestInvitations(
  supabaseClient: SupabaseClient,
  guestId: string,
  parentEventId: string,
): Promise<ResolveResult> {
  try {
    // 1. Load all sub-events for this parent event
    const { data: subEvents, error: subError } = await supabaseClient
      .from("sub_events")
      .select("id, name, parent_event_id")
      .eq("parent_event_id", parentEventId);

    if (subError) return { invitations: [], error: subError.message };
    if (!subEvents || subEvents.length === 0) return { invitations: [], error: null };

    // 2. Load guest's group memberships
    const { data: groupMemberships, error: gmError } = await supabaseClient
      .from("guest_group_members")
      .select("group_id")
      .eq("guest_id", guestId);

    if (gmError) return { invitations: [], error: gmError.message };
    const groupIds = (groupMemberships ?? []).map((m: { group_id: string }) => m.group_id);

    // 3. Load group assignments for these sub-events
    const subEventIds = subEvents.map((se: { id: string }) => se.id);
    const { data: groupAssignments, error: gaError } = await supabaseClient
      .from("sub_event_group_assignments")
      .select("sub_event_id, group_id")
      .in("sub_event_id", subEventIds);

    if (gaError) return { invitations: [], error: gaError.message };

    // 4. Load per-guest overrides
    const { data: overrides, error: ovError } = await supabaseClient
      .from("guest_invitation_overrides")
      .select("sub_event_id, is_invited")
      .eq("guest_id", guestId)
      .in("sub_event_id", subEventIds);

    if (ovError) return { invitations: [], error: ovError.message };

    const overrideMap = new Map<string, boolean>();
    (overrides ?? []).forEach((o: { sub_event_id: string; is_invited: boolean }) => {
      overrideMap.set(o.sub_event_id, o.is_invited);
    });

    // 5. Resolve invitations
    const invitations: ResolvedInvitation[] = subEvents.map((se: { id: string; name: string }) => {
      // Check override first
      if (overrideMap.has(se.id)) {
        return { subEventId: se.id, subEventName: se.name, isInvited: overrideMap.get(se.id)! };
      }

      // Check group-based assignment
      const assignedGroups = (groupAssignments ?? [])
        .filter((ga: { sub_event_id: string; group_id: string }) => ga.sub_event_id === se.id)
        .map((ga: { sub_event_id: string; group_id: string }) => ga.group_id);

      if (assignedGroups.length === 0) {
        // No group restrictions — everyone is invited
        return { subEventId: se.id, subEventName: se.name, isInvited: true };
      }

      const isInvited = assignedGroups.some((gid: string) => groupIds.includes(gid));
      return { subEventId: se.id, subEventName: se.name, isInvited };
    });

    return { invitations, error: null };
  } catch (err) {
    return {
      invitations: [],
      error: err instanceof Error ? err.message : "Unknown error resolving invitations",
    };
  }
}

export function getInvitedSubEventIds(result: ResolveResult): string[] {
  return result.invitations
    .filter((inv) => inv.isInvited)
    .map((inv) => inv.subEventId);
}
