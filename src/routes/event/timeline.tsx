import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { useOutletContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Modal,
  Input,
  Textarea,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { DatePicker, TimePicker } from "../../components/ui";
import { formatDate, formatTime12, cn } from "../../lib/utils";

interface ScheduleFormData {
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

const EMPTY_FORM: ScheduleFormData = {
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

const CATEGORIES = [
  "Ceremony",
  "Reception",
  "Pre-Event",
  "Post-Event",
  "Other",
];

export default function Timeline() {
  const { eventId } = useOutletContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormData>(EMPTY_FORM);

  const { data: schedule, isLoading, isError } = useQuery({
    queryKey: ["event_schedule", eventId],
    enabled: !!eventId,
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
      const maxOrder = schedule?.reduce((max, s) => Math.max(max, s.order_index), 0) ?? 0;
      const { data, error } = await supabase
        .from("event_schedule")
        .insert({
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
          order_index: maxOrder + 1,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_schedule", eventId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No item selected");
      const { data, error } = await supabase
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
        })
        .eq("id", editingId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_schedule", eventId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
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
      queryClient.invalidateQueries({ queryKey: ["event_schedule", eventId] });
    },
  });

  const handleEdit = (item: EventSchedule) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? "",
      schedule_date: item.schedule_date,
      start_time: item.start_time,
      end_time: item.end_time,
      venue: item.venue ?? "",
      address: item.address ?? "",
      dress_code: item.dress_code ?? "",
      category: item.category ?? "",
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Failed to load schedule" />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Schedule</h2>
        <Button onClick={handleAdd}>Add Schedule Item</Button>
      </div>

      {!schedule || schedule.length === 0 ? (
        <EmptyState
          title="No schedule items"
          description="Add items to your event schedule to keep guests informed."
          icon={<span className="text-4xl">📅</span>}
          action={<Button onClick={handleAdd}>Add Schedule Item</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {schedule.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">
                      {item.title}
                    </h3>
                    {item.category && (
                      <Badge variant="info">{item.category}</Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-dash-muted">
                    {item.schedule_date && (
                      <span>{formatDate(item.schedule_date)}</span>
                    )}
                    {item.start_time && (
                      <span>{formatTime12(item.start_time)}</span>
                    )}
                    {item.end_time && (
                      <span>– {formatTime12(item.end_time)}</span>
                    )}
                    {item.venue && <span>📍 {item.venue}</span>}
                    {item.dress_code && (
                      <span>👔 {item.dress_code}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
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
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Schedule Item" : "Add Schedule Item"}
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Ceremony"
            autoFocus
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Additional details..."
          />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Date"
              value={form.schedule_date}
              onChange={(date) =>
                setForm((f) => ({ ...f, schedule_date: date }))
              }
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-dash-text">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TimePicker
              label="Start Time"
              value={form.start_time}
              onChange={(time) =>
                setForm((f) => ({ ...f, start_time: time }))
              }
            />
            <TimePicker
              label="End Time"
              value={form.end_time}
              onChange={(time) => setForm((f) => ({ ...f, end_time: time }))}
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
            onChange={(e) =>
              setForm((f) => ({ ...f, dress_code: e.target.value }))
            }
            placeholder="e.g. Black tie"
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              {createMutation.error?.message || updateMutation.error?.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={isSaving} disabled={!form.title.trim()}>
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
