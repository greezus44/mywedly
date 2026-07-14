import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import {
  Input,
  Textarea,
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { DatePicker, TimePicker } from "../../components/ui";
import { formatDate, formatTime12, cn } from "../../lib/utils";
import type { EventOutletContext } from "./event-layout";

const CATEGORIES = [
  "Ceremony",
  "Reception",
  "Dinner",
  "Party",
  "Other",
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
  category: "Ceremony",
};

export default function Timeline() {
  const { eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);

  const { data: schedule, isLoading, error, refetch } = useQuery({
    queryKey: ["event-schedule", eventId],
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
      const orderIndex = (schedule?.length ?? 0);
      const { error } = await supabase
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
          order_index: orderIndex,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setModalOpen(false);
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
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
        })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
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
      category: item.category ?? "Other",
    });
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState
          title="Failed to load schedule"
          message={error.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-dash-text">Schedule</h2>
            <p className="mt-1 text-sm text-dash-muted">
              Plan the timeline for your event
            </p>
          </div>
          <Button onClick={handleAdd}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Item
          </Button>
        </div>

        {schedule && schedule.length > 0 ? (
          <div className="space-y-3">
            {schedule.map((item, idx) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dash-primary/10 text-dash-primary">
                        <span className="text-xs font-bold">{idx + 1}</span>
                      </div>
                      {idx < schedule.length - 1 && (
                        <div className="mt-1 w-px flex-1 bg-dash-border" />
                      )}
                    </div>
                    {/* Content */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-dash-text">
                          {item.title}
                        </h3>
                        {item.category && (
                          <Badge variant="primary">{item.category}</Badge>
                        )}
                      </div>
                      {item.schedule_date && (
                        <p className="mt-1 text-sm text-dash-muted">
                          {formatDate(item.schedule_date)}
                          {item.start_time && ` · ${formatTime12(item.start_time)}`}
                          {item.end_time && ` – ${formatTime12(item.end_time)}`}
                        </p>
                      )}
                      {item.venue && (
                        <p className="mt-1 text-sm text-dash-muted">
                          📍 {item.venue}
                        </p>
                      )}
                      {item.description && (
                        <p className="mt-2 text-sm text-dash-text">
                          {item.description}
                        </p>
                      )}
                      {item.dress_code && (
                        <p className="mt-1 text-xs text-dash-muted">
                          Dress code: {item.dress_code}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(item.id)}
                      loading={deleteMutation.isPending}
                    >
                      <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.107 48.107 0 013.478-.397m7.5 0v-.916c0-1.616-1.314-2.9-2.94-2.9H10.5c-1.626 0-2.94 1.284-2.94 2.9v.916m7.5 0a48.108 48.108 0 00-3.478-.397" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No schedule items yet"
            description="Add items to create a timeline for your event."
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 2.25H3v-6.75a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 11.25v6.75z" />
              </svg>
            }
            action={<Button onClick={handleAdd}>Add First Item</Button>}
          />
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Schedule Item" : "Add Schedule Item"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.title.trim()}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </>
        }
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
            placeholder="Optional description"
            rows={2}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              label="Date"
              value={form.schedule_date}
              onChange={(v) => setForm({ ...form, schedule_date: v })}
            />
            <div className="grid grid-cols-2 gap-2">
              <TimePicker
                label="Start"
                value={form.start_time}
                onChange={(v) => setForm({ ...form, start_time: v })}
              />
              <TimePicker
                label="End"
                value={form.end_time}
                onChange={(v) => setForm({ ...form, end_time: v })}
              />
            </div>
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
            placeholder="e.g. 123 Main St, City"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Dress Code"
              value={form.dress_code}
              onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
              placeholder="e.g. Black tie"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
