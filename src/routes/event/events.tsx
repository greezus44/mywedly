import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type GuestGroup } from "../../lib/supabase";
import { Button, Card, Modal, Input, Textarea, EmptyState, LoadingSpinner, Badge, Toggle } from "../../components/ui";
import { formatDateShort, formatTime12 } from "../../lib/utils";

export function EventsPage() {
  const { eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<SubEvent | null>(null);
  const [editing, setEditing] = useState<SubEvent | null>(null);
  const [form, setForm] = useState({
    name: "", event_date: "", event_time: "", venue: "", address: "", description: "",
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as GuestGroup[];
    },
  });

  const { data: groupAssignments } = useQuery({
    queryKey: ["sub-event-group-assignments", eventId],
    queryFn: async () => {
      const subIds = (events ?? []).map((e) => e.id);
      if (subIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("sub_event_id, group_id")
        .in("sub_event_id", subIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: (events ?? []).length > 0,
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: "", event_date: "", event_time: "", venue: "", address: "", description: "" });
    setShowModal(true);
  }

  function openEdit(ev: SubEvent) {
    setEditing(ev);
    setForm({
      name: ev.name,
      event_date: ev.event_date ?? "",
      event_time: ev.event_time ?? "",
      venue: ev.venue ?? "",
      address: ev.address ?? "",
      description: ev.description ?? "",
    });
    setShowModal(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        event_date: form.event_date || null,
        event_time: form.event_time || null,
        venue: form.venue || null,
        address: form.address || null,
        description: form.description || null,
      };
      if (editing) {
        const { error } = await supabase.from("sub_events").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sub_events").insert({ parent_event_id: eventId, ...payload });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] }),
  });

  const toggleGroupMutation = useMutation({
    mutationFn: async ({ subEventId, groupId, assigned }: { subEventId: string; groupId: string; assigned: boolean }) => {
      if (assigned) {
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sub-event-group-assignments", eventId] }),
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Events</h2>
        <Button size="sm" onClick={openCreate}>Add event</Button>
      </div>

      <p className="text-sm text-dash-muted">
        Add individual events (ceremony, reception, rehearsal dinner) and control which guest groups are invited to each.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : !events || events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Add your ceremony, reception and other events."
          action={<Button size="sm" onClick={openCreate}>Add first event</Button>}
        />
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const assigned = (groupAssignments ?? [])
              .filter((a: { sub_event_id: string; group_id: string }) => a.sub_event_id === ev.id)
              .map((a: { group_id: string }) => a.group_id);
            const assignedGroups = (groups ?? []).filter((g) => assigned.includes(g.id));

            return (
              <Card key={ev.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-dash-text">{ev.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-sm text-dash-muted">
                      {ev.event_date && <span>📅 {formatDateShort(ev.event_date)}</span>}
                      {ev.event_time && <span>🕐 {formatTime12(ev.event_time)}</span>}
                      {ev.venue && <span>📍 {ev.venue}</span>}
                    </div>
                    {ev.description && <p className="text-sm text-dash-muted mt-1">{ev.description}</p>}
                    {assignedGroups.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {assignedGroups.map((g) => (
                          <Badge key={g.id}>{g.name}</Badge>
                        ))}
                      </div>
                    )}
                    {assignedGroups.length === 0 && (groups ?? []).length > 0 && (
                      <p className="text-xs text-dash-muted mt-1">All guests invited</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {(groups ?? []).length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setShowAssignModal(ev)}>
                        Groups
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEdit(ev)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(ev.id)}>Delete</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Event" : "Add Event"}
      >
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Ceremony" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} />
            <Input label="Time" type="time" value={form.event_time} onChange={(e) => setForm((f) => ({ ...f, event_time: e.target.value }))} />
          </div>
          <Input label="Venue" value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} placeholder="e.g. The Chapel" />
          <Textarea label="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
          {saveMutation.isError && <p className="text-sm text-red-500">{(saveMutation.error as Error)?.message}</p>}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={saveMutation.isPending} disabled={!form.name.trim()} onClick={() => saveMutation.mutate()}>
              {editing ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Group assignment modal */}
      <Modal
        open={!!showAssignModal}
        onClose={() => setShowAssignModal(null)}
        title={`Assign Groups — ${showAssignModal?.name ?? ""}`}
      >
        <p className="text-sm text-dash-muted mb-4">
          Select which groups are invited to this event. If no groups are selected, all guests are invited.
        </p>
        <div className="space-y-2">
          {(groups ?? []).map((group) => {
            const assigned = (groupAssignments ?? []).some(
              (a: { sub_event_id: string; group_id: string }) => a.sub_event_id === showAssignModal?.id && a.group_id === group.id,
            );
            return (
              <div key={group.id} className="flex items-center justify-between rounded-md border border-dash-border px-3 py-2">
                <span className="text-sm text-dash-text">{group.name}</span>
                <Toggle
                  checked={assigned}
                  onChange={() => toggleGroupMutation.mutate({
                    subEventId: showAssignModal!.id,
                    groupId: group.id,
                    assigned,
                  })}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setShowAssignModal(null)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
