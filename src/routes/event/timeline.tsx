import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { UserEvent, EventSchedule } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { formatDate, formatTime12, cn } from "../../lib/utils";

const CATEGORIES = ["Ceremony", "Reception", "Dinner", "Party", "Other"];

export function TimelinePage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [category, setCategory] = useState("Ceremony");

  const {
    data: schedule,
    isLoading,
    isError,
    refetch,
  } = useQuery({
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
      const maxOrder = schedule ? Math.max(...schedule.map((s) => s.order_index), -1) : -1;
      const { error } = await supabase.from("event_schedule").insert({
        event_id: eventId,
        title,
        description: description || null,
        schedule_date: date || null,
        start_time: startTime || null,
        end_time: endTime || null,
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
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No item selected");
      const { error } = await supabase
        .from("event_schedule")
        .update({
          title,
          description: description || null,
          schedule_date: date || null,
          start_time: startTime || null,
          end_time: endTime || null,
          venue: venue || null,
          address: address || null,
          dress_code: dressCode || null,
          category: category || null,
        })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      closeModal();
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

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDate(event.draft_event_date || event.event_date || "");
    setStartTime("");
    setEndTime("");
    setVenue("");
    setAddress("");
    setDressCode("");
    setCategory("Ceremony");
    setModalOpen(true);
  };

  const openEdit = (item: EventSchedule) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description || "");
    setDate(item.schedule_date || "");
    setStartTime(item.start_time || "");
    setEndTime(item.end_time || "");
    setVenue(item.venue || "");
    setAddress(item.address || "");
    setDressCode(item.dress_code || "");
    setCategory(item.category || "Ceremony");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load schedule" onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Schedule</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Build a timeline of all the events for your special day.
          </p>
        </div>
        <Button onClick={openCreate}>Add Event</Button>
      </div>

      {schedule && schedule.length > 0 ? (
        <div className="space-y-4">
          {schedule.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-dash-text">{item.title}</h3>
                    {item.category && (
                      <Badge variant="primary">{item.category}</Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-dash-muted mb-2">{item.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-dash-muted">
                    {item.schedule_date && (
                      <span>📅 {formatDate(item.schedule_date)}</span>
                    )}
                    {item.start_time && (
                      <span>⏰ {formatTime12(item.start_time)}</span>
                    )}
                    {item.end_time && (
                      <span>– {formatTime12(item.end_time)}</span>
                    )}
                    {item.venue && <span>📍 {item.venue}</span>}
                    {item.dress_code && <span>👔 {item.dress_code}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
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
      ) : (
        <EmptyState
          title="No schedule items yet"
          description="Add events to build a timeline for your special day."
          action={<Button onClick={openCreate}>Add Event</Button>}
        />
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit Event" : "Add Event"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Save" : "Add"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Ceremony"
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker label="Date" value={date} onChange={(v) => setDate(v ?? "")} />
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TimePicker label="Start Time" value={startTime} onChange={(v) => setStartTime(v ?? "")} />
            <TimePicker label="End Time" value={endTime} onChange={(v) => setEndTime(v ?? "")} />
          </div>
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Venue name"
          />
          <Textarea
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address"
            rows={2}
          />
          <Input
            label="Dress Code"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder="e.g., Black tie, Cocktail"
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              {createMutation.error?.message || updateMutation.error?.message || "Save failed"}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
