import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestGroup, type GuestInvitationOverride, type EventGuest, type SubEventGroupAssignment } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, LoadingSpinner, Toggle } from "../../components/ui";
import { cn } from "../../lib/utils";

export interface InvitationManagerProps {
  eventId: string;
  subEvents: SubEvent[];
  groups: GuestGroup[];
  guests: EventGuest[];
}

export function InvitationManager({
  eventId,
  subEvents,
  groups,
  guests,
}: InvitationManagerProps) {
  const queryClient = useQueryClient();
  const [selectedSubEventId, setSelectedSubEventId] = useState<string | null>(
    subEvents[0]?.id ?? null
  );

  // Fetch group assignments
  const { data: groupAssignments, isLoading: gaLoading } = useQuery({
    queryKey: ["sub-event-group-assignments", eventId],
    queryFn: async () => {
      const subEventIds = subEvents.map((s) => s.id);
      if (subEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .in("sub_event_id", subEventIds);
      if (error) throw error;
      return data as SubEventGroupAssignment[];
    },
    enabled: subEvents.length > 0,
  });

  // Fetch guest invitation overrides — use select("*") to include id field
  const { data: overrides, isLoading: oLoading } = useQuery({
    queryKey: ["guest-invitation-overrides", eventId],
    queryFn: async () => {
      const guestIds = guests.map((g) => g.id);
      if (guestIds.length === 0) return [];
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .in("guest_id", guestIds);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
    enabled: guests.length > 0,
  });

  // Group assignment map: subEventId -> Set<groupId>
  const groupAssignmentMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const a of groupAssignments ?? []) {
      if (!map.has(a.sub_event_id)) map.set(a.sub_event_id, new Set());
      map.get(a.sub_event_id)!.add(a.group_id);
    }
    return map;
  }, [groupAssignments]);

  // Override map: guestId -> { subEventId -> is_invited }
  const overrideMap = useMemo(() => {
    const map = new Map<string, Map<string, boolean>>();
    for (const o of overrides ?? []) {
      if (!map.has(o.guest_id)) map.set(o.guest_id, new Map());
      map.get(o.guest_id)!.set(o.sub_event_id, o.is_invited);
    }
    return map;
  }, [overrides]);

  // Toggle group assignment
  const toggleGroupAssignment = useMutation({
    mutationFn: async ({
      subEventId,
      groupId,
      assigned,
    }: {
      subEventId: string;
      groupId: string;
      assigned: boolean;
    }) => {
      if (assigned) {
        const existing = groupAssignments?.find(
          (a) => a.sub_event_id === subEventId && a.group_id === groupId
        );
        if (existing) return;
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
    },
  });

  // Toggle guest override
  const toggleGuestOverride = useMutation({
    mutationFn: async ({
      guestId,
      subEventId,
      isInvited,
    }: {
      guestId: string;
      subEventId: string;
      isInvited: boolean;
    }) => {
      const existing = overrides?.find(
        (o) => o.guest_id === guestId && o.sub_event_id === subEventId
      );
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: isInvited })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({
            guest_id: guestId,
            sub_event_id: subEventId,
            is_invited: isInvited,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", eventId] });
    },
  });

  // Check if guest is invited to a sub-event
  const isGuestInvited = useCallback(
    (guest: EventGuest, subEventId: string): boolean => {
      const guestOverrides = overrideMap.get(guest.id);
      if (guestOverrides && guestOverrides.has(subEventId)) {
        return guestOverrides.get(subEventId)!;
      }
      if (guest.group_id) {
        const assignedGroups = groupAssignmentMap.get(subEventId);
        if (assignedGroups && assignedGroups.has(guest.group_id)) {
          return true;
        }
      }
      const assignedGroups = groupAssignmentMap.get(subEventId);
      if (!assignedGroups || assignedGroups.size === 0) {
        return true;
      }
      return false;
    },
    [overrideMap, groupAssignmentMap]
  );

  if (subEvents.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-dash-muted">
          Add Events first to manage invitations.
        </p>
      </Card>
    );
  }

  if (gaLoading || oLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  const selectedSubEvent = subEvents.find((s) => s.id === selectedSubEventId);
  const selectedGuests = guests.filter((g) =>
    selectedSubEvent ? isGuestInvited(g, selectedSubEvent.id) : false
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-dash-text">Invitation Manager</h3>
        <p className="mt-1 text-xs text-dash-muted">
          Assign groups to events and override individual guest invitations
        </p>
      </div>

      {/* Sub-event selector */}
      <div className="flex flex-wrap gap-2">
        {subEvents.map((se) => (
          <button
            key={se.id}
            onClick={() => setSelectedSubEventId(se.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              selectedSubEventId === se.id
                ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                : "border-dash-border text-dash-text hover:bg-dash-bg"
            )}
          >
            {se.name}
          </button>
        ))}
      </div>

      {selectedSubEvent && (
        <>
          {/* Group assignments */}
          <Card>
            <h4 className="text-sm font-semibold text-dash-text">
              Group Assignments
            </h4>
            <p className="mt-1 text-xs text-dash-muted">
              Toggle which groups are invited to{" "}
              <strong>{selectedSubEvent.name}</strong>
            </p>
            <div className="mt-4 space-y-2">
              {groups.length === 0 ? (
                <p className="text-sm text-dash-muted">
                  No groups available. Create groups first.
                </p>
              ) : (
                groups.map((group) => {
                  const assignedGroups = groupAssignmentMap.get(selectedSubEvent.id);
                  const isAssigned = assignedGroups?.has(group.id) ?? false;
                  const guestCount = guests.filter((g) => g.group_id === group.id).length;
                  return (
                    <div
                      key={group.id}
                      className="flex items-center justify-between rounded-lg bg-dash-bg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-dash-text">
                          {group.name}
                        </span>
                        <Badge>{guestCount} guests</Badge>
                      </div>
                      <Toggle
                        checked={isAssigned}
                        onChange={(v) =>
                          toggleGroupAssignment.mutate({
                            subEventId: selectedSubEvent.id,
                            groupId: group.id,
                            assigned: v,
                          })
                        }
                      />
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Manual overrides */}
          <Card>
            <h4 className="text-sm font-semibold text-dash-text">
              Manual Overrides
            </h4>
            <p className="mt-1 text-xs text-dash-muted">
              Override individual guest invitations for{" "}
              <strong>{selectedSubEvent.name}</strong>
            </p>
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {guests.length === 0 ? (
                <p className="text-sm text-dash-muted">No guests available.</p>
              ) : (
                guests.map((guest) => {
                  const invited = isGuestInvited(guest, selectedSubEvent.id);
                  const hasOverride = overrideMap
                    .get(guest.id)
                    ?.has(selectedSubEvent.id);
                  return (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between rounded-lg bg-dash-bg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-dash-text">
                          {guest.name}
                        </span>
                        {hasOverride && (
                          <Badge variant="primary">override</Badge>
                        )}
                      </div>
                      <Toggle
                        checked={invited}
                        onChange={(v) =>
                          toggleGuestOverride.mutate({
                            guestId: guest.id,
                            subEventId: selectedSubEvent.id,
                            isInvited: v,
                          })
                        }
                      />
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Summary */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-dash-muted">
                Invited to {selectedSubEvent.name}:
              </span>
              <Badge variant="success">{selectedGuests.length} guests</Badge>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
