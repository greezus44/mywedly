import type { SupabaseClient } from "@supabase/supabase-js";
import type { GuestInvitationOverride, GuestGroupMember, SubEventGroupAssignment } from "./supabase";

/**
 * A resolved invitation for a guest to a specific sub-event.
 */
export interface ResolvedInvitation {
  subEventId: string;
  isInvited: boolean;
  /** Whether this was explicitly set via an override (vs. inferred from group membership). */
  isExplicit: boolean;
}

export interface ResolveResult {
  invitations: ResolvedInvitation[];
  error: string | null;
}

/**
 * Resolve which sub-events a guest is invited to for a given parent event.
 *
 * The logic:
 * 1. Find all groups the guest belongs to.
 * 2. Find all sub-event ↔ group assignments for those groups.
 * 3. Find any explicit overrides for this guest.
 * 4. Merge: an override takes precedence; otherwise the group assignment determines invitation.
 */
export async function resolveGuestInvitations(
  supabase: SupabaseClient,
  guestId: string,
  parentEventId: string
): Promise<ResolveResult> {
  try {
    // 1. Get all groups this guest belongs to
    const { data: memberships, error: memberError } = await supabase
      .from("guest_group_members")
      .select("group_id")
      .eq("guest_id", guestId);

    if (memberError) {
      return { invitations: [], error: memberError.message };
    }

    const groupIds = (memberships ?? []).map(
      (m) => (m as GuestGroupMember).group_id
    );

    // 2. Get sub-event group assignments for those groups
    let groupAssignments: SubEventGroupAssignment[] = [];
    if (groupIds.length > 0) {
      const { data: assignments, error: assignError } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .in("group_id", groupIds);

      if (assignError) {
        return { invitations: [], error: assignError.message };
      }
      groupAssignments = (assignments ?? []) as SubEventGroupAssignment[];
    }

    // 3. Get explicit overrides for this guest (across all sub-events of the parent event)
    const { data: overrides, error: overrideError } = await supabase
      .from("guest_invitation_overrides")
      .select("*")
      .eq("guest_id", guestId);

    if (overrideError) {
      return { invitations: [], error: overrideError.message };
    }

    const overrideMap = new Map<string, GuestInvitationOverride>();
    for (const ov of (overrides ?? []) as GuestInvitationOverride[]) {
      overrideMap.set(ov.sub_event_id, ov);
    }

    // 4. Merge results
    const invitationMap = new Map<string, ResolvedInvitation>();

    // Start with group-based invitations
    for (const assignment of groupAssignments) {
      const existing = invitationMap.get(assignment.sub_event_id);
      if (existing) {
        // If any group includes them, they're invited (unless explicitly overridden later)
        existing.isInvited = true;
      } else {
        invitationMap.set(assignment.sub_event_id, {
          subEventId: assignment.sub_event_id,
          isInvited: true,
          isExplicit: false,
        });
      }
    }

    // Apply explicit overrides
    for (const [subEventId, override] of overrideMap) {
      invitationMap.set(subEventId, {
        subEventId,
        isInvited: override.is_invited,
        isExplicit: true,
      });
    }

    const invitations = Array.from(invitationMap.values());

    // Filter to only sub-events belonging to this parent event if we have any
    // (the overrides query isn't scoped to parent event, so verify)
    if (invitations.length > 0) {
      const subEventIds = invitations.map((i) => i.subEventId);
      const { data: subEvents, error: subError } = await supabase
        .from("sub_events")
        .select("id")
        .eq("parent_event_id", parentEventId)
        .in("id", subEventIds);

      if (subError) {
        return { invitations: [], error: subError.message };
      }

      const validIds = new Set((subEvents ?? []).map((s: { id: string }) => s.id));
      return {
        invitations: invitations.filter((i) => validIds.has(i.subEventId)),
        error: null,
      };
    }

    return { invitations, error: null };
  } catch (err) {
    return {
      invitations: [],
      error: err instanceof Error ? err.message : "Failed to resolve invitations.",
    };
  }
}

/**
 * Extract the list of sub-event IDs the guest is invited to from a ResolveResult.
 */
export function getInvitedSubEventIds(result: ResolveResult): string[] {
  return result.invitations.filter((i) => i.isInvited).map((i) => i.subEventId);
}
