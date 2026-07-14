import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type GuestGroup, type SubEventGroupAssignment } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Badge, LoadingSpinner, ErrorState } from "../../components/ui";
import { cn } from "../../lib/utils";

interface InvitationManagerProps {
  subEventId: string;
  subEventName: string;
}

export function InvitationManager({
  subEventId,
  subEventName,
}: InvitationManagerProps) {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const { data: groups } = useQuery<GuestGroup[]>({
    queryKey: ["guest_groups", eventId],
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

  const { data: assignments, isLoading, isError, error } = useQuery<SubEventGroupAssignment[]>({
    queryKey: ["sub_event_group_assignments", subEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .eq("sub_event_id", subEventId);
      if (error) throw error;
      return (data ?? []) as SubEventGroupAssignment[];
    },
  });

  const assignedGroupIds = useMemo(
    () => new Set((assignments ?? []).map((a) => a.group_id)),
    [assignments]
  );

  const toggleGroupMutation = useMutation({
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
      queryClient.invalidateQueries({
        queryKey: ["sub_event_group_assignments", subEventId],
      });
      queryClient.invalidateQueries({ queryKey: ["event_guests", eventId] });
    },
  });

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-sm text-dash-primary hover:underline"
      >
        Manage invitations →
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-dash-border bg-dash-bg p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-dash-text">
          Invitation Groups — {subEventName}
        </h4>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-dash-muted hover:text-dash-text"
        >
          Collapse
        </button>
      </div>

      <p className="mb-3 text-xs text-dash-muted">
        Assign groups to this event. All guests in an assigned group will be invited.
        Individual guests can also be toggled on the Guests page.
      </p>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load assignments"}
        />
      ) : groups && groups.length === 0 ? (
        <p className="text-sm text-dash-muted">
          No groups created yet. Create groups on the Guest Groups page.
        </p>
      ) : (
        <div className="space-y-2">
          {groups?.map((group) => {
            const isAssigned = assignedGroupIds.has(group.id);
            return (
              <div
                key={group.id}
                className="flex items-center justify-between rounded-lg border border-dash-border bg-dash-surface px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-dash-text">
                    {group.name}
                  </span>
                  {isAssigned && <Badge variant="success">Invited</Badge>}
                </div>
                <Button
                  variant={isAssigned ? "secondary" : "primary"}
                  size="sm"
                  loading={toggleGroupMutation.isPending}
                  onClick={() => toggleGroupMutation.mutate(group.id)}
                >
                  {isAssigned ? "Remove" : "Invite"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
