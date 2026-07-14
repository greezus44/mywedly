import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup, type EventGuest, type SubEventGroupAssignment, type GuestInvitationOverride } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge, LoadingSpinner, ErrorState } from "../../components/ui";

interface InvitationManagerProps {
  subEventId: string;
  eventId: string;
}

export function InvitationManager({ subEventId, eventId }: InvitationManagerProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch groups for this event
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  // Fetch existing group assignments for this sub-event
  const {
    data: assignments,
    isLoading: assignmentsLoading,
    isError,
    error: assignmentsError,
    refetch,
  } = useQuery({
    queryKey: ["sub-event-assignments", subEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .eq("sub_event_id", subEventId);
      if (error) throw error;
      return data as SubEventGroupAssignment[];
    },
  });

  // Fetch manual overrides for this sub-event
  const { data: overrides } = useQuery({
    queryKey: ["sub-event-overrides", subEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("sub_event_id", subEventId);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
  });

  // Fetch guests for this event (for manual override management)
  const { data: guests } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const assignedGroupIds = useMemo(
    () => new Set(assignments?.map((a) => a.group_id) ?? []),
    [assignments]
  );

  const overrideByGuest = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const o of overrides ?? []) {
      map.set(o.guest_id, o.is_invited);
    }
    return map;
  }, [overrides]);

  const toggleGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const existing = assignments?.find((a) => a.group_id === groupId);
      if (existing) {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .insert({ sub_event_id: subEventId, group_id: groupId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-event-assignments", subEventId] });
      queryClient.invalidateQueries({ queryKey: ["resolved-invitations"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const toggleGuestOverrideMutation = useMutation({
    mutationFn: async ({ guestId, isInvited }: { guestId: string; isInvited: boolean }) => {
      const existing = overrides?.find((o) => o.guest_id === guestId);
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: isInvited })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ sub_event_id: subEventId, guest_id: guestId, is_invited: isInvited });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-event-overrides", subEventId] });
      queryClient.invalidateQueries({ queryKey: ["resolved-invitations"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  if (groupsLoading || assignmentsLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <ErrorState message={assignmentsError?.message} onRetry={() => refetch()} />;
  }

  // Determine which guests are invited (by group or manual override)
  const guestIsInvited = (guest: EventGuest): boolean => {
    if (overrideByGuest.has(guest.id)) {
      return overrideByGuest.get(guest.id)!;
    }
    if (guest.group_id && assignedGroupIds.has(guest.group_id)) {
      return true;
    }
    return false;
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">{error}</p>
      )}

      {/* Group assignments */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-dash-text">Group Assignments</h4>
        <p className="mb-3 text-xs text-dash-muted">
          Select which groups are invited to this event. All guests in selected groups will be invited.
        </p>
        {(!groups || groups.length === 0) ? (
          <p className="text-sm text-dash-muted">No groups available. Create groups in the Guest Groups tab.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => {
              const isAssigned = assignedGroupIds.has(group.id);
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => toggleGroupMutation.mutate(group.id)}
                  disabled={toggleGroupMutation.isPending}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    isAssigned
                      ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                      : "border-dash-border bg-dash-surface text-dash-text hover:border-dash-primary/50"
                  }`}
                >
                  {isAssigned ? "✓ " : ""}
                  {group.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual overrides */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-dash-text">Manual Overrides</h4>
        <p className="mb-3 text-xs text-dash-muted">
          Override individual guest invitations. Use this to include/exclude specific guests regardless of group assignment.
        </p>
        {(!guests || guests.length === 0) ? (
          <p className="text-sm text-dash-muted">No guests available. Add guests in the Guests tab.</p>
        ) : (
          <div className="max-h-60 overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-dash-surface">
                <tr className="border-b border-dash-border text-left text-dash-muted">
                  <th className="pb-2 pr-4 font-medium">Guest</th>
                  <th className="pb-2 pr-4 font-medium">Group</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => {
                  const invited = guestIsInvited(guest);
                  const groupName = groups?.find((g) => g.id === guest.group_id)?.name;
                  const hasOverride = overrideByGuest.has(guest.id);
                  return (
                    <tr key={guest.id} className="border-b border-dash-border/50">
                      <td className="py-2 pr-4 text-dash-text">{guest.name}</td>
                      <td className="py-2 pr-4 text-dash-muted">{groupName ?? "—"}</td>
                      <td className="py-2 pr-4">
                        {invited ? (
                          <Badge variant="success">Invited</Badge>
                        ) : (
                          <Badge variant="default">Not Invited</Badge>
                        )}
                        {hasOverride && <span className="ml-1 text-xs text-dash-muted">(override)</span>}
                      </td>
                      <td className="py-2 pr-4">
                        <Button
                          variant={invited ? "danger" : "secondary"}
                          size="sm"
                          loading={toggleGuestOverrideMutation.isPending}
                          onClick={() =>
                            toggleGuestOverrideMutation.mutate({
                              guestId: guest.id,
                              isInvited: !invited,
                            })
                          }
                        >
                          {invited ? "Uninvite" : "Invite"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
