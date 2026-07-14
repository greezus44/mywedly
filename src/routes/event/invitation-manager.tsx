import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestGroup, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Card, Badge, LoadingSpinner, ErrorState, Toggle } from "../../components/ui";
import { cn } from "../../lib/utils";

interface InvitationManagerProps {
  subEvent: SubEvent;
  onBack: () => void;
}

interface OverrideRow {
  id: string;
  sub_event_id: string;
  guest_id: string;
  is_invited: boolean;
}

export function InvitationManager({ subEvent, onBack }: InvitationManagerProps) {
  const queryClient = useQueryClient();
  const eventId = subEvent.parent_event_id;
  const subEventId = subEvent.id;
  const [search, setSearch] = useState("");

  // Fetch all guests for this event
  const {
    data: guests,
    isLoading: guestsLoading,
    isError: guestsError,
    refetch: refetchGuests,
  } = useQuery({
    queryKey: ["event-guests-invite", eventId],
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

  // Fetch guest groups
  const { data: groups } = useQuery({
    queryKey: ["guest-groups-invite", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  // Fetch group assignments for this sub-event
  const { data: groupAssignments } = useQuery({
    queryKey: ["sub-event-group-assignments", subEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .eq("sub_event_id", subEventId);
      if (error) throw error;
      return data as { id: string; group_id: string; sub_event_id: string }[];
    },
  });

  // Fetch overrides for this sub-event
  const {
    data: overrides,
    isLoading: overridesLoading,
    isError: overridesError,
    refetch: refetchOverrides,
  } = useQuery({
    queryKey: ["overrides", subEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("sub_event_id", subEventId);
      if (error) throw error;
      return data as OverrideRow[];
    },
  });

  // Build lookup maps
  const overrideMap = useMemo(() => {
    const map = new Map<string, boolean>();
    overrides?.forEach((o) => map.set(o.guest_id, o.is_invited));
    return map;
  }, [overrides]);

  const assignedGroupIds = useMemo(() => {
    return new Set(groupAssignments?.map((a) => a.group_id) ?? []);
  }, [groupAssignments]);

  // Determine if a guest is invited
  const isGuestInvited = useCallback(
    (guest: EventGuest): boolean => {
      // Override takes precedence
      if (overrideMap.has(guest.id)) {
        return overrideMap.get(guest.id)!;
      }
      // Group assignment
      if (guest.group_id && assignedGroupIds.has(guest.group_id)) {
        return true;
      }
      return false;
    },
    [overrideMap, assignedGroupIds]
  );

  // Toggle group assignment
  const toggleGroupMutation = useMutation({
    mutationFn: async ({ groupId, assign }: { groupId: string; assign: boolean }) => {
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
      queryClient.invalidateQueries({ queryKey: ["sub-event-group-assignments", subEventId] });
    },
  });

  // Toggle individual override
  const toggleOverrideMutation = useMutation({
    mutationFn: async ({ guestId, isInvited }: { guestId: string; isInvited: boolean }) => {
      // Check if override exists
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
          .insert({
            sub_event_id: subEventId,
            guest_id: guestId,
            is_invited: isInvited,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overrides", subEventId] });
    },
  });

  // Filtered guests
  const filteredGuests = useMemo(() => {
    if (!search.trim()) return guests ?? [];
    const q = search.toLowerCase();
    return (guests ?? []).filter(
      (g) =>
        (g.name ?? "").toLowerCase().includes(q) ||
        (g.email ?? "").toLowerCase().includes(q)
    );
  }, [guests, search]);

  if (guestsLoading || overridesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <h2 className="text-xl font-semibold text-dash-text">
            Invitations: {subEvent.name}
          </h2>
        </div>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (guestsError || overridesError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <h2 className="text-xl font-semibold text-dash-text">
            Invitations: {subEvent.name}
          </h2>
        </div>
        <ErrorState
          onRetry={() => {
            refetchGuests();
            refetchOverrides();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="text-xl font-semibold text-dash-text">
          Invitations: {subEvent.name}
        </h2>
      </div>

      {/* Group Assignments */}
      {groups && groups.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-dash-text">
            Group Assignments
          </h3>
          <p className="mb-3 text-sm text-dash-muted">
            Assign entire groups to this event. Individual overrides take precedence.
          </p>
          <div className="flex flex-wrap gap-3">
            {groups.map((group) => {
              const isAssigned = assignedGroupIds.has(group.id);
              return (
                <div
                  key={group.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md border p-2",
                    isAssigned
                      ? "border-dash-primary/30 bg-dash-primary/5"
                      : "border-dash-border"
                  )}
                >
                  <Toggle
                    checked={isAssigned}
                    onChange={(v) =>
                      toggleGroupMutation.mutate({
                        groupId: group.id,
                        assign: v,
                      })
                    }
                    label={group.name}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Individual Guest Overrides */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dash-text">
            Individual Guests
          </h3>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests..."
            className="max-w-xs"
          />
        </div>

        {filteredGuests.length === 0 ? (
          <p className="text-sm text-dash-muted">No guests found.</p>
        ) : (
          <div className="space-y-2">
            {filteredGuests.map((guest) => {
              const invited = isGuestInvited(guest);
              const groupName = groups?.find((g) => g.id === guest.group_id)?.name;
              const hasOverride = overrideMap.has(guest.id);
              return (
                <div
                  key={guest.id}
                  className={cn(
                    "flex items-center justify-between rounded-md border p-3",
                    invited
                      ? "border-dash-primary/30 bg-dash-primary/5"
                      : "border-dash-border"
                  )}
                >
                  <div>
                    <span className="font-medium text-dash-text">{guest.name}</span>
                    {groupName && (
                      <Badge className="ml-2" color="default">
                        {groupName}
                      </Badge>
                    )}
                    {hasOverride && (
                      <Badge className="ml-2" color="primary">
                        Override
                      </Badge>
                    )}
                  </div>
                  <Toggle
                    checked={invited}
                    onChange={(v) =>
                      toggleOverrideMutation.mutate({
                        guestId: guest.id,
                        isInvited: v,
                      })
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
