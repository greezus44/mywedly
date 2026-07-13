import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventSchedule } from "../../lib/supabase";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card, Badge, Modal, EmptyState, LoadingSpinner, ErrorState } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { formatDate, formatTime12, cn } from "../../lib/utils";

const CATEGORIES = [
  { value: "main", label: "Main" },
  { value: "reception", label: "Reception" },
  { value: "pre-event", label: "Pre-Event" },
  { value: "post-event", label: "Post-Event" },
  { value: "other", label: "Other" },
];

type ScheduleForm = Omit<EventSchedule, "id" | "event_id" | "created_at" | "order_index" | "sub_event_id">;

const EMPTY_FORM: ScheduleForm = {
  title: "",
  description: "",
  schedule_date: null,
  start_time: null,
  end_time: null,
  venue: "",
  address: "",
  dress_code: "",
  category: "main",
  cover_image: "",
};

export default function Timeline() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EventSchedule | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);

  const { data: items, isLoading, error, refetch } = useQuery({
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

  const saveMutation = useMutation({
    mutationFn: async (payload: ScheduleForm & { id?: string }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { error } = await supabase.from("event_schedule").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_schedule")
          .insert({ ...rest, event_id: event.id, order_index: items?.length ?? 0 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_schedule", event.id] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event_schedule", event.id] }),
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(item: EventSchedule) {
    setEditing(item);
    setForm({
      title: item.title, description: item.description, schedule_date: item.schedule_date,
      start_time: item.start_time, end_time: item.end_time, venue: item.venue,
      address: item.address, dress_code: item.dress_code, category: item.category,
      cover_image: item.cover_image,
    });
    setShowModal(true);
  }

  function handleSave() {
    saveMutation.mutate({ ...form, id: editing?.id });
  }

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner className="h-8 w-8" /></div>;
  if (error) return <ErrorState message="Failed to load schedule." onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Schedule</h2>
        <Button onClick={openNew}>+ Add Item</Button>
      </div>

      {!items || items.length === 0 ? (
        <EmptyState
          title="No schedule items yet"
          description="Add items to your event schedule to show guests what to expect."
          action={<Button onClick={openNew}>+ Add Item</Button>}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-dash-text">{item.title}</h3>
                    <Badge variant="info">{item.category}</Badge>
                  </div>
                  {item.schedule_date && (
                    <p className="text-sm text-dash-muted">
                      {formatDate(item.schedule_date)}
                      {item.start_time && ` • ${formatTime12(item.start_time)}`}
                      {item.end_time && ` – ${formatTime12(item.end_time)}`}
                    </p>
                  )}
                  {item.venue && <p className="text-sm text-dash-muted mt-1">{item.venue}</p>}
                  {item.description && (
                    <p className="text-sm text-dash-muted mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => deleteMutation.mutate(item.id)}
                  >Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Schedule Item" : "Add Schedule Item"} size="lg">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Welcome Reception" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DatePicker label="Date" value={form.schedule_date} onChange={(d) => setForm({ ...form, schedule_date: d })} />
            <TimePicker label="Start Time" value={form.start_time} onChange={(t) => setForm({ ...form, start_time: t })} />
            <TimePicker label="End Time" value={form.end_time} onChange={(t) => setForm({ ...form, end_time: t })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </div>
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label="Dress Code" value={form.dress_code} onChange={(e) => setForm({ ...form, dress_code: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={saveMutation.isPending} disabled={!form.title.trim()} onClick={handleSave}>
              {editing ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
