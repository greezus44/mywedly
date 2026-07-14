import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestGroup, type GuestInvitationOverride } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, LoadingSpinner, Toggle, Badge } from "../../components/ui";

interface InvitationManagerProps {
  subEvent: SubEvent;
}

export function InvitationManager({ subEvent }: InvitationManagerProps) {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["sub-event-group-assignments", subEvent.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .eq("sub_event_id", subEvent.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: overrides, isLoading: overridesLoading } = useQuery({
    queryKey: ["guest-invitation-overrides", subEvent.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("sub_event_id", subEvent.id);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
  });

  const assignedGroupIds = new Set((assignments ?? []).map((a) => a.group_id));

  const toggleAssignment = useMutation({
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

  if (groupsLoading || assignmentsLoading || overridesLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="rounded-md border border-dash-border bg-dash-bg p-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between"
      >
        <span className="text-sm font-medium text-dash-text">Invitation Manager</span>
        <span className="text-xs text-dash-muted">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Group Assignments */}
          <div>
            <h4 className="text-xs font-semibold text-dash-text mb-2">Group Assignments</h4>
            <p className="text-xs text-dash-muted mb-3">
              Toggle which groups are invited to this event.
            </p>
            <div className="space-y-2">
              {groups && groups.length > 0 ? (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 py-2"
                  >
                    <span className="text-sm text-dash-text">{group.name}</span>
                    <Toggle
                      checked={assignedGroupIds.has(group.id)}
                      onChange={() => toggleAssignment.mutate(group.id)}
                    />
                  </div>
                ))
              ) : (
                <p className="text-xs text-dash-muted">No groups available. Create groups first.</p>
              )}
            </div>
          </div>

          {/* Manual Overrides */}
          <div>
            <h4 className="text-xs font-semibold text-dash-text mb-2">Manual Overrides</h4>
            <p className="text-xs text-dash-muted mb-3">
              Individual guest overrides for this event. Manage these from the Guests page.
            </p>
            {overrides && overrides.length > 0 ? (
              <div className="space-y-1">
                {overrides.map((override) => (
                  <div
                    key={override.id}
                    className="flex items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 py-1.5"
                  >
                    <span className="text-xs text-dash-muted">
                      Guest: {override.guest_id.slice(0, 8)}...
                    </span>
                    <Badge variant={override.allowed ? "success" : "danger"}>
                      {override.allowed ? "Allowed" : "Denied"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-dash-muted">No manual overrides for this event.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
