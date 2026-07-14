import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Input, Textarea, Badge, LoadingSpinner, ErrorState, EmptyState, Modal, Toggle } from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";
import type { EventContextValue } from "./event-layout";

const emptyForm = {
  name: "",
  date: "",
  time: "",
  venue: "",
  address: "",
  description: "",
  dress_code: "",
  rsvp_deadline: "",
  rsvp_enabled: true,
};

export function EventsPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: subEvents, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const orderIndex = editingId
        ? (subEvents?.find((s) => s.id === editingId)?.order_index ?? 0)
        : (subEvents?.length ?? 0);
      const payload = {
        parent_event_id: eventId,
        name: form.name,
        date: form.date || null,
        time: form.time || null,
        venue: form.venue || null,
        address: form.address || null,
        description: form.description || null,
        dress_code: form.dress_code || null,
        rsvp_deadline: form.rsvp_deadline || null,
        rsvp_enabled: form.rsvp_enabled,
        order_index: orderIndex,
      };
      if (editingId) {
        const { error } = await supabase
          .from("sub_events")
          .update(payload)
          .eq("id", editingId);
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
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
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

  function handleEdit(subEvent: SubEvent) {
    setEditingId(subEvent.id);
    setForm({
      name: subEvent.name,
      date: subEvent.date ?? "",
      time: subEvent.time ?? "",
      venue: subEvent.venue ?? "",
      address: subEvent.address ?? "",
      description: subEvent.description ?? "",
      dress_code: subEvent.dress_code ?? "",
      rsvp_deadline: subEvent.rsvp_deadline ?? "",
      rsvp_enabled: subEvent.rsvp_enabled,
    });
    setShowForm(true);
  }

  function handleAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    saveMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState message={error?.message ?? "Failed to load events"} onRetry={refetch} />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Events</h2>
          <p className="text-sm text-dash-muted">Manage individual events within your celebration.</p>
        </div>
        <Button onClick={handleAdd}>Add Event</Button>
      </div>

      {!subEvents || subEvents.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Add events like Ceremony, Reception, or Mehndi to your celebration."
          icon={<span className="text-4xl">🎉</span>}
          action={<Button onClick={handleAdd}>Add First Event</Button>}
        />
      ) : (
        <div className="space-y-3">
          {subEvents.map((subEvent) => (
            <Card key={subEvent.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{subEvent.name}</h3>
                    {subEvent.rsvp_enabled ? (
                      <Badge variant="success">RSVP Open</Badge>
                    ) : (
                      <Badge variant="default">RSVP Closed</Badge>
                    )}
                  </div>
                  {subEvent.description && (
                    <p className="mt-1 text-sm text-dash-muted">{subEvent.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-dash-muted">
                    {subEvent.date && <span>📅 {formatDate(subEvent.date)}</span>}
                    {subEvent.time && <span>🕐 {formatTime12(subEvent.time)}</span>}
                    {subEvent.venue && <span>📍 {subEvent.venue}</span>}
                    {subEvent.dress_code && <span>👔 {subEvent.dress_code}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(subEvent)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete "${subEvent.name}"?`)) {
                        deleteMutation.mutate(subEvent.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Event" : "Add Event"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Event Name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Ceremony"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Additional details about this event..."
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            <Input
              label="Time"
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            />
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
            placeholder="e.g. Main Hall"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="e.g. 123 Main St"
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => setForm((f) => ({ ...f, dress_code: e.target.value }))}
            placeholder="e.g. Formal"
          />
          <Input
            label="RSVP Deadline"
            type="datetime-local"
            value={form.rsvp_deadline}
            onChange={(e) => setForm((f) => ({ ...f, rsvp_deadline: e.target.value }))}
          />
          <Toggle
            label="RSVP Enabled"
            checked={form.rsvp_enabled}
            onChange={(v) => setForm((f) => ({ ...f, rsvp_enabled: v }))}
          />
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error?.message ?? "Failed to save"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default EventsPage;
