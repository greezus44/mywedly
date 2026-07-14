import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  Modal,
  Input,
  Textarea,
  Select,
  DatePicker,
  TimePicker,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Card,
  Badge,
} from "../../components/ui";
import { formatDate, formatTime12, cn } from "../../lib/utils";

const CATEGORIES = [
  "Ceremony",
  "Reception",
  "Dinner",
  "Party",
  "Photo",
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
}

const EMPTY_FORM: FormState = {
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
};

export default function TimelinePage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = schedule?.reduce((max, s) => Math.max(max, s.order_index), -1) ?? -1;
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
        order_index: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
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
        })
        .eq("id", editingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
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

  const openCreate = () => {
    setForm(EMPTY_FORM);
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
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const mutationError = (createMutation.error ?? updateMutation.error ?? deleteMutation.error) as Error | null;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error?.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Schedule</h1>
          <p className="text-sm text-dash-muted">Manage the timeline for your event.</p>
        </div>
        <Button onClick={openCreate}>+ Add Schedule Item</Button>
      </div>

      {mutationError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">
          {mutationError.message}
        </p>
      )}

      {!schedule || schedule.length === 0 ? (
        <EmptyState
          title="No schedule items"
          description="Add items to build your event timeline."
          icon={<span className="text-4xl">📅</span>}
          action={<Button onClick={openCreate}>+ Add Schedule Item</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {schedule.map((item) => (
            <Card key={item.id} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-dash-text">{item.title}</h3>
                  {item.category && <Badge variant="info">{item.category}</Badge>}
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-sm text-dash-muted">
                  {item.schedule_date && <span>{formatDate(item.schedule_date)}</span>}
                  {item.start_time && <span>{formatTime12(item.start_time)}</span>}
                  {item.end_time && <span>– {formatTime12(item.end_time)}</span>}
                  {item.venue && <span>• {item.venue}</span>}
                </div>
                {item.description && (
                  <p className="mt-2 text-sm text-dash-muted">{item.description}</p>
                )}
                {item.dress_code && (
                  <p className="mt-1 text-xs text-dash-muted">Dress code: {item.dress_code}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
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
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Schedule Item" : "Add Schedule Item"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit} disabled={!form.title.trim()}>
              {editingId ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Ceremony"
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Additional details..."
            />
          </div>
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
              <option key={c}>{c}</option>
            ))}
          </Select>
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
            placeholder="e.g. Black tie"
          />
        </div>
      </Modal>
    </div>
  );
}
