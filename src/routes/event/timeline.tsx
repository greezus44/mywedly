import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventSchedule } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { DatePicker, TimePicker } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { formatDate, formatTime12, cn } from "../../lib/utils";

const CATEGORIES = ["Ceremony", "Reception", "Dinner", "Party", "Other"];

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
  cover_image: string | null;
  order_index: number;
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
  cover_image: null,
  order_index: 0,
};

export default function Timeline() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventSchedule | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);

  const { data: items, isLoading, isError, refetch } = useQuery({
    queryKey: ["schedule", event.id],
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

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_schedule").insert({
        event_id: event.id,
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
        order_index: form.order_index,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", event.id] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
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
          order_index: form.order_index,
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", event.id] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", event.id] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, order_index: items?.length ?? 0 });
    setShowModal(true);
  };

  const openEdit = (item: EventSchedule) => {
    setEditing(item);
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
      cover_image: item.cover_image,
      order_index: item.order_index,
    });
    setShowModal(true);
  };

  const update = (patch: Partial<ScheduleForm>) => setForm({ ...form, ...patch });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Schedule</h2>
          <p className="mt-1 text-sm text-dash-muted">Manage the timeline for your event.</p>
        </div>
        <Button onClick={openCreate}>+ Add Item</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !items || items.length === 0 ? (
        <EmptyState
          title="No schedule items"
          description="Add items to build your event timeline."
          action={<Button onClick={openCreate}>+ Add Item</Button>}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dash-text">{item.title}</h3>
                    {item.category && <Badge variant="info">{item.category}</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-dash-muted">
                    {item.schedule_date && <span>📅 {formatDate(item.schedule_date)}</span>}
                    {item.start_time && <span>🕐 {formatTime12(item.start_time)}</span>}
                    {item.end_time && <span>→ {formatTime12(item.end_time)}</span>}
                    {item.venue && <span>📍 {item.venue}</span>}
                  </div>
                  {item.description && (
                    <p className="mt-2 text-sm text-dash-muted">{item.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="ghost"
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
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Schedule Item" : "Add Schedule Item"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={() => (editing ? updateMutation.mutate() : createMutation.mutate())}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.title.trim()}
            >
              {editing ? "Save" : "Add"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="e.g. Ceremony"
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Optional description"
          />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Date"
              value={form.schedule_date}
              onChange={(v) => update({ schedule_date: v })}
            />
            <Select label="Category" value={form.category} onChange={(e) => update({ category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TimePicker
              label="Start Time"
              value={form.start_time}
              onChange={(v) => update({ start_time: v })}
            />
            <TimePicker
              label="End Time"
              value={form.end_time}
              onChange={(v) => update({ end_time: v })}
            />
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => update({ venue: e.target.value })}
            placeholder="e.g. Main Hall"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="e.g. 123 Main Street"
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => update({ dress_code: e.target.value })}
            placeholder="e.g. Black Tie"
          />
          <ImageUpload
            label="Cover Image"
            value={form.cover_image}
            onChange={(url: string | null) => update({ cover_image: url })}
            eventId={event.id}
            aspect="16/9"
          />
        </div>
      </Modal>
    </div>
  );
}
