import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, FormField, Modal, Card, Badge, EmptyState, LoadingSpinner, ErrorState } from "../../components/ui";
import { DateTimePicker } from "../../components/ui/DateTimePicker";
import { formatDate, formatTime12 } from "../../lib/utils";

const CATEGORIES = [
  { value: "ceremony", label: "Ceremony" },
  { value: "reception", label: "Reception" },
  { value: "dinner", label: "Dinner" },
  { value: "party", label: "Party" },
  { value: "other", label: "Other" },
];

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

const emptyForm: ScheduleFormData = {
  title: "",
  description: "",
  schedule_date: null,
  start_time: null,
  end_time: null,
  venue: "",
  address: "",
  dress_code: "",
  category: "other",
};

export function TimelinePage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormData>(emptyForm);

  const { data: schedule, isLoading, isError, refetch } = useQuery({
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
    mutationFn: async (formData: ScheduleFormData) => {
      const nextOrder = (schedule?.length ?? 0);
      const { error } = await supabase
        .from("event_schedule")
        .insert({
          event_id: eventId,
          title: formData.title,
          description: formData.description || null,
          schedule_date: formData.schedule_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          venue: formData.venue || null,
          address: formData.address || null,
          dress_code: formData.dress_code || null,
          category: formData.category || null,
          order_index: nextOrder,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setShowForm(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: ScheduleFormData }) => {
      const { error } = await supabase
        .from("event_schedule")
        .update({
          title: formData.title,
          description: formData.description || null,
          schedule_date: formData.schedule_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          venue: formData.venue || null,
          address: formData.address || null,
          dress_code: formData.dress_code || null,
          category: formData.category || null,
        })
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

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, formData: form });
    } else {
      createMutation.mutate(form);
    }
  };

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
      category: item.category ?? "other",
    });
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Schedule</h2>
        <Button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
        >
          Add Schedule Item
        </Button>
      </div>

      {schedule && schedule.length === 0 ? (
        <EmptyState
          title="No schedule items"
          description="Add items to your event schedule."
          action={
            <Button
              onClick={() => {
                setForm(emptyForm);
                setEditingId(null);
                setShowForm(true);
              }}
            >
              Add Schedule Item
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {schedule?.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-dash-text">
                      {item.title}
                    </h3>
                    {item.category && (
                      <Badge color="primary">{item.category}</Badge>
                    )}
                  </div>
                  {item.schedule_date && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {formatDate(item.schedule_date)}
                      {item.start_time ? ` • ${formatTime12(item.start_time)}` : ""}
                      {item.end_time ? ` – ${formatTime12(item.end_time)}` : ""}
                    </p>
                  )}
                  {item.venue && (
                    <p className="mt-1 text-sm text-dash-muted">{item.venue}</p>
                  )}
                  {item.description && (
                    <p className="mt-2 text-sm text-dash-text">{item.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteMutation.mutate(item.id)}
                    loading={deleteMutation.isPending}
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
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit Schedule Item" : "Add Schedule Item"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Ceremony"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
          />
          <DateTimePicker
            label="Date & Time"
            value={form.schedule_date}
            onChange={(v) => setForm({ ...form, schedule_date: v })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={form.start_time ?? ""}
              onChange={(e) => setForm({ ...form, start_time: e.target.value || null })}
            />
            <Input
              label="End Time"
              type="time"
              value={form.end_time ?? ""}
              onChange={(e) => setForm({ ...form, end_time: e.target.value || null })}
            />
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Dress Code"
              value={form.dress_code}
              onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-red-600">Failed to save</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.title.trim()}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
