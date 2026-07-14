import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Input, Textarea, LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";
import type { EventContextValue } from "./event-layout";

const CATEGORIES = [
  "Ceremony",
  "Reception",
  "Dinner",
  "Party",
  "Photos",
  "Other",
];

const emptyForm = {
  title: "",
  description: "",
  schedule_date: "",
  start_time: "",
  end_time: "",
  venue: "",
  address: "",
  dress_code: "",
  category: "Other",
};

export function TimelinePage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: schedule, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const orderIndex = editingId
        ? (schedule?.find((s) => s.id === editingId)?.order_index ?? 0)
        : (schedule?.length ?? 0);
      const payload = {
        event_id: eventId,
        title: form.title,
        description: form.description || null,
        schedule_date: form.schedule_date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        venue: form.venue || null,
        address: form.address || null,
        dress_code: form.dress_code || null,
        category: form.category || null,
        order_index: orderIndex,
      };
      if (editingId) {
        const { error } = await supabase
          .from("event_schedule")
          .update(payload)
          .eq("id", editingId);
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
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
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

  function handleEdit(item: EventSchedule) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? "",
      schedule_date: item.schedule_date ?? "",
      start_time: item.start_time ?? "",
      end_time: item.end_time ?? "",
      venue: item.venue ?? "",
      address: item.address ?? "",
      dress_code: item.dress_code ?? "",
      category: item.category ?? "Other",
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
      <ErrorState message={error?.message ?? "Failed to load schedule"} onRetry={refetch} />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Schedule</h2>
          <p className="text-sm text-dash-muted">Manage the timeline for your event.</p>
        </div>
        <Button onClick={handleAdd}>Add Item</Button>
      </div>

      {!schedule || schedule.length === 0 ? (
        <EmptyState
          title="No schedule items"
          description="Add items to your event timeline to show guests what to expect."
          icon={<span className="text-4xl">📅</span>}
          action={<Button onClick={handleAdd}>Add First Item</Button>}
        />
      ) : (
        <div className="space-y-3">
          {schedule.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{item.title}</h3>
                    {item.category && (
                      <span className="rounded-full bg-dash-primary/10 px-2 py-0.5 text-xs font-medium text-dash-primary">
                        {item.category}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-dash-muted">{item.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-dash-muted">
                    {item.schedule_date && <span>📅 {formatDate(item.schedule_date)}</span>}
                    {item.start_time && <span>🕐 {formatTime12(item.start_time)}</span>}
                    {item.end_time && <span>→ {formatTime12(item.end_time)}</span>}
                    {item.venue && <span>📍 {item.venue}</span>}
                    {item.dress_code && <span>👔 {item.dress_code}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm("Delete this schedule item?")) {
                        deleteMutation.mutate(item.id);
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
        title={editingId ? "Edit Schedule Item" : "Add Schedule Item"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Ceremony"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Additional details..."
            rows={3}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={form.schedule_date}
              onChange={(e) => setForm((f) => ({ ...f, schedule_date: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
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

export default TimelinePage;
