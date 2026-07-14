import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup, type SubEvent, type SubEventGroupAssignment } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export function GroupsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const { data: groups } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_groups").select("*").eq("event_id", eventId!).order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
    enabled: !!eventId,
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub_events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", eventId!).order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!eventId,
  });

  const { data: assignments } = useQuery({
    queryKey: ["assignments", selectedGroup],
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_event_group_assignments").select("*").eq("group_id", selectedGroup!);
      if (error) throw error;
      return data as SubEventGroupAssignment[];
    },
    enabled: !!selectedGroup,
  });

  const addGroupMutation = useMutation({
    mutationFn: async () => {
      const maxSort = groups?.reduce((mx, g) => Math.max(mx, g.sort_order), -1) ?? -1;
      const { error } = await supabase.from("guest_groups").insert({
        event_id: eventId,
        name: newGroupName,
        sort_order: maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", eventId] });
      setNewGroupName("");
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups", eventId] }),
  });

  const toggleAssignmentMutation = useMutation({
    mutationFn: async ({ subEventId, assigned }: { subEventId: string; assigned: boolean }) => {
      if (assigned) {
        const { error } = await supabase.from("sub_event_group_assignments").delete().eq("sub_event_id", subEventId).eq("group_id", selectedGroup!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sub_event_group_assignments").insert({
          sub_event_id: subEventId,
          group_id: selectedGroup!,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments", selectedGroup] }),
  });

  const assignedSubEvents = new Set((assignments ?? []).map((a) => a.sub_event_id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Guest Groups</h2>
        <p className="text-sm text-gray-500">Create groups and assign them to events for bulk invitations.</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="New group name…"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
        />
        <Button onClick={() => addGroupMutation.mutate()} disabled={!newGroupName.trim()}>
          Add Group
        </Button>
      </div>

      {groups && groups.length > 0 ? (
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-800">{g.name}</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedGroup(selectedGroup === g.id ? null : g.id)}>
                    {selectedGroup === g.id ? "Hide" : "Manage Invitations"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => { if (confirm("Delete this group?")) deleteGroupMutation.mutate(g.id); }}>
                    Delete
                  </Button>
                </div>
              </div>
              {selectedGroup === g.id && subEvents && (
                <div className="mt-4 border-t pt-3 space-y-2">
                  <p className="text-xs text-gray-500 mb-2">Select which events this group is invited to:</p>
                  {subEvents.length > 0 ? (
                    subEvents.map((se) => {
                      const isAssigned = assignedSubEvents.has(se.id);
                      return (
                        <label key={se.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => toggleAssignmentMutation.mutate({ subEventId: se.id, assigned: isAssigned })}
                            className="rounded"
                          />
                          <span className="text-gray-700">{se.name}</span>
                          {se.date && <span className="text-xs text-gray-400">({se.date})</span>}
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400">No sub-events created yet. Create events in the Events tab.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No groups yet. Create a group to organise your guests.</p>
      )}
    </div>
  );
}
