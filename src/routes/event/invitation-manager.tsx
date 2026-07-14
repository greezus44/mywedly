import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type GuestGroup, type GuestGroupMember } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, EmptyState, Modal, Toggle } from "../../components/ui";

interface EventContextValue { event: UserEvent; eventId: string; }

export function InvitationManager() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showAssign, setShowAssign] = useState(false);
  const [selectedSubEvent, setSelectedSubEvent] = useState<string | null>(null);

  const { data: subEvents, isLoading, isError, error } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", eventId).order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["guest-groups-im", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_groups").select("*").eq("event_id", eventId).order("name", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["sub-event-assignments", selectedSubEvent],
    queryFn: async () => {
      if (!selectedSubEvent) return [];
      const { data, error } = await supabase.from("sub_event_group_assignments").select("*").eq("sub_event_id", selectedSubEvent);
      if (error) throw error;
      return data as { id: string; sub_event_id: string; group_id: string }[];
    },
    enabled: !!selectedSubEvent,
  });

  const toggleAssignment = useMutation({
    mutationFn: async ({ groupId, assign }: { groupId: string; assign: boolean }) => {
      if (assign) {
        const { error } = await supabase.from("sub_event_group_assignments").insert({ sub_event_id: selectedSubEvent!, group_id: groupId });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase.from("sub_event_group_assignments").delete().eq("sub_event_id", selectedSubEvent!).eq("group_id", groupId);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sub-event-assignments", selectedSubEvent] }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load sub-events" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Invitations</h2>
        <Button size="sm" onClick={() => setShowAssign(true)} disabled={!subEvents || subEvents.length === 0}>Manage Assignments</Button>
      </div>
      {!subEvents || subEvents.length === 0 ? (
        <EmptyState title="No sub-events" description="Create sub-events (e.g. ceremony, reception) to manage invitations." />
      ) : (
        <div className="space-y-3">
          {subEvents.map((se) => (
            <div key={se.id} className="rounded-lg border border-dash-border bg-dash-surface p-4">
              <h3 className="font-semibold text-dash-text">{se.name}</h3>
              <p className="text-sm text-dash-muted">{se.date ? new Date(se.date).toLocaleDateString() : "No date"} · {se.rsvp_enabled ? "RSVP enabled" : "RSVP disabled"}</p>
            </div>
          ))}
        </div>
      )}
      <Modal open={showAssign} onClose={() => { setShowAssign(false); setSelectedSubEvent(null); }} title="Manage Group Assignments">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Sub-Event</label>
            <select value={selectedSubEvent ?? ""} onChange={(e) => setSelectedSubEvent(e.target.value || null)} className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text">
              <option value="">Select a sub-event</option>
              {(subEvents ?? []).map((se) => <option key={se.id} value={se.id}>{se.name}</option>)}
            </select>
          </div>
          {selectedSubEvent && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-dash-text">Assign Groups</h4>
              {(!groups || groups.length === 0) ? (
                <p className="text-sm text-dash-muted">No groups available. Create groups first.</p>
              ) : (
                groups.map((g) => {
                  const assigned = (assignments ?? []).some((a) => a.group_id === g.id);
                  return (
                    <div key={g.id} className="flex items-center justify-between rounded-lg border border-dash-border p-3">
                      <span className="text-sm text-dash-text">{g.name}</span>
                      <Toggle checked={assigned} onChange={(v) => toggleAssignment.mutate({ groupId: g.id, assign: v })} />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
