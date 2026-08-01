import type { SupabaseClient } from "@supabase/supabase-js";

export interface ResolvedInvitation { subEventId: string; subEventName: string; isInvited: boolean; }
export interface ResolveResult { invitations: ResolvedInvitation[]; error: string | null; hasMainEventAccess: boolean; }

export async function resolveGuestInvitations(supabase: SupabaseClient, guestId: string, parentEventId: string): Promise<ResolveResult> {
  try {
    // A guest with an event_guests record always has base access to the main event
    const { data: guestRow, error: guestError } = await supabase
      .from("event_guests").select("id, group_id").eq("id", guestId).maybeSingle();
    if (guestError) return { invitations: [], hasMainEventAccess: false, error: guestError.message };

    const hasMainEventAccess = !!guestRow;

    // Collect group IDs from both event_guests.group_id and guest_group_members
    const groupIds = new Set<string>();
    if (guestRow?.group_id) groupIds.add(guestRow.group_id as string);

    const { data: memberships } = await supabase
      .from("guest_group_members").select("group_id").eq("guest_id", guestId);
    (memberships ?? []).forEach((m) => groupIds.add(m.group_id as string));

    // Check for manual per-guest event invites (guest_event_invites)
    const { data: directInvites } = await supabase
      .from("guest_event_invites").select("sub_event_id, invite_type").eq("guest_id", guestId);
    const directSubEventIds = new Set<string>();
    (directInvites ?? []).forEach((d) => { if (d.invite_type === "include" && d.sub_event_id) directSubEventIds.add(d.sub_event_id as string); });

    // Load sub-events
    const { data: subEvents, error: subError } = await supabase
      .from("sub_events").select("id, name").eq("parent_event_id", parentEventId).order("display_order", { ascending: true });
    if (subError) return { invitations: [], hasMainEventAccess, error: subError.message };

    // No sub-events: guest still has main event access if they have an event_guests record
    if (!subEvents || subEvents.length === 0) return { invitations: [], hasMainEventAccess, error: null };

    // Group → sub_event assignments
    let assignedSubEventIds = new Set<string>();
    if (groupIds.size > 0) {
      const { data: assignments, error: assignError } = await supabase
        .from("sub_event_group_assignments").select("sub_event_id").in("group_id", [...groupIds]);
      if (assignError) return { invitations: [], hasMainEventAccess, error: assignError.message };
      (assignments ?? []).forEach((a) => assignedSubEventIds.add(a.sub_event_id as string));
    }

    // Per-guest overrides
    const { data: overrides, error: overrideError } = await supabase
      .from("guest_invitation_overrides").select("sub_event_id, is_invited").eq("guest_id", guestId);
    if (overrideError) return { invitations: [], hasMainEventAccess, error: overrideError.message };
    const overrideMap = new Map<string, boolean>();
    (overrides ?? []).forEach((o) => overrideMap.set(o.sub_event_id as string, o.is_invited as boolean));

    const invitations: ResolvedInvitation[] = subEvents.map((se) => {
      const id = se.id as string;
      let isInvited = assignedSubEventIds.has(id) || directSubEventIds.has(id);
      if (overrideMap.has(id)) isInvited = overrideMap.get(id)!;
      return { subEventId: id, subEventName: se.name as string, isInvited };
    });
    return { invitations, hasMainEventAccess, error: null };
  } catch (e) {
    return { invitations: [], hasMainEventAccess: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export function getInvitedSubEventIds(result: ResolveResult): string[] {
  return result.invitations.filter((i) => i.isInvited).map((i) => i.subEventId);
}

export function hasRsvpAccess(result: ResolveResult): boolean {
  return result.hasMainEventAccess || getInvitedSubEventIds(result).length > 0;
}
