import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventSchedule } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { formatDate, formatTime12, cn } from "../../lib/utils";

const CATEGORIES = ["Ceremony", "Reception", "Dinner", "Party", "Other"];

export function TimelinePage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<EventSchedule | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [category, setCategory] = useState("Ceremony");

  const { data: schedule, isLoading, isError } = useQuery({
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
      const maxOrder = schedule ? Math.max(...schedule.map((s) => s.order_index), 0) : 0;
      const { error } = await supabase.from("event_schedule").insert({
        event_id: eventId,
        title,
        description: description || null,
        schedule_date: date,
        start_time: startTime,
        end_time: endTime,
        venue: venue || null,
        address: address || null,
        dress_code: dressCode || null,
        category: category || null,
        order_index: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingItem) return;
      const { error } = await supabase
        .from("event_schedule")
        .update({
          title,
          description: description || null,
          schedule_date: date,
          start_time: startTime,
          end_time: endTime,
          venue: venue || null,
          address: address || null,
          dress_code: dressCode || null,
          category: category || null,
        })
        .eq("id", editingItem.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      resetForm();
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

  function resetForm() {
    setShowForm(false);
    setEditingItem(null);
    setTitle("");
    setDescription("");
    setDate(null);
    setStartTime(null);
    setEndTime(null);
    setVenue("");
    setAddress("");
    setDressCode("");
    setCategory("Ceremony");
  }

  function openEdit(item: EventSchedule) {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setDate(item.schedule_date);
    setStartTime(item.start_time);
    setEndTime(item.end_time);
    setVenue(item.venue ?? "");
    setAddress(item.address ?? "");
    setDressCode(item.dress_code ?? "");
    setCategory(item.category ?? "Ceremony");
    setShowForm(true);
  }

  function handleSave() {
    if (editingItem) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20">
        <ErrorState message="Failed to load schedule" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Schedule</h2>
          <p className="text-sm text-dash-muted mt-1">
            Add and manage the timeline of your event day.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Add Item
        </Button>
      </div>

      {schedule && schedule.length > 0 ? (
        <div className="space-y-3">
          {schedule.map((item) => (
            <Card key={item.id} className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-dash-text">{item.title}</h3>
                  {item.category && <Badge variant="primary">{item.category}</Badge>}
                </div>
                {item.description && (
                  <p className="text-sm text-dash-muted mb-2">{item.description}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dash-muted">
                  {item.schedule_date && <span>{formatDate(item.schedule_date)}</span>}
                  {item.start_time && <span>Starts: {formatTime12(item.start_time)}</span>}
                  {item.end_time && <span>Ends: {formatTime12(item.end_time)}</span>}
                  {item.venue && <span>{item.venue}</span>}
                  {item.dress_code && <span>Dress: {item.dress_code}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="secondary" size="sm" onClick={() => openEdit(item)}>
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
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No schedule items"
            description="Add items to create your event day timeline."
            icon={<span className="text-4xl">📅</span>}
            action={<Button onClick={() => setShowForm(true)}>Add Item</Button>}
          />
        </Card>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={resetForm}
        title={editingItem ? "Edit Schedule Item" : "Add Schedule Item"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ceremony"
            autoFocus
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1.5">
              Date
            </label>
            <DatePicker value={date} onChange={setDate} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1.5">
                Start Time
              </label>
              <TimePicker value={startTime} onChange={setStartTime} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1.5">
                End Time
              </label>
              <TimePicker value={endTime} onChange={setEndTime} />
            </div>
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
            placeholder="Venue address"
          />
          <Input
            label="Dress Code"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder="e.g. Black Tie"
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">Failed to save schedule item</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!title.trim()}
            >
              {editingItem ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
