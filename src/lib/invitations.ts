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

/**
 * Resolve which sub-events a guest is invited to for a given parent event.
 *
 * Logic:
 * 1. Find all groups the guest belongs to (guest_group_members → guest_groups).
 * 2. Find all sub_event_group_assignments for those groups.
 * 3. Find all guest_invitation_overrides for this guest.
 * 4. For each sub-event under the parent event:
 *    - Start with: invited = any group assignment matches
 *    - Apply overrides: if an override exists, use its is_invited value
 */
export async function resolveGuestInvitations(
  supabase: SupabaseClient,
  guestId: string,
  parentEventId: string,
): Promise<ResolveResult> {
  try {
    // 1. Get all sub-events for this parent event
    const { data: subEvents, error: subError } = await supabase
      .from("sub_events")
      .select("id, name")
      .eq("parent_event_id", parentEventId)
      .order("display_order", { ascending: true });
    if (subError) return { invitations: [], error: subError.message };
    if (!subEvents || subEvents.length === 0) return { invitations: [], error: null };

    // 2. Get guest's groups
    const { data: memberships, error: memberError } = await supabase
      .from("guest_group_members")
      .select("group_id")
      .eq("guest_id", guestId);
    if (memberError) return { invitations: [], error: memberError.message };

    const groupIds = (memberships ?? []).map((m) => m.group_id as string);

    // 3. Get group assignments to sub-events
    let assignedSubEventIds = new Set<string>();
    if (groupIds.length > 0) {
      const { data: assignments, error: assignError } = await supabase
        .from("sub_event_group_assignments")
        .select("sub_event_id")
        .in("group_id", groupIds);
      if (assignError) return { invitations: [], error: assignError.message };
      (assignments ?? []).forEach((a) => assignedSubEventIds.add(a.sub_event_id as string));
    }

    // 4. Get per-guest overrides
    const { data: overrides, error: overrideError } = await supabase
      .from("guest_invitation_overrides")
      .select("sub_event_id, is_invited")
      .eq("guest_id", guestId);
    if (overrideError) return { invitations: [], error: overrideError.message };

    const overrideMap = new Map<string, boolean>();
    (overrides ?? []).forEach((o) => overrideMap.set(o.sub_event_id as string, o.is_invited as boolean));

    // 5. Build result
    const invitations: ResolvedInvitation[] = subEvents.map((se) => {
      const id = se.id as string;
      let isInvited = assignedSubEventIds.has(id);
      if (overrideMap.has(id)) {
        isInvited = overrideMap.get(id)!;
      }
      return { subEventId: id, subEventName: se.name as string, isInvited };
    });

    return { invitations, error: null };
  } catch (e) {
    return { invitations: [], error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export function getInvitedSubEventIds(result: ResolveResult): string[] {
  return result.invitations.filter((i) => i.isInvited).map((i) => i.subEventId);
}
