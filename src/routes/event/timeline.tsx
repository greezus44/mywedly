import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventSchedule } from "../../lib/supabase";
import { formatDate, formatTime12, cn } from "../../lib/utils";
import {
  Button,
  Card,
  Modal,
  Input,
  Textarea,
  DatePicker,
  TimePicker,
  Badge,
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "../../components/ui";

interface ScheduleForm {
  title: string;
  description: string;
  schedule_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  address: string;
  dress_code: string;
  category: string;
}

const EMPTY_FORM: ScheduleForm = {
  title: "",
  description: "",
  schedule_date: null,
  start_time: null,
  end_time: null,
  venue: "",
  address: "",
  dress_code: "",
  category: "",
};

export default function TimelinePage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventSchedule | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);

  const { data: schedules, isLoading, isError, refetch } = useQuery({
    queryKey: ["event_schedule", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", event.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const orderIndex = schedules?.length ?? 0;
      const { error } = await supabase.from("event_schedule").insert({
        ...form,
        event_id: event.id,
        order_index: orderIndex,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_schedule", event.id] });
      setModalOpen(false);
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase
        .from("event_schedule")
        .update(form)
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_schedule", event.id] });
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_schedule", event.id] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (s: EventSchedule) => {
    setEditing(s);
    setForm({
      title: s.title,
      description: s.description ?? "",
      schedule_date: s.schedule_date,
      start_time: s.start_time,
      end_time: s.end_time,
      venue: s.venue ?? "",
      address: s.address ?? "",
      dress_code: s.dress_code ?? "",
      category: s.category ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState message="Failed to load schedule." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Schedule</h2>
          <p className="text-sm text-dash-muted">Manage the timeline of your event day.</p>
        </div>
        <Button onClick={openCreate}>Add Schedule Item</Button>
      </div>

      {(!schedules || schedules.length === 0) && (
        <EmptyState
          title="No schedule items"
          description="Add items to create a timeline for your event day."
          icon={<span className="text-4xl">📅</span>}
          action={<Button onClick={openCreate}>Add Schedule Item</Button>}
        />
      )}

      {schedules && schedules.length > 0 && (
        <div className="space-y-3">
          {schedules.map((s) => (
            <Card key={s.id} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-dash-text">{s.title}</h3>
                  {s.category && <Badge variant="info">{s.category}</Badge>}
                </div>
                {s.description && (
                  <p className="mt-1 text-sm text-dash-muted">{s.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-dash-muted">
                  {s.schedule_date && <span>📅 {formatDate(s.schedule_date)}</span>}
                  {s.start_time && <span>🕐 {formatTime12(s.start_time)}</span>}
                  {s.end_time && <span>→ {formatTime12(s.end_time)}</span>}
                  {s.venue && <span>📍 {s.venue}</span>}
                  {s.dress_code && <span>👔 {s.dress_code}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm("Delete this schedule item?")) deleteMutation.mutate(s.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Schedule Item" : "Add Schedule Item"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Ceremony"
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              label="Date"
              value={form.schedule_date}
              onChange={(val) => setForm({ ...form, schedule_date: val })}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-dash-text">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Ceremony, Reception"
                className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TimePicker
              label="Start Time"
              value={form.start_time}
              onChange={(val) => setForm({ ...form, start_time: val })}
            />
            <TimePicker
              label="End Time"
              value={form.end_time}
              onChange={(val) => setForm({ ...form, end_time: val })}
            />
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
            placeholder="e.g. Main Hall"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="e.g. 123 Main St"
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
            placeholder="e.g. Formal, Casual"
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              {createMutation.error?.message || updateMutation.error?.message || "Failed to save"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
