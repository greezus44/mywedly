import type { SupabaseClient } from "@supabase/supabase-js";
import { SubEvent, EventGuest, SubEventGroupAssignment, GuestInvitationOverride } from "./supabase";

export interface ResolvedInvitation {
  subEventId: string;
  invited: boolean;
  source: "group" | "manual" | "none";
}

export async function resolveGuestInvitations(
  supabase: SupabaseClient,
  guestId: string,
  parentEventId: string
): Promise<ResolvedInvitation[]> {
  // 1. Query all sub-events for this parent event
  const { data: subEvents, error: subErr } = await supabase
    .from("sub_events")
    .select("id")
    .eq("parent_event_id", parentEventId);

  if (subErr) throw subErr;
  const subEventIds: string[] = (subEvents ?? []).map((s: { id: string }) => s.id);

  if (subEventIds.length === 0) return [];

  // 2. Query the guest to get their group_id
  const { data: guest, error: guestErr } = await supabase
    .from("event_guests")
    .select("id, group_id")
    .eq("id", guestId)
    .maybeSingle();

  if (guestErr) throw guestErr;
  const guestGroupId: string | null = (guest as Pick<EventGuest, "id" | "group_id"> | null)?.group_id ?? null;

  // 3. Query all group→sub-event assignments for these sub-events
  const { data: assignments, error: assignErr } = await supabase
    .from("sub_event_group_assignments")
    .select("sub_event_id, group_id")
    .in("sub_event_id", subEventIds);

  if (assignErr) throw assignErr;
  const assignmentList = (assignments ?? []) as Pick<SubEventGroupAssignment, "sub_event_id" | "group_id">[];
  const assignedGroupIdsBySubEvent = new Map<string, Set<string>>();
  for (const a of assignmentList) {
    if (!assignedGroupIdsBySubEvent.has(a.sub_event_id)) {
      assignedGroupIdsBySubEvent.set(a.sub_event_id, new Set());
    }
    assignedGroupIdsBySubEvent.get(a.sub_event_id)!.add(a.group_id);
  }

  // 4. Query manual overrides for this guest + sub-events
  const { data: overrides, error: overrideErr } = await supabase
    .from("guest_invitation_overrides")
    .select("sub_event_id, is_invited")
    .eq("guest_id", guestId)
    .in("sub_event_id", subEventIds);

  if (overrideErr) throw overrideErr;
  const overrideList = (overrides ?? []) as Pick<GuestInvitationOverride, "sub_event_id" | "is_invited">[];
  const overrideBySubEvent = new Map<string, boolean>();
  for (const o of overrideList) {
    overrideBySubEvent.set(o.sub_event_id, o.is_invited);
  }

  // 5. Resolve each sub-event
  const result: ResolvedInvitation[] = subEventIds.map((subEventId) => {
    if (overrideBySubEvent.has(subEventId)) {
      return {
        subEventId,
        invited: overrideBySubEvent.get(subEventId)!,
        source: "manual",
      };
    }
    if (guestGroupId && assignedGroupIdsBySubEvent.get(subEventId)?.has(guestGroupId)) {
      return {
        subEventId,
        invited: true,
        source: "group",
      };
    }
    return {
      subEventId,
      invited: false,
      source: "none",
    };
  });

  // 6. Return resolved invitations
  return result;
}

export function getInvitedSubEventIds(invitations: ResolvedInvitation[]): string[] {
  return invitations.filter((i) => i.invited).map((i) => i.subEventId);
}
