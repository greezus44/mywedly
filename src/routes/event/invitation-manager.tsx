import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  type SubEvent,
  type GuestGroup,
  type EventGuest,
  type SubEventGroupAssignment,
} from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";
import { cn } from "../../lib/utils";

export function InvitationManager() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  const { data: subEvents, isLoading: subsLoading, isError: subsError, error: subsErr, refetch: refetchSubs } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("event_id", eventId)
        .order("start_time", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("id, name, username")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Pick<EventGuest, "id" | "name" | "username">[];
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["sub-event-assignments", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*");
      if (error) throw error;
      return data as SubEventGroupAssignment[];
    },
  });

  // Resolve selected guest's invitations
  const { data: guestInvitations, isLoading: invLoading } = useQuery({
    queryKey: ["guest-invitations", eventId, selectedGuestId],
    queryFn: async () => {
      if (!selectedGuestId) return null;
      return resolveGuestInvitations(supabase, selectedGuestId, eventId);
    },
    enabled: !!selectedGuestId,
  });

  const toggleAssignment = useMutation({
    mutationFn: async ({ subEventId, groupId, assign }: { subEventId: string; groupId: string; assign: boolean }) => {
      if (assign) {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .insert({ sub_event_id: subEventId, group_id: groupId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .delete()
          .eq("sub_event_id", subEventId)
          .eq("group_id", groupId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-event-assignments", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest-invitations", eventId] });
    },
  });

  const toggleOverride = useMutation({
    mutationFn: async ({ subEventId, guestId, isInvited }: { subEventId: string; guestId: string; isInvited: boolean }) => {
      const { data: existing, error: checkError } = await supabase
        .from("guest_invitation_overrides")
        .select("id")
        .eq("sub_event_id", subEventId)
        .eq("guest_id", guestId)
        .maybeSingle();
      if (checkError) throw checkError;

      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: isInvited })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ event_id: eventId, guest_id: guestId, sub_event_id: subEventId, is_invited: isInvited });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-invitations", eventId] });
    },
  });

  const assignmentSet = useMemo(() => {
    const set = new Set<string>();
    for (const a of assignments ?? []) {
      set.add(`${a.sub_event_id}:${a.group_id}`);
    }
    return set;
  }, [assignments]);

  if (subsLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (subsError) {
    return (
      <ErrorState
        title="Failed to load invitations"
        message={subsErr instanceof Error ? subsErr.message : "An error occurred."}
        onRetry={() => refetchSubs()}
      />
    );
  }

  const subEventsList = subEvents ?? [];
  const groupsList = groups ?? [];
  const guestsList = guests ?? [];

  if (subEventsList.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Invitations</h2>
          <p className="text-sm text-dash-muted">Manage which guests are invited to each event.</p>
        </div>
        <EmptyState
          title="No events to manage"
          message="Create events first in the Events tab, then come back to manage invitations."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Invitations</h2>
        <p className="text-sm text-dash-muted">Manage which guests are invited to each event.</p>
      </div>

      {/* Group-to-Event assignments */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Group Assignments</h3>
        {groupsList.length === 0 ? (
          <p className="text-sm text-dash-muted">No groups created yet. Create groups in the Guest Groups tab.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border">
                  <th className="py-2 pr-4 text-left font-medium text-dash-muted">Group</th>
                  {subEventsList.map((sub) => (
                    <th key={sub.id} className="px-2 py-2 text-center font-medium text-dash-muted">
                      {sub.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupsList.map((group) => (
                  <tr key={group.id} className="border-b border-dash-border last:border-0">
                    <td className="py-2 pr-4 font-medium text-dash-text">{group.name}</td>
                    {subEventsList.map((sub) => {
                      const key = `${sub.id}:${group.id}`;
                      const isAssigned = assignmentSet.has(key);
                      return (
                        <td key={sub.id} className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleAssignment.mutate({ subEventId: sub.id, groupId: group.id, assign: !isAssigned })}
                            className={cn(
                              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                              isAssigned
                                ? "bg-dash-primary/10 text-dash-primary"
                                : "bg-dash-bg text-dash-muted hover:bg-dash-border/30"
                            )}
                          >
                            {isAssigned ? "✓ Invited" : "—"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Per-guest overrides */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Per-Guest Overrides</h3>
        {guestsList.length === 0 ? (
          <p className="text-sm text-dash-muted">No guests added yet. Add guests in the Guests tab.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">Select Guest</label>
              <select
                value={selectedGuestId || ""}
                onChange={(e) => setSelectedGuestId(e.target.value || null)}
                className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
              >
                <option value="">Choose a guest...</option>
                {guestsList.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} (@{g.username})</option>
                ))}
              </select>
            </div>

            {selectedGuestId && (
              <div>
                {invLoading ? (
                  <div className="py-4"><LoadingSpinner size="sm" /></div>
                ) : guestInvitations ? (
                  <div className="space-y-2">
                    {guestInvitations.invitations.map((inv) => (
                      <div key={inv.subEventId} className="flex items-center justify-between rounded-lg border border-dash-border p-3">
                        <div>
                          <p className="font-medium text-dash-text">{inv.subEventName}</p>
                          <p className="text-xs text-dash-muted">
                            {inv.source === "override" ? "Custom override" : inv.source === "group" ? "Via group assignment" : "Default (open invitation)"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={inv.isInvited ? "success" : "default"}>
                            {inv.isInvited ? "Invited" : "Not Invited"}
                          </Badge>
                          <Button
                            size="sm"
                            variant={inv.isInvited ? "danger" : "primary"}
                            onClick={() => toggleOverride.mutate({ subEventId: inv.subEventId, guestId: selectedGuestId, isInvited: !inv.isInvited })}
                          >
                            {inv.isInvited ? "Uninvite" : "Invite"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
