import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { DateTimePicker } from "../../components/ui/DateTimePicker";
import { formatDate, formatTime12, cn } from "../../lib/utils";

async function fetchSchedule(eventId: string): Promise<EventSchedule[]> {
  const { data, error } = await supabase
    .from("event_schedule")
    .select("*")
    .eq("event_id", eventId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventSchedule[];
}

const CATEGORIES = [
  { value: "ceremony", label: "Ceremony", icon: "💒" },
  { value: "reception", label: "Reception", icon: "🥂" },
  { value: "dinner", label: "Dinner", icon: "🍽" },
  { value: "party", label: "Party", icon: "🎉" },
  { value: "other", label: "Other", icon: "📌" },
];

export function TimelinePage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();

  const { data: items, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["event-schedule", eventId],
    queryFn: () => fetchSchedule(eventId),
  });

  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<EventSchedule | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleDate, setScheduleDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [category, setCategory] = useState("other");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setScheduleDate(null);
    setStartTime(null);
    setEndTime(null);
    setVenue("");
    setAddress("");
    setDressCode("");
    setCategory("other");
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowEdit(true);
  };

  const openEdit = (item: EventSchedule) => {
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setScheduleDate(item.schedule_date);
    setStartTime(item.start_time);
    setEndTime(item.end_time);
    setVenue(item.venue ?? "");
    setAddress(item.address ?? "");
    setDressCode(item.dress_code ?? "");
    setCategory(item.category ?? "other");
    setShowEdit(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase
          .from("event_schedule")
          .update({
            title,
            description: description || null,
            schedule_date: scheduleDate,
            start_time: startTime,
            end_time: endTime,
            venue: venue || null,
            address: address || null,
            dress_code: dressCode || null,
            category: category,
          })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const maxOrder = items?.reduce((max, i) => Math.max(max, i.order_index), 0) ?? 0;
        const { error } = await supabase
          .from("event_schedule")
          .insert({
            event_id: eventId,
            title,
            description: description || null,
            schedule_date: scheduleDate,
            start_time: startTime,
            end_time: endTime,
            venue: venue || null,
            address: address || null,
            dress_code: dressCode || null,
            category: category,
            order_index: maxOrder + 1,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setShowEdit(false);
      resetForm();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load schedule"}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Schedule</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Build a timeline of your event day
          </p>
        </div>
        <Button onClick={openCreate}>Add Schedule Item</Button>
      </div>

      {!items || items.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">📅</span>}
          title="No schedule items yet"
          description="Add items to create a timeline for your event day."
          action={<Button onClick={openCreate}>Add Schedule Item</Button>}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const cat = CATEGORIES.find((c) => c.value === item.category);
            return (
              <Card key={item.id} className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat?.icon ?? "📌"}</span>
                    <h3 className="text-base font-semibold text-dash-text">{item.title}</h3>
                    {cat && <Badge color="default">{cat.label}</Badge>}
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-dash-muted">{item.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-dash-muted">
                    {item.schedule_date && (
                      <span>📅 {formatDate(item.schedule_date)}</span>
                    )}
                    {item.start_time && (
                      <span>🕒 {formatTime12(item.start_time)}</span>
                    )}
                    {item.end_time && (
                      <span>→ {formatTime12(item.end_time)}</span>
                    )}
                    {item.venue && <span>📍 {item.venue}</span>}
                    {item.dress_code && <span>👔 {item.dress_code}</span>}
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
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title={editing ? "Edit Schedule Item" : "Add Schedule Item"}
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ceremony"
            required
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details…"
            rows={2}
          />
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.label}
              </option>
            ))}
          </Select>
          <DateTimePicker
            label="Date & Start Time"
            value={{ date: scheduleDate, time: startTime }}
            onChange={({ date, time }) => {
              setScheduleDate(date);
              setStartTime(time);
            }}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">End Time</label>
            <input
              type="time"
              value={endTime ?? ""}
              onChange={(e) => setEndTime(e.target.value || null)}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
            />
          </div>
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Main Hall"
          />
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main St"
          />
          <Input
            label="Dress Code"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder="e.g. Black Tie"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEdit(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!title.trim()}
            >
              {editing ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
