import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestGroup, type EventGuest } from "../../lib/supabase";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";
import { Button } from "../../components/ui/Button";
import { Card, Badge, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { cn } from "../../lib/utils";
import type { EventContextValue } from "./event-layout";

interface InvitationManagerProps {
  guestId?: string;
}

export function InvitationManager({ guestId }: InvitationManagerProps) {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(guestId ?? null);

  const { data: subEvents, isLoading: subEventsLoading } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

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

  const { data: guests, isLoading: guestsLoading } = useQuery({
    queryKey: ["guests", eventId],
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

  const { data: assignments } = useQuery({
    queryKey: ["sub-event-group-assignments", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*");
      if (error) throw error;
      return data as { id: string; sub_event_id: string; group_id: string }[];
    },
  });

  const { data: overrides } = useQuery({
    queryKey: ["guest-invitation-overrides", selectedGuestId],
    enabled: !!selectedGuestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("guest_id", selectedGuestId!);
      if (error) throw error;
      return data as { id: string; sub_event_id: string; guest_id: string; is_invited: boolean }[];
    },
  });

  const { data: resolvedInvitations } = useQuery({
    queryKey: ["resolved-invitations", selectedGuestId],
    enabled: !!selectedGuestId,
    queryFn: async () => {
      return resolveGuestInvitations(supabase, selectedGuestId!, eventId);
    },
  });

  const toggleGroupAssignment = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["sub-event-group-assignments", eventId] });
      queryClient.invalidateQueries({ queryKey: ["resolved-invitations", selectedGuestId] });
    },
  });

  const toggleOverride = useMutation({
    mutationFn: async ({ subEventId, isInvited }: { subEventId: string; isInvited: boolean }) => {
      if (!selectedGuestId) return;
      const existing = overrides?.find((o) => o.sub_event_id === subEventId);
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: isInvited })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ sub_event_id: subEventId, guest_id: selectedGuestId, is_invited: isInvited });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", selectedGuestId] });
      queryClient.invalidateQueries({ queryKey: ["resolved-invitations", selectedGuestId] });
    },
  });

  const assignmentMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const a of assignments ?? []) {
      if (!map.has(a.sub_event_id)) map.set(a.sub_event_id, new Set());
      map.get(a.sub_event_id)!.add(a.group_id);
    }
    return map;
  }, [assignments]);

  const overrideMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const o of overrides ?? []) {
      map.set(o.sub_event_id, o.is_invited);
    }
    return map;
  }, [overrides]);

  const isLoading = subEventsLoading || groupsLoading || guestsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!subEvents || subEvents.length === 0) {
    return (
      <EmptyState
        title="No events to manage"
        description="Create events first, then manage which guests are invited to each."
        icon={<span className="text-4xl">🎟</span>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Invitation Manager</h2>
        <p className="text-sm text-dash-muted">
          Control which guests are invited to each event using group assignments and individual overrides.
        </p>
      </div>

      {/* Guest Selector */}
      <Card className="p-4">
        <label className="mb-1.5 block text-sm font-medium text-dash-text">Select Guest</label>
        <select
          value={selectedGuestId ?? ""}
          onChange={(e) => setSelectedGuestId(e.target.value || null)}
          className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
        >
          <option value="">— Select a guest —</option>
          {guests?.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </Card>

      {/* Group Assignments per Event */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Group Assignments</h3>
        <p className="mb-4 text-xs text-dash-muted">
          Assign groups to events. All guests in a group will be invited to that event.
        </p>
        {!groups || groups.length === 0 ? (
          <p className="text-sm text-dash-muted">No groups created. Create groups in the Guest Groups tab.</p>
        ) : (
          <div className="space-y-4">
            {subEvents.map((subEvent) => (
              <div key={subEvent.id} className="rounded-md border border-dash-border p-3">
                <h4 className="mb-2 text-sm font-medium text-dash-text">{subEvent.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {groups.map((group) => {
                    const assigned = assignmentMap.get(subEvent.id)?.has(group.id) ?? false;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() =>
                          toggleGroupAssignment.mutate({
                            subEventId: subEvent.id,
                            groupId: group.id,
                            assign: !assigned,
                          })
                        }
                        disabled={toggleGroupAssignment.isPending}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          assigned
                            ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                            : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg",
                        )}
                      >
                        {group.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Per-Guest Overrides */}
      {selectedGuestId && resolvedInvitations && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-dash-text">
            Individual Overrides
          </h3>
          <p className="mb-4 text-xs text-dash-muted">
            Override group assignments for this specific guest. Overrides take precedence over group settings.
          </p>
          <div className="space-y-2">
            {resolvedInvitations.invitations.map((inv) => {
              const subEvent = subEvents.find((se) => se.id === inv.subEventId);
              if (!subEvent) return null;
              const hasOverride = overrideMap.has(inv.subEventId);
              const isInvited = hasOverride ? overrideMap.get(inv.subEventId)! : inv.invited;
              return (
                <div
                  key={inv.subEventId}
                  className="flex items-center justify-between rounded-md border border-dash-border bg-dash-bg px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-medium text-dash-text">{subEvent.name}</span>
                    {inv.source === "override" && (
                      <Badge variant="primary" className="ml-2">Override</Badge>
                    )}
                    {inv.source === "group" && (
                      <Badge variant="default" className="ml-2">Via Group</Badge>
                    )}
                    {inv.source === "default" && (
                      <Badge variant="default" className="ml-2">Default</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={isInvited ? "primary" : "secondary"}
                      size="sm"
                      loading={toggleOverride.isPending}
                      onClick={() => toggleOverride.mutate({ subEventId: inv.subEventId, isInvited: true })}
                    >
                      Invited
                    </Button>
                    <Button
                      variant={!isInvited ? "danger" : "secondary"}
                      size="sm"
                      loading={toggleOverride.isPending}
                      onClick={() => toggleOverride.mutate({ subEventId: inv.subEventId, isInvited: false })}
                    >
                      Not Invited
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

export default InvitationManager;
