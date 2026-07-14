import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { DatePicker, TimePicker } from "../../components/ui";
import { formatDate, formatTime12, cn } from "../../lib/utils";
import type { EventOutletContext } from "./event-layout";

const CATEGORIES = [
  "Ceremony",
  "Reception",
  "Preparation",
  "Transportation",
  "Meal",
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

export default function Timeline(): React.ReactElement {
  const { eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);

  const { data: schedule, isLoading, error } = useQuery({
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
      const maxOrder = schedule?.length ?? 0;
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
        order_index: maxOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No item selected");
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
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
    },
  });

  function handleEdit(item: EventSchedule): void {
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
      category: item.category ?? "Ceremony",
    });
    setShowModal(true);
  }

  function handleAdd(): void {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Schedule</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Plan the timeline for your event
          </p>
        </div>
        <Button onClick={handleAdd}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </Button>
      </div>

      {schedule && schedule.length > 0 ? (
        <div className="space-y-3">
          {schedule.map((item) => (
            <Card key={item.id} className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.category && (
                    <Badge variant="primary">{item.category}</Badge>
                  )}
                  <h3 className="text-sm font-semibold text-dash-text">{item.title}</h3>
                </div>
                {item.schedule_date && (
                  <p className="text-sm text-dash-muted">{formatDate(item.schedule_date)}</p>
                )}
                {(item.start_time || item.end_time) && (
                  <p className="text-sm text-dash-muted">
                    {item.start_time ? formatTime12(item.start_time) : ""}
                    {item.start_time && item.end_time ? " - " : ""}
                    {item.end_time ? formatTime12(item.end_time) : ""}
                  </p>
                )}
                {item.venue && (
                  <p className="text-sm text-dash-muted mt-1">{item.venue}</p>
                )}
                {item.description && (
                  <p className="text-sm text-dash-muted mt-1">{item.description}</p>
                )}
                {item.dress_code && (
                  <p className="text-xs text-dash-muted mt-1">Dress: {item.dress_code}</p>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
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
      ) : (
        <Card>
          <EmptyState
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="No schedule items"
            description="Add items to build your event timeline."
            action={<Button onClick={handleAdd}>Add Item</Button>}
          />
        </Card>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Schedule Item" : "Add Schedule Item"}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingId) {
              updateMutation.mutate();
            } else {
              createMutation.mutate();
            }
          }}
          className="space-y-4"
        >
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
            rows={2}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TimePicker
              label="Start time"
              value={form.start_time}
              onChange={(v) => setForm({ ...form, start_time: v })}
            />
            <TimePicker
              label="End time"
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
            placeholder="e.g. 123 Main St, City, State"
          />
          <Input
            label="Dress code"
            value={form.dress_code}
            onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
            placeholder="e.g. Black tie, Cocktail, Casual"
          />
          {saveError && (
            <div className="rounded-md border border-dash-danger/20 bg-dash-danger/5 px-4 py-3">
              <p className="text-sm text-dash-danger">
                {saveError instanceof Error ? saveError.message : "Failed to save"}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} disabled={isSaving}>
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
