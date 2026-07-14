import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestGroup, type GuestInvitationOverride } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, LoadingSpinner, Badge, Toggle } from "../../components/ui";
import { cn } from "../../lib/utils";

export interface InvitationManagerProps {
  subEvent: SubEvent;
}

export const InvitationManager: React.FC<InvitationManagerProps> = ({ subEvent }) => {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
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
      return data ?? [];
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

  const assignedGroupIds = useMemo(() => {
    return new Set((assignments ?? []).map((a) => a.group_id));
  }, [assignments]);

  const toggleAssignment = useMutation({
    mutationFn: async (args: { groupId: string; shouldAssign: boolean }) => {
      const { groupId, shouldAssign } = args;
      if (shouldAssign) {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .insert({ sub_event_id: subEvent.id, group_id: groupId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .delete()
          .eq("sub_event_id", subEvent.id)
          .eq("group_id", groupId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-event-group-assignments", subEvent.id] });
    },
  });

  const handleToggleGroup = (groupId: string, checked: boolean) => {
    toggleAssignment.mutate({ groupId, shouldAssign: checked });
  };

  if (groupsLoading) {
    return <LoadingSpinner size="sm" label="Loading groups..." />;
  }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-dash-text">Invitation Groups</h4>
        <p className="text-xs text-dash-muted">
          Select which groups are invited to this Event. Individual guest overrides take precedence.
        </p>
      </div>
      {(!groups || groups.length === 0) && (
        <p className="text-sm text-dash-muted">No groups available. Create groups in the Guest Groups tab.</p>
      )}
      {groups && groups.length > 0 && (
        <div className="space-y-2">
          {groups.map((group) => {
            const isAssigned = assignedGroupIds.has(group.id);
            return (
              <div
                key={group.id}
                className="flex items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 py-2"
              >
                <span className="text-sm font-medium text-dash-text">{group.name}</span>
                <Toggle
                  checked={isAssigned}
                  onChange={(checked) => handleToggleGroup(group.id, checked)}
                />
              </div>
            );
          })}
        </div>
      )}
      {(overrides && overrides.length > 0) && (
        <div className="mt-3">
          <p className="text-xs font-medium text-dash-muted">
            {overrides.length} individual guest override{overrides.length !== 1 ? "s" : ""} active
          </p>
        </div>
      )}
    </div>
  );
};
