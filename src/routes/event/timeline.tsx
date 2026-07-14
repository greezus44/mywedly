import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventSchedule } from "../../lib/supabase";
import { formatDateShort, formatTime12, cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
  IconButton,
} from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";

const CATEGORIES = [
  "Ceremony",
  "Reception",
  "Dinner",
  "Party",
  "Other",
];

interface FormState {
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

const emptyForm: FormState = {
  title: "",
  description: "",
  schedule_date: null,
  start_time: null,
  end_time: null,
  venue: "",
  address: "",
  dress_code: "",
  category: "Other",
  cover_image: null,
  order_index: 0,
};

export default function Timeline() {
  const { eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: items, isLoading, isError } = useQuery({
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
    enabled: !!eventId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        event_id: eventId,
        cover_image: form.cover_image,
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
      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);
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
    setForm({ ...emptyForm, order_index: items?.length ?? 0 });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (item: EventSchedule) => {
    setForm({
      title: item.title,
      description: item.description ?? "",
      schedule_date: item.schedule_date,
      start_time: item.start_time,
      end_time: item.end_time,
      venue: item.venue ?? "",
      address: item.address ?? "",
      dress_code: item.dress_code ?? "",
      category: item.category ?? "Other",
      cover_image: item.cover_image,
      order_index: item.order_index,
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load schedule" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Schedule</h2>
          <p className="text-sm text-muted">
            Create a timeline of events for your guests.
          </p>
        </div>
        <Button onClick={openCreate}>Add Schedule Item</Button>
      </div>

      {items && items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.id} className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  {item.category && <Badge>{item.category}</Badge>}
                </div>
                {item.description && (
                  <p className="mt-1 text-sm text-muted">{item.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                  {item.schedule_date && (
                    <span>📅 {formatDateShort(item.schedule_date)}</span>
                  )}
                  {item.start_time && (
                    <span>⏰ {formatTime12(item.start_time)}</span>
                  )}
                  {item.end_time && <span>→ {formatTime12(item.end_time)}</span>}
                  {item.venue && <span>📍 {item.venue}</span>}
                  {item.dress_code && <span>👔 {item.dress_code}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <IconButton onClick={() => openEdit(item)} title="Edit">
                  ✏️
                </IconButton>
                <IconButton
                  onClick={() => deleteMutation.mutate(item.id)}
                  title="Delete"
                  className="hover:text-danger"
                >
                  🗑
                </IconButton>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No schedule items"
          description="Add items to create a timeline for your event."
          action={<Button onClick={openCreate}>Add Schedule Item</Button>}
        />
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Schedule Item" : "Add Schedule Item"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Wedding Ceremony"
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Additional details..."
            rows={2}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              label="Date"
              value={form.schedule_date}
              onChange={(d) => setForm({ ...form, schedule_date: d })}
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <TimePicker
              label="Start Time"
              value={form.start_time}
              onChange={(t) => setForm({ ...form, start_time: t })}
            />
            <TimePicker
              label="End Time"
              value={form.end_time}
              onChange={(t) => setForm({ ...form, end_time: t })}
            />
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
            placeholder="Venue name"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Full address"
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
            placeholder="e.g. Black tie, Casual"
          />
          {saveMutation.isError && (
            <p className="text-sm text-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
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
