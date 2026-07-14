import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge, FormField } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { formatDate, formatTime12, cn } from "../../lib/utils";

const CATEGORIES = ["Ceremony", "Reception", "Dinner", "Party", "Other"];

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
  category: "Ceremony",
};

export const TimelinePage: React.FC = () => {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormData>(EMPTY_FORM);

  const { data: schedule, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventSchedule[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const orderIndex = editingId
        ? (schedule?.find((s) => s.id === editingId)?.order_index ?? schedule?.length ?? 0)
        : (schedule?.length ?? 0);
      const payload = {
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
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setModalOpen(false);
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
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
    },
  });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(true);
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
      category: item.category ?? "Ceremony",
    });
    setEditingId(item.id);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    saveMutation.mutate();
  };

  if (isLoading) {
    return <LoadingSpinner size="md" label="Loading schedule..." />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Schedule</h2>
          <p className="text-sm text-dash-muted">Create and manage your event schedule.</p>
        </div>
        <Button onClick={openCreate}>Add Schedule Item</Button>
      </div>

      {(!schedule || schedule.length === 0) && (
        <EmptyState
          title="No schedule items"
          description="Add schedule items to show your guests what to expect."
          action={<Button onClick={openCreate}>Add Schedule Item</Button>}
        />
      )}

      {schedule && schedule.length > 0 && (
        <div className="space-y-3">
          {schedule.map((item) => (
            <Card key={item.id} className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-dash-text">{item.title}</h3>
                  {item.category && <Badge variant="primary">{item.category}</Badge>}
                </div>
                {item.description && (
                  <p className="mt-1 text-sm text-dash-muted">{item.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-dash-muted">
                  {item.schedule_date && <span>{formatDate(item.schedule_date)}</span>}
                  {item.start_time && <span>{formatTime12(item.start_time)}</span>}
                  {item.end_time && <span>– {formatTime12(item.end_time)}</span>}
                  {item.venue && <span>{item.venue}</span>}
                  {item.dress_code && <span>Dress: {item.dress_code}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Schedule Item" : "Add Schedule Item"}
        size="lg"
      >
        <div className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ceremony"
              autoFocus
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Join us for the ceremony..."
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Date">
              <DatePicker
                value={form.schedule_date}
                onChange={(v) => setForm((prev) => ({ ...prev, schedule_date: v }))}
              />
            </FormField>
            <FormField label="Start time">
              <TimePicker
                value={form.start_time}
                onChange={(v) => setForm((prev) => ({ ...prev, start_time: v }))}
              />
            </FormField>
            <FormField label="End time">
              <TimePicker
                value={form.end_time}
                onChange={(v) => setForm((prev) => ({ ...prev, end_time: v }))}
              />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Venue">
              <Input
                value={form.venue}
                onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))}
                placeholder="Grand Ballroom"
              />
            </FormField>
            <FormField label="Category">
              <Select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Address">
              <Input
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main St"
              />
            </FormField>
            <FormField label="Dress code">
              <Input
                value={form.dress_code}
                onChange={(e) => setForm((prev) => ({ ...prev, dress_code: e.target.value }))}
                placeholder="Black tie optional"
              />
            </FormField>
          </div>
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saveMutation.isPending} disabled={saveMutation.isPending || !form.title.trim()}>
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
