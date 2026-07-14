import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, FormField, Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { DateTimePicker } from "../../components/ui/DateTimePicker";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { formatDate, formatTime12, cn } from "../../lib/utils";

interface ScheduleFormData {
  title: string;
  description: string | null;
  schedule_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  address: string | null;
  dress_code: string | null;
  category: string | null;
  cover_image: string | null;
  order_index: number;
}

const emptyForm: ScheduleFormData = {
  title: "",
  description: null,
  schedule_date: null,
  start_time: null,
  end_time: null,
  venue: null,
  address: null,
  dress_code: null,
  category: null,
  cover_image: null,
  order_index: 0,
};

const categories = ["Ceremony", "Reception", "Dinner", "Party", "Other"];

export function TimelinePage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormData>(emptyForm);

  const { data: schedule, isLoading, isError, error } = useQuery({
    queryKey: ["event-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const { error } = await supabase
        .from("event_schedule")
        .insert({ ...data, event_id: eventId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setShowForm(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ScheduleFormData }) => {
      const { error } = await supabase
        .from("event_schedule")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
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
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
    },
  });

  function openCreate() {
    setForm({ ...emptyForm, order_index: schedule?.length ?? 0 });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(item: EventSchedule) {
    setForm({
      title: item.title,
      description: item.description,
      schedule_date: item.schedule_date,
      start_time: item.start_time,
      end_time: item.end_time,
      venue: item.venue,
      address: item.address,
      dress_code: item.dress_code,
      category: item.category,
      cover_image: item.cover_image,
      order_index: item.order_index,
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Failed to load schedule"} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Schedule</h2>
          <p className="mt-1 text-sm text-dash-muted">Manage the timeline of your event</p>
        </div>
        <Button onClick={openCreate}>Add Schedule Item</Button>
      </div>

      {schedule && schedule.length === 0 ? (
        <EmptyState
          title="No schedule items yet"
          description="Add items to your event timeline to show guests what to expect."
          action={<Button onClick={openCreate}>Add Schedule Item</Button>}
        />
      ) : (
        <div className="space-y-3">
          {schedule?.map((item, idx) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-dash-bg text-xs font-bold text-dash-muted">
                      {idx + 1}
                    </span>
                    <h3 className="text-base font-semibold text-dash-text">{item.title}</h3>
                    {item.category && (
                      <Badge variant="primary">{item.category}</Badge>
                    )}
                  </div>
                  {item.schedule_date && (
                    <p className="mt-2 text-sm text-dash-muted">
                      {formatDate(item.schedule_date)}
                      {item.start_time && ` · ${formatTime12(item.start_time)}`}
                      {item.end_time && ` – ${formatTime12(item.end_time)}`}
                    </p>
                  )}
                  {item.venue && (
                    <p className="mt-1 text-sm text-dash-muted">{item.venue}</p>
                  )}
                  {item.description && (
                    <p className="mt-2 text-sm text-dash-text">{item.description}</p>
                  )}
                  {item.dress_code && (
                    <p className="mt-1 text-xs text-dash-muted">Dress code: {item.dress_code}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
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
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. Ceremony"
            />
          </FormField>

          <FormField label="Category">
            <Select
              value={form.category ?? ""}
              onChange={(e) => setForm({ ...form, category: e.target.value || null })}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Select>
          </FormField>

          <DateTimePicker
            label="Date & Start Time"
            date={form.schedule_date}
            time={form.start_time}
            onChange={(d, t) => setForm({ ...form, schedule_date: d, start_time: t })}
          />

          <FormField label="End Time">
            <Input
              type="time"
              value={form.end_time ?? ""}
              onChange={(e) => setForm({ ...form, end_time: e.target.value || null })}
            />
          </FormField>

          <FormField label="Venue">
            <Input
              value={form.venue ?? ""}
              onChange={(e) => setForm({ ...form, venue: e.target.value || null })}
              placeholder="Venue name"
            />
          </FormField>

          <FormField label="Address">
            <Input
              value={form.address ?? ""}
              onChange={(e) => setForm({ ...form, address: e.target.value || null })}
              placeholder="Full address"
            />
          </FormField>

          <FormField label="Dress Code">
            <Input
              value={form.dress_code ?? ""}
              onChange={(e) => setForm({ ...form, dress_code: e.target.value || null })}
              placeholder="e.g. Black tie, Casual"
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value || null })}
              rows={3}
              placeholder="Additional details..."
            />
          </FormField>

          <FormField label="Cover Image">
            <ImageUpload
              bucket="event-assets"
              path={`events/${eventId}/schedule/${Date.now()}`}
              value={form.cover_image}
              onChange={(url) => setForm({ ...form, cover_image: url })}
            />
          </FormField>

          <FormField label="Order Index">
            <Input
              type="number"
              value={form.order_index}
              onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })}
            />
          </FormField>

          {createMutation.isError && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error ? createMutation.error.message : "Failed to save"}
            </p>
          )}
          {updateMutation.isError && (
            <p className="text-sm text-dash-danger">
              {updateMutation.error instanceof Error ? updateMutation.error.message : "Failed to update"}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
