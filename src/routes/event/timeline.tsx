import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, Textarea, EmptyState, LoadingSpinner, ErrorState, Modal } from "../../components/ui";
import { formatTime12 } from "../../lib/utils";

interface ScheduleForm {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
}

export function TimelinePage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventSchedule | null>(null);
  const [form, setForm] = useState<ScheduleForm>({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
  });

  const { data: schedule, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        event_id: eventId,
        title: form.title,
        description: form.description || null,
        start_time: form.start_time,
        end_time: form.end_time || null,
        location: form.location || null,
        sort_order: editing ? editing.sort_order : (schedule?.length ?? 0),
      };
      if (editing) {
        const { error } = await supabase
          .from("event_schedule")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_schedule")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowModal(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("event_schedule")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", start_time: "", end_time: "", location: "" });
    setShowModal(true);
  };

  const openEdit = (item: EventSchedule) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || "",
      start_time: item.start_time || "",
      end_time: item.end_time || "",
      location: item.location || "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_time) return;
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load schedule"
        message={error instanceof Error ? error.message : "An error occurred."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Schedule</h2>
          <p className="text-sm text-dash-muted">Manage your event timeline.</p>
        </div>
        <Button onClick={openCreate}>Add Item</Button>
      </div>

      {!schedule || schedule.length === 0 ? (
        <EmptyState
          title="No schedule items yet"
          message="Add items to your event timeline so guests know what to expect."
          action={<Button onClick={openCreate}>Add Item</Button>}
        />
      ) : (
        <div className="space-y-3">
          {schedule.map((item) => (
            <Card key={item.id} className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-dash-primary/10 px-2.5 py-0.5 text-xs font-medium text-dash-primary">
                    {formatTime12(item.start_time)}
                  </span>
                  {item.end_time && (
                    <span className="text-xs text-dash-muted">
                      to {formatTime12(item.end_time)}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-semibold text-dash-text">{item.title}</h3>
                {item.location && (
                  <p className="text-sm text-dash-muted">📍 {item.location}</p>
                )}
                {item.description && (
                  <p className="mt-1 text-sm text-dash-muted">{item.description}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="rounded-md p-1.5 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text"
                  title="Edit"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="rounded-md p-1.5 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-danger"
                  title="Delete"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Schedule Item" : "Add Schedule Item"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ceremony"
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
            />
          </div>
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="Main Hall"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Additional details..."
            rows={3}
          />
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save."}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editing ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
