import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestGroup, type GuestGroupMember, type GuestInvitationOverride, type EventGuest } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, LoadingSpinner, ErrorState, Badge, EmptyState } from "../../components/ui";
import { cn } from "../../lib/utils";

export function InvitationManager() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);

  const { data: subEvents, isLoading: seLoading, isError: seError } = useQuery({
    queryKey: ["sub-events-inv", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: guests, isLoading: gLoading } = useQuery({
    queryKey: ["guests-inv", eventId],
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

  const { data: groups } = useQuery({
    queryKey: ["groups-inv", eventId],
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

  const { data: memberships } = useQuery({
    queryKey: ["memberships-inv", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_group_members")
        .select("*, guest_groups!inner(event_id)")
        .eq("guest_groups.event_id", eventId);
      if (error) throw error;
      return (data ?? []) as (GuestGroupMember & { guest_groups: { event_id: string } })[];
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["assignments-inv", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*, sub_events!inner(event_id)")
        .eq("sub_events.event_id", eventId);
      if (error) throw error;
      return (data ?? []) as { id: string; sub_event_id: string; group_id: string }[];
    },
  });

  const { data: overrides } = useQuery({
    queryKey: ["overrides-inv", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*, event_guests!inner(event_id)")
        .eq("event_guests.event_id", eventId);
      if (error) throw error;
      return (data ?? []) as (GuestInvitationOverride & { event_guests: { event_id: string } })[];
    },
  });

  const toggleAssignmentMutation = useMutation({
    mutationFn: async ({ subEventId, groupId }: { subEventId: string; groupId: string }) => {
      const existing = assignments?.find((a) => a.sub_event_id === subEventId && a.group_id === groupId);
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
      queryClient.invalidateQueries({ queryKey: ["assignments-inv", eventId] });
    },
  });

  const toggleOverrideMutation = useMutation({
    mutationFn: async ({ guestId, subEventId, isInvited }: { guestId: string; subEventId: string; isInvited: boolean }) => {
      const existing = overrides?.find((o) => o.guest_id === guestId && o.sub_event_id === subEventId);
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: isInvited })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ guest_id: guestId, sub_event_id: subEventId, is_invited: isInvited });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overrides-inv", eventId] });
    },
  });

  function isGuestInvitedToSubEvent(guestId: string, subEventId: string): boolean {
    // Check override first
    const override = overrides?.find((o) => o.guest_id === guestId && o.sub_event_id === subEventId);
    if (override) return override.is_invited;
    // Check group assignments
    const guestGroupIds = (memberships ?? [])
      .filter((m) => m.guest_id === guestId)
      .map((m) => m.group_id);
    if (guestGroupIds.length === 0) return true; // Default: invited
    const hasAssignment = (assignments ?? []).some(
      (a) => a.sub_event_id === subEventId && guestGroupIds.includes(a.group_id)
    );
    return hasAssignment;
  }

  if (seLoading || gLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (seError) {
    return <ErrorState message="Failed to load invitation data." />;
  }

  if (!subEvents || subEvents.length === 0) {
    return (
      <EmptyState
        title="No events to manage"
        description="Create events first before managing invitations."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Invitation Manager</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Control which guest groups are invited to each event, and override individual guest invitations.
        </p>
      </div>

      {/* Group → Event Assignments */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Group Invitations</h3>
        {groups && groups.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border">
                  <th className="py-2 pr-4 text-left font-medium text-dash-muted">Group</th>
                  {subEvents.map((se) => (
                    <th key={se.id} className="px-2 py-2 text-center font-medium text-dash-muted">
                      {se.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id} className="border-b border-dash-border">
                    <td className="py-2 pr-4 text-dash-text">{group.name}</td>
                    {subEvents.map((se) => {
                      const isAssigned = assignments?.some(
                        (a) => a.sub_event_id === se.id && a.group_id === group.id
                      );
                      return (
                        <td key={se.id} className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toggleAssignmentMutation.mutate({ subEventId: se.id, groupId: group.id })
                            }
                            disabled={toggleAssignmentMutation.isPending}
                            className={cn(
                              "rounded-lg border px-3 py-1 text-xs transition-colors",
                              isAssigned
                                ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                                : "border-dash-border text-dash-muted hover:bg-dash-bg"
                            )}
                          >
                            {isAssigned ? "Invited" : "Not invited"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-dash-muted">No groups created yet. Create groups in the Guest Groups tab.</p>
        )}
      </Card>

      {/* Per-Guest Overrides */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Individual Guest Overrides</h3>
        <div className="mb-4">
          <select
            value={selectedGuest ?? ""}
            onChange={(e) => setSelectedGuest(e.target.value || null)}
            className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
          >
            <option value="">Select a guest…</option>
            {guests?.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        {selectedGuest && (
          <div className="space-y-2">
            {subEvents.map((se) => {
              const invited = isGuestInvitedToSubEvent(selectedGuest, se.id);
              return (
                <div
                  key={se.id}
                  className="flex items-center justify-between rounded-lg border border-dash-border px-3 py-2"
                >
                  <span className="text-sm text-dash-text">{se.name}</span>
                  <Button
                    variant={invited ? "primary" : "secondary"}
                    size="sm"
                    loading={toggleOverrideMutation.isPending}
                    onClick={() =>
                      toggleOverrideMutation.mutate({
                        guestId: selectedGuest,
                        subEventId: se.id,
                        isInvited: !invited,
                      })
                    }
                  >
                    {invited ? "Invited" : "Not Invited"}
                  </Button>
                </div>
              );
            })}
            <p className="text-xs text-dash-muted">
              Overrides take precedence over group assignments.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
