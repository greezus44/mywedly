import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestGroup, type SubEventGroupAssignment, type GuestInvitationOverride, type EventGuest } from "../../lib/supabase";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";
import { Button } from "../../components/ui/Button";
import { Card, Badge, Toggle, LoadingSpinner, EmptyState } from "../../components/ui";
import { cn } from "../../lib/utils";

interface InvitationManagerProps {
  subEvent: SubEvent;
  eventId: string;
}

export function InvitationManager({ subEvent, eventId }: InvitationManagerProps) {
  const queryClient = useQueryClient();
  const [assignedGroupIds, setAssignedGroupIds] = useState<Set<string>>(new Set());
  const [overrideMap, setOverrideMap] = useState<Map<string, boolean>>(new Map());

  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return (data ?? []) as GuestGroup[];
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["sub-event-group-assignments", subEvent.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .eq("sub_event_id", subEvent.id);
      if (error) throw error;
      return (data ?? []) as SubEventGroupAssignment[];
    },
  });

  const { data: overrides } = useQuery({
    queryKey: ["guest-invitation-overrides", subEvent.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("sub_event_id", subEvent.id);
      if (error) throw error;
      return (data ?? []) as GuestInvitationOverride[];
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return (data ?? []) as EventGuest[];
    },
  });

  useEffect(() => {
    setAssignedGroupIds(new Set((assignments ?? []).map((a) => a.group_id)));
  }, [assignments]);

  useEffect(() => {
    const map = new Map<string, boolean>();
    for (const o of overrides ?? []) {
      map.set(o.guest_id, o.is_invited);
    }
    setOverrideMap(map);
  }, [overrides]);

  const toggleGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const isAssigned = assignedGroupIds.has(groupId);
      if (isAssigned) {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .delete()
          .eq("sub_event_id", subEvent.id)
          .eq("group_id", groupId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .insert({ sub_event_id: subEvent.id, group_id: groupId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-event-group-assignments", subEvent.id] });
    },
  });

  const toggleOverrideMutation = useMutation({
    mutationFn: async ({ guestId, isInvited }: { guestId: string; isInvited: boolean }) => {
      const existing = overrideMap.get(guestId);
      if (existing === isInvited) return;

      const { data: existingRecord } = await supabase
        .from("guest_invitation_overrides")
        .select("id")
        .eq("sub_event_id", subEvent.id)
        .eq("guest_id", guestId)
        .maybeSingle();

      if (existingRecord) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: isInvited })
          .eq("id", existingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ sub_event_id: subEvent.id, guest_id: guestId, is_invited: isInvited });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", subEvent.id] });
    },
  });

  const computeGuestStatus = useCallback(
    (guest: EventGuest): { invited: boolean; source: "override" | "group" | "default" } => {
      if (overrideMap.has(guest.id)) {
        return { invited: overrideMap.get(guest.id)!, source: "override" };
      }
      // Check if guest's group is assigned
      if (guest.group_id && assignedGroupIds.has(guest.group_id)) {
        return { invited: true, source: "group" };
      }
      // If no groups assigned at all, default to invited
      if (assignedGroupIds.size === 0) {
        return { invited: true, source: "default" };
      }
      return { invited: false, source: "default" };
    },
    [overrideMap, assignedGroupIds],
  );

  const invitedCount = (guests ?? []).filter((g) => computeGuestStatus(g).invited).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="primary">{invitedCount} invited</Badge>
        <Badge variant="default">{(guests ?? []).length} total guests</Badge>
      </div>

      {/* Group assignments */}
      <Card>
        <h4 className="text-sm font-medium text-dash-text mb-3">Invite by Group</h4>
        {(groups ?? []).length === 0 ? (
          <p className="text-sm text-dash-muted">No groups created yet.</p>
        ) : (
          <div className="space-y-2">
            {(groups ?? []).map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between rounded-md border border-dash-border bg-dash-bg px-3 py-2"
              >
                <span className="text-sm text-dash-text">{group.name}</span>
                <Toggle
                  checked={assignedGroupIds.has(group.id)}
                  onChange={() => toggleGroupMutation.mutate(group.id)}
                  disabled={toggleGroupMutation.isPending}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Individual overrides */}
      <Card>
        <h4 className="text-sm font-medium text-dash-text mb-3">Individual Overrides</h4>
        {(guests ?? []).length === 0 ? (
          <p className="text-sm text-dash-muted">No guests added yet.</p>
        ) : (
          <div className="space-y-2">
            {(guests ?? []).map((guest) => {
              const status = computeGuestStatus(guest);
              return (
                <div
                  key={guest.id}
                  className="flex items-center justify-between rounded-md border border-dash-border bg-dash-bg px-3 py-2"
                >
                  <div>
                    <span className="text-sm text-dash-text">{guest.name}</span>
                    <span
                      className={cn(
                        "ml-2 text-xs",
                        status.source === "override" ? "text-dash-primary" : "text-dash-muted",
                      )}
                    >
                      {status.source === "override" ? "override" : status.source === "group" ? "via group" : "default"}
                    </span>
                  </div>
                  <Toggle
                    checked={status.invited}
                    onChange={(checked) =>
                      toggleOverrideMutation.mutate({ guestId: guest.id, isInvited: checked })
                    }
                    disabled={toggleOverrideMutation.isPending}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
