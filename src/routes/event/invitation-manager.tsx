import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestGroup, type SubEventGroupAssignment } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, LoadingSpinner } from "../../components/ui";
import { cn } from "../../lib/utils";

interface InvitationManagerProps {
  subEventId: string;
  parentEventId: string;
}

export function InvitationManager({ subEventId, parentEventId }: InvitationManagerProps) {
  const queryClient = useQueryClient();
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  // Fetch groups for this event
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["guest-groups", parentEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", parentEventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  // Fetch existing assignments for this sub-event
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["sub-event-group-assignments", subEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .eq("sub_event_id", subEventId);
      if (error) throw error;
      return data as SubEventGroupAssignment[];
    },
  });

  useEffect(() => {
    if (assignments) {
      setSelectedGroups(new Set(assignments.map((a) => a.group_id)));
    }
  }, [assignments]);

  const toggleMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const isAssigned = selectedGroups.has(groupId);
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

  function handleToggle(groupId: string) {
    const next = new Set(selectedGroups);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    setSelectedGroups(next);
    toggleMutation.mutate(groupId);
  }

  const isLoading = groupsLoading || assignmentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-dash-text mb-1">
          Group Invitations
        </h4>
        <p className="text-xs text-dash-muted mb-3">
          Select which guest groups are invited to this event. Guests in
          unassigned groups will be invited by default.
        </p>
      </div>

      {groups && groups.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => {
            const isSelected = selectedGroups.has(group.id);
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleToggle(group.id)}
                disabled={toggleMutation.isPending}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full border transition-colors",
                  isSelected
                    ? "bg-dash-primary text-dash-primary-fg border-transparent"
                    : "bg-dash-surface text-dash-text border-dash-border hover:bg-dash-bg",
                )}
              >
                {group.name}
                {isSelected && <span className="ml-1.5">✓</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-dash-muted">
          No guest groups yet. Create groups in the Guest Groups tab to manage invitations.
        </p>
      )}

      {toggleMutation.isError && (
        <p className="text-xs text-dash-danger">
          {toggleMutation.error instanceof Error ? toggleMutation.error.message : "Failed to update invitation"}
        </p>
      )}
    </div>
  );
}
