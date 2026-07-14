import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestGroup, type GuestInvitationOverride } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Badge, LoadingSpinner, Toggle } from "../../components/ui";

export function InvitationManager({ subEvent }: { subEvent: SubEvent }) {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const subEventId = subEvent.id;

  const { data: groups } = useQuery({
    queryKey: ["groups", eventId],
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
    queryKey: ["sub-event-assignments", subEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .eq("sub_event_id", subEventId);
      if (error) throw error;
      return (data ?? []) as { id: string; sub_event_id: string; group_id: string }[];
    },
  });

  const assignedGroupIds = new Set(assignments?.map((a) => a.group_id) ?? []);

  const toggleAssignment = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["sub-event-assignments", subEventId] });
    },
  });

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-dash-text">Invitations</h4>
        <Badge>{assignedGroupIds.size} groups assigned</Badge>
      </div>
      <p className="text-xs text-dash-muted">
        Assign guest groups to this Event. Guests in assigned groups will be invited.
      </p>
      {groups && groups.length === 0 ? (
        <p className="text-sm text-dash-muted py-2">No groups available. Create groups first.</p>
      ) : (
        <div className="space-y-2">
          {groups?.map((group) => {
            const isAssigned = assignedGroupIds.has(group.id);
            return (
              <div key={group.id} className="flex items-center justify-between py-1">
                <span className="text-sm text-dash-text">{group.name}</span>
                <Toggle
                  checked={isAssigned}
                  onChange={(checked) => toggleAssignment.mutate({ groupId: group.id, assign: checked })}
                />
              </div>
            );
          })}
        </div>
      )}
      {toggleAssignment.isError && (
        <p className="text-sm text-dash-danger">
          {toggleAssignment.error instanceof Error ? toggleAssignment.error.message : "Failed to update"}
        </p>
      )}
    </Card>
  );
}
