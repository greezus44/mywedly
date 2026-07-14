import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventSchedule } from "../../lib/supabase";
import { Button, Card, Modal, Input, Textarea, EmptyState, LoadingSpinner } from "../../components/ui";
import { formatTime12 } from "../../lib/utils";

export function TimelinePage() {
  const { eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventSchedule | null>(null);
  const [form, setForm] = useState({ title: "", description: "", start_time: "", end_time: "", location: "" });

  const { data: items, isLoading } = useQuery({
    queryKey: ["timeline", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventSchedule[];
    },
  });

  function openCreate() {
    setEditing(null);
    setForm({ title: "", description: "", start_time: "", end_time: "", location: "" });
    setShowModal(true);
  }

  function openEdit(item: EventSchedule) {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description ?? "",
      start_time: item.start_time ?? "",
      end_time: item.end_time ?? "",
      location: item.location ?? "",
    });
    setShowModal(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase
          .from("event_schedule")
          .update({ ...form, description: form.description || null, end_time: form.end_time || null, location: form.location || null })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_schedule")
          .insert({ event_id: eventId, ...form, description: form.description || null, end_time: form.end_time || null, location: form.location || null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline", eventId] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["timeline", eventId] }),
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Timeline</h2>
        <Button size="sm" onClick={openCreate}>Add item</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : !items || items.length === 0 ? (
        <EmptyState
          title="No timeline items yet"
          description="Add the schedule for your event."
          action={<Button size="sm" onClick={openCreate}>Add first item</Button>}
        />
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-dash-border" />
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="relative flex gap-4">
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dash-surface border-2 border-dash-border">
                  <svg className="h-4 w-4 text-dash-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                  </svg>
                </div>
                <Card className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-dash-text">{item.title}</h3>
                      {(item.start_time || item.end_time) && (
                        <p className="text-sm text-dash-primary mt-0.5">
                          {item.start_time && formatTime12(item.start_time)}
                          {item.end_time && ` – ${formatTime12(item.end_time)}`}
                        </p>
                      )}
                      {item.location && <p className="text-xs text-dash-muted mt-0.5">📍 {item.location}</p>}
                      {item.description && <p className="text-sm text-dash-muted mt-1">{item.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Timeline Item" : "Add Timeline Item"}
      >
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Time" type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
            <Input label="End Time" type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
          </div>
          <Input label="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Ballroom A" />
          {saveMutation.isError && <p className="text-sm text-red-500">{(saveMutation.error as Error)?.message}</p>}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={saveMutation.isPending} disabled={!form.title} onClick={() => saveMutation.mutate()}>
              {editing ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
