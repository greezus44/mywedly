import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, Textarea, EmptyState, LoadingSpinner, ErrorState, Modal, Badge } from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";

interface SubEventForm {
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  venue: string;
  address: string;
}

export function EventsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SubEvent | null>(null);
  const [form, setForm] = useState<SubEventForm>({
    name: "",
    description: "",
    start_time: "",
    end_time: "",
    venue: "",
    address: "",
  });

  const { data: subEvents, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("event_id", eventId)
        .order("start_time", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        event_id: eventId,
        name: form.name,
        description: form.description || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        venue: form.venue || null,
        address: form.address || null,
      };
      if (editing) {
        const { error } = await supabase
          .from("sub_events")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_events")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowModal(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sub_events")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", start_time: "", end_time: "", venue: "", address: "" });
    setShowModal(true);
  };

  const openEdit = (sub: SubEvent) => {
    setEditing(sub);
    setForm({
      name: sub.name,
      description: sub.description || "",
      start_time: sub.start_time || "",
      end_time: sub.end_time || "",
      venue: sub.venue || "",
      address: sub.address || "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
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
        title="Failed to load events"
        message={error instanceof Error ? error.message : "An error occurred."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Events</h2>
          <p className="text-sm text-dash-muted">
            Manage individual events within your celebration (e.g. Ceremony, Reception).
          </p>
        </div>
        <Button onClick={openCreate}>Add Event</Button>
      </div>

      {!subEvents || subEvents.length === 0 ? (
        <EmptyState
          title="No events yet"
          message="Add events to your celebration so guests can see the details."
          action={<Button onClick={openCreate}>Add Event</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subEvents.map((sub) => (
            <Card key={sub.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-dash-text">{sub.name}</h3>
                  {sub.start_time && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="info">{formatTime12(sub.start_time)}</Badge>
                      {sub.end_time && (
                        <span className="text-xs text-dash-muted">to {formatTime12(sub.end_time)}</span>
                      )}
                    </div>
                  )}
                  {sub.venue && (
                    <p className="mt-1 text-sm text-dash-muted">📍 {sub.venue}</p>
                  )}
                  {sub.address && (
                    <p className="text-xs text-dash-muted">{sub.address}</p>
                  )}
                  {sub.description && (
                    <p className="mt-2 text-sm text-dash-muted">{sub.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(sub)}
                    className="rounded-md p-1.5 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(sub.id)}
                    className="rounded-md p-1.5 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-danger"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Event" : "Add Event"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Event Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Ceremony"
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
            />
            <Input
              label="End Time"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
            />
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
            placeholder="Venue name"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Full address"
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
