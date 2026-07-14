import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, LoadingSpinner, ErrorState, Badge, Toggle } from "../../components/ui";
import { cn } from "../../lib/utils";

export interface InvitationManagerProps {
  subEventId: string;
  subEventName: string;
  eventId: string;
}

export function InvitationManager({
  subEventId,
  subEventName,
  eventId,
}: InvitationManagerProps): React.ReactElement {
  const queryClient = useQueryClient();

  // Fetch groups for this event
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["guest-groups", eventId],
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
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["sub-event-group-assignments", subEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .eq("sub_event_id", subEventId);
      if (error) throw error;
      return data as { id: string; sub_event_id: string; group_id: string }[];
    },
  });

  // Fetch manual overrides for this sub-event
  const { data: overrides, isLoading: overridesLoading } = useQuery({
    queryKey: ["guest-invitation-overrides", subEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("sub_event_id", subEventId);
      if (error) throw error;
      return data as { id: string; sub_event_id: string; guest_id: string; is_invited: boolean }[];
    },
  });

  // Fetch all guests for this event (for manual override section)
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

  const [overrideSearch, setOverrideSearch] = useState("");

  const assignedGroupIds = new Set((assignments ?? []).map((a) => a.group_id));
  const overrideMap = new Map((overrides ?? []).map((o) => [o.guest_id, o.is_invited] as const));

  const toggleAssignmentMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const isAssigned = assignedGroupIds.has(groupId);
      if (isAssigned) {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .delete()
          .eq("sub_event_id", subEventId)
          .eq("group_id", groupId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .insert({ sub_event_id: subEventId, group_id: groupId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-event-group-assignments", subEventId] });
    },
  });

  const toggleOverrideMutation = useMutation({
    mutationFn: async ({ guestId, isInvited }: { guestId: string; isInvited: boolean }) => {
      const existing = overrides?.find((o) => o.guest_id === guestId);
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .delete()
          .eq("sub_event_id", subEventId)
          .eq("guest_id", guestId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ sub_event_id: subEventId, guest_id: guestId, is_invited: isInvited });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", subEventId] });
    },
  });

  const isLoading = groupsLoading || assignmentsLoading || overridesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <LoadingSpinner className="h-6 w-6" />
      </div>
    );
  }

  const filteredGuests = (guests ?? []).filter((g) =>
    g.name.toLowerCase().includes(overrideSearch.toLowerCase()),
  );

  return (
    <Card className="bg-dash-bg/50">
      <h4 className="text-sm font-semibold text-dash-text mb-4">
        Invitation Manager — {subEventName}
      </h4>

      {/* Group assignments */}
      <div className="mb-6">
        <h5 className="text-xs font-semibold text-dash-muted uppercase tracking-wide mb-2">
          Group Assignments
        </h5>
        <p className="text-xs text-dash-muted mb-3">
          Assign entire groups to this event. All guests in assigned groups will be invited.
        </p>
        {groups && groups.length > 0 ? (
          <div className="space-y-2">
            {groups.map((group) => {
              const isAssigned = assignedGroupIds.has(group.id);
              return (
                <div
                  key={group.id}
                  className="flex items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 py-2"
                >
                  <span className="text-sm text-dash-text">{group.name}</span>
                  <Toggle
                    checked={isAssigned}
                    onChange={() => toggleAssignmentMutation.mutate(group.id)}
                    disabled={toggleAssignmentMutation.isPending}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-dash-muted">No groups available. Create groups first.</p>
        )}
      </div>

      {/* Manual overrides */}
      <div>
        <h5 className="text-xs font-semibold text-dash-muted uppercase tracking-wide mb-2">
          Manual Overrides
        </h5>
        <p className="text-xs text-dash-muted mb-3">
          Override individual guest invitations. Toggle to invite or uninvite specific guests.
        </p>
        <input
          type="text"
          value={overrideSearch}
          onChange={(e) => setOverrideSearch(e.target.value)}
          placeholder="Search guests..."
          className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text placeholder:text-dash-muted/60 focus:outline-none focus:ring-2 focus:ring-dash-primary/30 mb-2"
        />
        {filteredGuests.length > 0 ? (
          <div className="max-h-48 space-y-1 overflow-y-auto scrollbar-thin">
            {filteredGuests.map((guest) => {
              const hasOverride = overrideMap.has(guest.id);
              const isInvited = hasOverride ? overrideMap.get(guest.id) : false;
              const groupInvited = guest.group_id
                ? assignedGroupIds.has(guest.group_id)
                : false;
              const effectiveInvited = hasOverride ? isInvited : groupInvited;

              return (
                <div
                  key={guest.id}
                  className="flex items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 py-1.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-dash-text truncate">{guest.name}</span>
                    {hasOverride && (
                      <Badge variant={isInvited ? "success" : "danger"}>override</Badge>
                    )}
                    {!hasOverride && groupInvited && (
                      <Badge variant="primary">via group</Badge>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toggleOverrideMutation.mutate({
                        guestId: guest.id,
                        isInvited: !effectiveInvited,
                      })
                    }
                    disabled={toggleOverrideMutation.isPending}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium transition-colors shrink-0",
                      effectiveInvited
                        ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                        : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
                    )}
                  >
                    {effectiveInvited ? "Invited" : "Not Invited"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-dash-muted">No guests found.</p>
        )}
      </div>
    </Card>
  );
}
