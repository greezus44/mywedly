import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestGroup, type GuestInvitationOverride, type SubEventGroupAssignment } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, LoadingSpinner } from "../../components/ui";
import { cn } from "../../lib/utils";

interface InvitationManagerProps {
  eventId: string;
  subEvents: SubEvent[];
}

export function InvitationManager({ eventId, subEvents }: InvitationManagerProps) {
  const queryClient = useQueryClient();
  const [selectedSubEvent, setSelectedSubEvent] = useState<string | null>(
    subEvents[0]?.id ?? null,
  );

  useEffect(() => {
    if (!selectedSubEvent && subEvents.length > 0) {
      setSelectedSubEvent(subEvents[0].id);
    }
  }, [subEvents, selectedSubEvent]);

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["guest-groups-invite", eventId],
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
    queryKey: ["sub-event-group-assignments", selectedSubEvent],
    queryFn: async () => {
      if (!selectedSubEvent) return [];
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .eq("sub_event_id", selectedSubEvent);
      if (error) throw error;
      return data as SubEventGroupAssignment[];
    },
    enabled: !!selectedSubEvent,
  });

  const { data: overrides, isLoading: overridesLoading } = useQuery({
    queryKey: ["guest-invitation-overrides", selectedSubEvent],
    queryFn: async () => {
      if (!selectedSubEvent) return [];
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("sub_event_id", selectedSubEvent);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
    enabled: !!selectedSubEvent,
  });

  const assignedGroupIds = new Set(assignments?.map((a) => a.group_id) ?? []);

  const toggleAssignmentMutation = useMutation({
    mutationFn: async ({ groupId, assign }: { groupId: string; assign: boolean }) => {
      if (!selectedSubEvent) return;
      if (assign) {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .insert({ sub_event_id: selectedSubEvent, group_id: groupId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .delete()
          .eq("sub_event_id", selectedSubEvent)
          .eq("group_id", groupId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-event-group-assignments", selectedSubEvent] });
    },
  });

  if (subEvents.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-dash-muted">
          Create Events first to manage invitations.
        </p>
      </Card>
    );
  }

  if (groupsLoading || assignmentsLoading || overridesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-dash-text">Invitation Manager</h3>
        <p className="mt-1 text-sm text-dash-muted">
          Select an Event and assign guest groups to control who is invited.
        </p>
      </div>

      {/* Sub-event selector */}
      <div className="flex flex-wrap gap-2">
        {subEvents.map((se) => (
          <button
            key={se.id}
            type="button"
            onClick={() => setSelectedSubEvent(se.id)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              selectedSubEvent === se.id
                ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                : "border-dash-border text-dash-text hover:bg-dash-bg",
            )}
          >
            {se.name}
          </button>
        ))}
      </div>

      {/* Group assignments */}
      {selectedSubEvent && (
        <Card className="p-4">
          <h4 className="mb-3 text-sm font-semibold text-dash-text">Assign Guest Groups</h4>
          {groups && groups.length === 0 ? (
            <p className="text-sm text-dash-muted">No guest groups available. Create groups first.</p>
          ) : (
            <div className="space-y-2">
              {groups?.map((group) => {
                const isAssigned = assignedGroupIds.has(group.id);
                return (
                  <div
                    key={group.id}
                    className="flex items-center justify-between rounded-md border border-dash-border p-3"
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
          )}
        </Card>
      )}
    </div>
  );
}
