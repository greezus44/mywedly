import type { SupabaseClient } from "@supabase/supabase-js";

export interface ResolvedInvitation { subEventId: string; subEventName: string; isInvited: boolean; }
export interface ResolveResult { invitations: ResolvedInvitation[]; error: string | null; }

export async function resolveGuestInvitations(supabase: SupabaseClient, guestId: string, parentEventId: string): Promise<ResolveResult> {
  try {
    const { data: subEvents, error: subError } = await supabase
      .from("sub_events").select("id, name").eq("parent_event_id", parentEventId).order("display_order", { ascending: true });
    if (subError) return { invitations: [], error: subError.message };
    if (!subEvents || subEvents.length === 0) return { invitations: [], error: null };

    const { data: memberships, error: memberError } = await supabase
      .from("guest_group_members").select("group_id").eq("guest_id", guestId);
    if (memberError) return { invitations: [], error: memberError.message };
    const groupIds = (memberships ?? []).map((m) => m.group_id as string);

    let assignedSubEventIds = new Set<string>();
    if (groupIds.length > 0) {
      const { data: assignments, error: assignError } = await supabase
        .from("sub_event_group_assignments").select("sub_event_id").in("group_id", groupIds);
      if (assignError) return { invitations: [], error: assignError.message };
      (assignments ?? []).forEach((a) => assignedSubEventIds.add(a.sub_event_id as string));
    }

    const { data: overrides, error: overrideError } = await supabase
      .from("guest_invitation_overrides").select("sub_event_id, is_invited").eq("guest_id", guestId);
    if (overrideError) return { invitations: [], error: overrideError.message };
    const overrideMap = new Map<string, boolean>();
    (overrides ?? []).forEach((o) => overrideMap.set(o.sub_event_id as string, o.is_invited as boolean));

    const invitations: ResolvedInvitation[] = subEvents.map((se) => {
      const id = se.id as string;
      let isInvited = assignedSubEventIds.has(id);
      if (overrideMap.has(id)) isInvited = overrideMap.get(id)!;
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
