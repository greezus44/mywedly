import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  Input,
  Textarea,
  Select,
  Card,
  Modal,
  DatePicker,
  TimePicker,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { formatDate, formatTime12, cn } from "../../lib/utils";

const CATEGORIES = [
  { value: "ceremony", label: "Ceremony" },
  { value: "reception", label: "Reception" },
  { value: "dinner", label: "Dinner" },
  { value: "party", label: "Party" },
  { value: "other", label: "Other" },
];

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
  cover_image: string | null;
  order_index: number;
}

const emptyForm: ScheduleForm = {
  title: "",
  description: "",
  schedule_date: null,
  start_time: null,
  end_time: null,
  venue: "",
  address: "",
  dress_code: "",
  category: "other",
  cover_image: null,
  order_index: 0,
};

async function fetchSchedule(eventId: string): Promise<EventSchedule[]> {
  const { data, error } = await supabase
    .from("event_schedule")
    .select("*")
    .eq("event_id", eventId)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data ?? []) as EventSchedule[];
}

async function createScheduleItem(eventId: string, form: ScheduleForm): Promise<void> {
  const { error } = await supabase.from("event_schedule").insert({
    event_id: eventId,
    title: form.title,
    description: form.description || null,
    schedule_date: form.schedule_date,
    start_time: form.start_time,
    end_time: form.end_time,
    venue: form.venue || null,
    address: form.address || null,
    dress_code: form.dress_code || null,
    category: form.category || null,
    cover_image: form.cover_image,
    order_index: form.order_index,
  });
  if (error) throw error;
}

async function updateScheduleItem(id: string, form: ScheduleForm): Promise<void> {
  const { error } = await supabase
    .from("event_schedule")
    .update({
      title: form.title,
      description: form.description || null,
      schedule_date: form.schedule_date,
      start_time: form.start_time,
      end_time: form.end_time,
      venue: form.venue || null,
      address: form.address || null,
      dress_code: form.dress_code || null,
      category: form.category || null,
      cover_image: form.cover_image,
      order_index: form.order_index,
    })
    .eq("id", id);
  if (error) throw error;
}

async function deleteScheduleItem(id: string): Promise<void> {
  const { error } = await supabase.from("event_schedule").delete().eq("id", id);
  if (error) throw error;
}

export function TimelinePage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EventSchedule | null>(null);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);

  const { data: items, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["schedule", eventId],
    queryFn: () => fetchSchedule(eventId),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingItem) {
        await updateScheduleItem(editingItem.id, form);
      } else {
        await createScheduleItem(eventId, form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowModal(false);
      setEditingItem(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteScheduleItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
    },
  });

  const openCreate = () => {
    setEditingItem(null);
    setForm({ ...emptyForm, order_index: items?.length ?? 0 });
    setShowModal(true);
  };

  const openEdit = (item: EventSchedule) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description ?? "",
      schedule_date: item.schedule_date,
      start_time: item.start_time,
      end_time: item.end_time,
      venue: item.venue ?? "",
      address: item.address ?? "",
      dress_code: item.dress_code ?? "",
      category: item.category ?? "other",
      cover_image: item.cover_image,
      order_index: item.order_index,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Schedule</h2>
          <p className="text-sm text-dash-muted">
            Manage the schedule of your event
          </p>
        </div>
        <Button onClick={openCreate}>Add schedule item</Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      )}

      {isError && (
        <ErrorState
          title="Failed to load schedule"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      )}

      {items && items.length === 0 && (
        <EmptyState
          title="No schedule items"
          description="Add schedule items to show the timeline of your event."
          action={<Button onClick={openCreate}>Add schedule item</Button>}
        />
      )}

      {items && items.length > 0 && (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-dash-border" />

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="relative pl-12">
                {/* Timeline dot */}
                <div className="absolute left-2 top-4 h-4 w-4 rounded-full bg-dash-primary border-4 border-dash-surface" />

                <Card className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-dash-text">{item.title}</h3>
                        {item.category && (
                          <Badge variant="primary" className="capitalize">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                      {item.schedule_date && (
                        <p className="text-sm text-dash-muted">
                          {formatDate(item.schedule_date)}
                          {item.start_time && ` at ${formatTime12(item.start_time)}`}
                          {item.end_time && ` – ${formatTime12(item.end_time)}`}
                        </p>
                      )}
                      {item.venue && (
                        <p className="text-sm text-dash-muted mt-1">{item.venue}</p>
                      )}
                      {item.description && (
                        <p className="text-sm text-dash-text mt-2">{item.description}</p>
                      )}
                      {item.dress_code && (
                        <p className="text-sm text-dash-muted mt-1">
                          Dress code: {item.dress_code}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? "Edit Schedule Item" : "Add Schedule Item"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            type="text"
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
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Date"
              value={form.schedule_date}
              onChange={(d) => setForm({ ...form, schedule_date: d })}
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TimePicker
              label="Start time"
              value={form.start_time}
              onChange={(t) => setForm({ ...form, start_time: t })}
            />
            <TimePicker
              label="End time"
              value={form.end_time}
              onChange={(t) => setForm({ ...form, end_time: t })}
            />
          </div>
          <Input
            label="Venue"
            type="text"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
            placeholder="Venue name"
          />
          <Input
            label="Address"
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Full address"
          />
          <Input
            label="Dress code"
            type="text"
            value={form.dress_code}
            onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
            placeholder="e.g. Black tie"
          />

          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!form.title.trim()}
            >
              {editingItem ? "Save changes" : "Add item"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
