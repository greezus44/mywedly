import type { SupabaseClient } from "@supabase/supabase-js";

export interface ResolvedInvitation { subEventId: string; subEventName: string; isInvited: boolean; }
export interface ResolveResult { invitations: ResolvedInvitation[]; error: string | null; hasMainEventAccess: boolean; }

export async function resolveGuestInvitations(supabase: SupabaseClient, guestId: string, parentEventId: string): Promise<ResolveResult> {
  try {
    // Resolved server-side: group assignments, direct invites and per-guest overrides
    // are combined inside the database so the guest site never reads those tables.
    const { data, error } = await supabase.rpc("guest_resolve_invitations", {
      p_guest_id: guestId,
      p_event_id: parentEventId,
    });
    if (error) {
      console.error("resolveGuestInvitations failed", error);
      return { invitations: [], hasMainEventAccess: false, error: "Unable to load your invitation. Please try again." };
    }
    const payload = (data ?? {}) as { has_main_event_access?: boolean; invitations?: ResolvedInvitation[] };
    return {
      invitations: Array.isArray(payload.invitations) ? payload.invitations : [],
      hasMainEventAccess: !!payload.has_main_event_access,
      error: null,
    };
  } catch (e) {
    console.error("resolveGuestInvitations failed", e);
    return { invitations: [], hasMainEventAccess: false, error: "Unable to load your invitation. Please try again." };
  }
}

export function getInvitedSubEventIds(result: ResolveResult): string[] {
  return result.invitations.filter((i) => i.isInvited).map((i) => i.subEventId);
}

export function hasRsvpAccess(result: ResolveResult): boolean {
  return result.hasMainEventAccess || getInvitedSubEventIds(result).length > 0;
}
