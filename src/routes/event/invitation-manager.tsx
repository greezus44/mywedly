import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { SubEvent, GuestGroup, GuestInvitationOverride } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, LoadingSpinner } from "../../components/ui";
import { cn } from "../../lib/utils";

interface InvitationManagerProps {
  eventId: string;
  subEvents: SubEvent[];
}

export function InvitationManager({ eventId, subEvents }: InvitationManagerProps) {
  const queryClient = useQueryClient();
  const [selectedSubEventId, setSelectedSubEventId] = useState<string | null>(
    subEvents[0]?.id ?? null
  );

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

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["sub-event-group-assignments", selectedSubEventId],
    queryFn: async () => {
      if (!selectedSubEventId) return [];
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .eq("sub_event_id", selectedSubEventId);
      if (error) throw error;
      return data as { id: string; sub_event_id: string; group_id: string }[];
    },
    enabled: !!selectedSubEventId,
  });

  const { data: overrides, isLoading: overridesLoading } = useQuery({
    queryKey: ["guest-invitation-overrides", selectedSubEventId],
    queryFn: async () => {
      if (!selectedSubEventId) return [];
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("sub_event_id", selectedSubEventId);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
    enabled: !!selectedSubEventId,
  });

  const assignedGroupIds = useMemo(
    () => new Set((assignments ?? []).map((a) => a.group_id)),
    [assignments]
  );

  const toggleAssignmentMutation = useMutation({
    mutationFn: async ({ groupId, assign }: { groupId: string; assign: boolean }) => {
      if (!selectedSubEventId) throw new Error("No event selected");
      if (assign) {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .insert({ sub_event_id: selectedSubEventId, group_id: groupId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .delete()
          .eq("sub_event_id", selectedSubEventId)
          .eq("group_id", groupId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-event-group-assignments", selectedSubEventId] });
    },
  });

  if (subEvents.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-dash-muted">
          Create Events first to manage group invitations.
        </p>
      </Card>
    );
  }

  if (groupsLoading || assignmentsLoading || overridesLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Invitation Manager</h3>
        <p className="text-sm text-dash-muted mb-4">
          Assign guest groups to each Event. All guests in an assigned group will be invited.
        </p>
      </div>

      {/* Event selector */}
      <div className="flex flex-wrap gap-2">
        {subEvents.map((se) => (
          <button
            key={se.id}
            type="button"
            onClick={() => setSelectedSubEventId(se.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              selectedSubEventId === se.id
                ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                : "border-dash-border bg-dash-surface text-dash-muted hover:bg-dash-bg"
            )}
          >
            {se.name}
          </button>
        ))}
      </div>

      {/* Group assignments */}
      {selectedSubEventId && (
        <Card className="p-5">
          <h4 className="text-sm font-semibold text-dash-text mb-3">Assigned Groups</h4>
          {groups && groups.length > 0 ? (
            <div className="space-y-2">
              {groups.map((group) => {
                const isAssigned = assignedGroupIds.has(group.id);
                return (
                  <div
                    key={group.id}
                    className="flex items-center justify-between rounded-lg border border-dash-border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-dash-text">{group.name}</span>
                      {isAssigned && <Badge variant="success">Invited</Badge>}
                    </div>
                    <Button
                      variant={isAssigned ? "secondary" : "primary"}
                      size="sm"
                      loading={toggleAssignmentMutation.isPending}
                      onClick={() =>
                        toggleAssignmentMutation.mutate({
                          groupId: group.id,
                          assign: !isAssigned,
                        })
                      }
                    >
                      {isAssigned ? "Remove" : "Invite"}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-dash-muted">
              No guest groups yet. Create groups in the Guest Groups tab.
            </p>
          )}

          {overrides && overrides.length > 0 && (
            <div className="mt-4 pt-4 border-t border-dash-border">
              <h4 className="text-sm font-semibold text-dash-text mb-2">Individual Overrides</h4>
              <p className="text-sm text-dash-muted">
                {overrides.length} guest(s) have individual invitation overrides for this event.
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
