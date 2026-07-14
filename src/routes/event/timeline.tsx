import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { formatDateShort, to12Hour, cn } from "../../lib/utils";

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
  order_index: number;
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
  order_index: 0,
};

const CATEGORIES = ["ceremony", "reception", "dinner", "party", "other"];

export function TimelinePage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormData>(EMPTY_FORM);

  const {
    data: schedule,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["event-schedule", eventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("order_index", { ascending: true });
      if (queryError) throw queryError;
      return data as EventSchedule[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: ScheduleFormData) => {
      const { error: createError } = await supabase
        .from("event_schedule")
        .insert({ ...input, event_id: eventId });
      if (createError) throw createError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: ScheduleFormData) => {
      const { error: updateError } = await supabase
        .from("event_schedule")
        .update(input)
        .eq("id", editingId!);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase
        .from("event_schedule")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
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
      order_index: item.order_index,
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, order_index: schedule?.length ?? 0 });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Failed to load"} onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dash-text">Schedule</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Manage the schedule of activities for your event.
          </p>
        </div>
        <Button onClick={handleAdd}>+ Add Item</Button>
      </div>

      {!schedule || schedule.length === 0 ? (
        <EmptyState
          title="No schedule items"
          description="Add schedule items to show your guests what to expect."
          icon={<span className="text-4xl">📅</span>}
          action={<Button onClick={handleAdd}>Add Item</Button>}
        />
      ) : (
        <div className="space-y-3">
          {schedule.map((item) => (
            <Card key={item.id} hover>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{item.title}</h3>
                    {item.category && (
                      <Badge variant="primary" className="capitalize">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  {item.schedule_date && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {formatDateShort(item.schedule_date)}
                      {item.start_time && ` at ${to12Hour(item.start_time)}`}
                      {item.end_time && ` – ${to12Hour(item.end_time)}`}
                    </p>
                  )}
                  {item.venue && (
                    <p className="mt-1 text-sm text-dash-muted">📍 {item.venue}</p>
                  )}
                  {item.description && (
                    <p className="mt-2 text-sm text-dash-text">{item.description}</p>
                  )}
                  {item.dress_code && (
                    <p className="mt-1 text-sm text-dash-muted">
                      Dress code: {item.dress_code}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
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

      {/* Form modal */}
      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
          setForm(EMPTY_FORM);
        }}
        title={editingId ? "Edit Schedule Item" : "Add Schedule Item"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Ceremony"
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Brief description..."
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Date</label>
            <DatePicker
              value={form.schedule_date}
              onChange={(v) => setForm((p) => ({ ...p, schedule_date: v }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">Start Time</label>
              <TimePicker
                value={form.start_time}
                onChange={(v) => setForm((p) => ({ ...p, start_time: v }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">End Time</label>
              <TimePicker
                value={form.end_time}
                onChange={(v) => setForm((p) => ({ ...p, end_time: v }))}
              />
            </div>
          </div>
          <Input
            label="Venue"
            type="text"
            value={form.venue}
            onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
            placeholder="Grand Ballroom"
          />
          <Input
            label="Address"
            type="text"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="123 Main St"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Dress Code"
              type="text"
              value={form.dress_code}
              onChange={(e) => setForm((p) => ({ ...p, dress_code: e.target.value }))}
              placeholder="Black Tie"
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            >
              <option value="">Select...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Order Index"
            type="number"
            value={form.order_index}
            onChange={(e) => setForm((p) => ({ ...p, order_index: Number(e.target.value) }))}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
