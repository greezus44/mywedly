import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventSchedule } from "../../lib/supabase";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { ImageUpload } from "../../components/ui/ImageUpload";
import {
  Card,
  Modal,
  EmptyState,
  LoadingSpinner,
  ErrorState,
  Badge,
} from "../../components/ui";
import { formatDate, to12Hour, cn } from "../../lib/utils";

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
  schedule_date: string;
  start_time: string;
  end_time: string;
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
  schedule_date: "",
  start_time: "",
  end_time: "",
  venue: "",
  address: "",
  dress_code: "",
  category: "Ceremony",
  cover_image: null,
  order_index: 0,
};

export default function TimelinePage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventSchedule | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: items, isLoading, isError, error } = useQuery({
    queryKey: ["schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("schedule_date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_schedule").insert({
        ...form,
        event_id: eventId,
        order_index: form.order_index || (items?.length ?? 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("event_schedule")
        .update(form)
        .eq("id", editing!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(item: EventSchedule) {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description ?? "",
      schedule_date: item.schedule_date,
      start_time: item.start_time ?? "",
      end_time: item.end_time ?? "",
      venue: item.venue ?? "",
      address: item.address ?? "",
      dress_code: item.dress_code ?? "",
      category: item.category,
      cover_image: item.cover_image,
      order_index: item.order_index,
    });
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const saveError = editing ? updateMutation.error : createMutation.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20">
        <ErrorState message={error?.message} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Schedule</h2>
          <p className="mt-1 text-sm text-dash-muted">Manage the timeline for {event.name}.</p>
        </div>
        <Button onClick={openCreate}>Add Item</Button>
      </div>

      {items && items.length === 0 ? (
        <EmptyState
          title="No schedule items"
          description="Add ceremony, reception, and other event timings."
          action={<Button onClick={openCreate}>Add Item</Button>}
        />
      ) : (
        <div className="space-y-3">
          {items?.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{item.title}</h3>
                    <Badge variant="info">{item.category}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-dash-muted">
                    <span>{formatDate(item.schedule_date)}</span>
                    {item.start_time && <span>Starts: {to12Hour(item.start_time)}</span>}
                    {item.end_time && <span>Ends: {to12Hour(item.end_time)}</span>}
                    {item.venue && <span>📍 {item.venue}</span>}
                  </div>
                  {item.description && (
                    <p className="mt-2 text-sm text-dash-text">{item.description}</p>
                  )}
                  {item.dress_code && (
                    <p className="mt-1 text-xs text-dash-muted">Dress code: {item.dress_code}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
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
            autoFocus
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Additional details..."
          />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Date"
              value={form.schedule_date}
              onChange={(v) => setForm({ ...form, schedule_date: v })}
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TimePicker
              label="Start Time"
              value={form.start_time}
              onChange={(v) => setForm({ ...form, start_time: v })}
            />
            <TimePicker
              label="End Time"
              value={form.end_time}
              onChange={(v) => setForm({ ...form, end_time: v })}
            />
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
            placeholder="e.g. The Grand Ballroom"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="123 Main Street, City"
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
            placeholder="e.g. Black tie, Casual"
          />
          <ImageUpload
            label="Cover Image"
            value={form.cover_image}
            onChange={(v) => setForm({ ...form, cover_image: v })}
            eventId={eventId}
          />
          {saveError && (
            <p className="text-sm text-red-600">
              {saveError instanceof Error ? saveError.message : "Save failed."}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
