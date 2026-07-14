import { useState, useEffect, type FormEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { DatePicker, TimePicker } from "../../components/ui";
import {
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Card,
  Badge,
} from "../../components/ui";
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

export default function Timeline() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();

  const { data: schedule, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["event_schedule", eventId],
    queryFn: () => fetchSchedule(eventId),
  });

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventSchedule | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [category, setCategory] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(null);
    setStartTime(null);
    setEndTime(null);
    setVenue("");
    setAddress("");
    setDressCode("");
    setCategory("");
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item: EventSchedule) => {
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setDate(item.schedule_date);
    setStartTime(item.start_time);
    setEndTime(item.end_time);
    setVenue(item.venue ?? "");
    setAddress(item.address ?? "");
    setDressCode(item.dress_code ?? "");
    setCategory(item.category ?? "");
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
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
        order_index: editing?.order_index ?? (schedule?.length ?? 0),
      };

      if (editing) {
        const { error } = await supabase
          .from("event_schedule")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_schedule")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_schedule", eventId] });
      setShowModal(false);
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
      queryClient.invalidateQueries({ queryKey: ["event_schedule", eventId] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load schedule"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Schedule</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Create a timeline of events for your guests.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          + Add Event
        </Button>
      </div>

      {schedule && schedule.length === 0 ? (
        <EmptyState
          title="No schedule items"
          description="Add events to create a timeline for your guests."
          action={<Button onClick={openCreate}>Add Event</Button>}
        />
      ) : (
        <div className="space-y-4">
          {schedule?.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dash-text">{item.title}</h3>
                    {item.category && (
                      <Badge variant="info">{item.category}</Badge>
                    )}
                  </div>
                  {item.schedule_date && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {formatDate(item.schedule_date)}
                      {item.start_time && ` at ${formatTime12(item.start_time)}`}
                      {item.end_time && ` – ${formatTime12(item.end_time)}`}
                    </p>
                  )}
                  {item.venue && (
                    <p className="mt-1 text-sm text-dash-text">{item.venue}</p>
                  )}
                  {item.address && (
                    <p className="text-sm text-dash-muted">{item.address}</p>
                  )}
                  {item.description && (
                    <p className="mt-2 text-sm text-dash-muted">{item.description}</p>
                  )}
                  {item.dress_code && (
                    <p className="mt-1 text-xs text-dash-muted">
                      Dress code: {item.dress_code}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(item)}
                  >
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
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Event" : "Add Event"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ceremony"
            required
            autoFocus
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              label="Date"
              value={date}
              onChange={setDate}
            />
            <Input
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Ceremony"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TimePicker
              label="Start Time"
              value={startTime}
              onChange={setStartTime}
            />
            <TimePicker
              label="End Time"
              value={endTime}
              onChange={setEndTime}
            />
          </div>
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. St. Mary's Church"
          />
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address"
          />
          <Input
            label="Dress Code"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder="e.g. Black tie"
          />

          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {saveMutation.isPending ? <LoadingSpinner size="sm" /> : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
