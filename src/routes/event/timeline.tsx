import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { TimePicker } from "../../components/ui/TimePicker";
import { formatTime12 } from "../../lib/utils";

export function TimelinePage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventSchedule | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [subEventId, setSubEventId] = useState("");

  const { data: schedules, isLoading, isError, refetch } = useQuery({
    queryKey: ["schedules", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedules")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub-events-for-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const sortOrder = editing
        ? editing.sort_order
        : (schedules?.length ?? 0);
      const payload = {
        event_id: eventId,
        title,
        description: description || null,
        start_time: startTime,
        end_time: endTime || null,
        location: location || null,
        sub_event_id: subEventId || null,
        sort_order: sortOrder,
      };
      if (editing) {
        const { error } = await supabase
          .from("event_schedules")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_schedules")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules", eventId] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("event_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules", eventId] });
    },
  });

  function resetForm() {
    setTitle("");
    setDescription("");
    setStartTime("09:00");
    setEndTime("");
    setLocation("");
    setSubEventId("");
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(s: EventSchedule) {
    setEditing(s);
    setTitle(s.title);
    setDescription(s.description ?? "");
    setStartTime(s.start_time);
    setEndTime(s.end_time ?? "");
    setLocation(s.location ?? "");
    setSubEventId(s.sub_event_id ?? "");
    setShowForm(true);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load schedule." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Schedule</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Plan the timeline for your event day.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          Add Item
        </Button>
      </div>

      {showForm && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-dash-text">
            {editing ? "Edit Schedule Item" : "New Schedule Item"}
          </h2>
          <div className="space-y-4">
            <Input
              label="Title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ceremony"
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
            />
            <div className="grid grid-cols-2 gap-4">
              <TimePicker label="Start time" value={startTime} onChange={setStartTime} />
              <TimePicker label="End time (optional)" value={endTime} onChange={setEndTime} />
            </div>
            <Input
              label="Location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Hall"
            />
            {subEvents && subEvents.length > 0 && (
              <Select
                label="Associated Event"
                value={subEventId}
                onChange={(e) => setSubEventId(e.target.value)}
              >
                <option value="">None</option>
                {subEvents.map((se) => (
                  <option key={se.id} value={se.id}>{se.name}</option>
                ))}
              </Select>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => saveMutation.mutate()}
                loading={saveMutation.isPending}
                disabled={!title.trim() || saveMutation.isPending}
              >
                {editing ? "Update" : "Add"}
              </Button>
              <Button variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
            {saveMutation.isError && (
              <p className="text-sm text-dash-danger">
                {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed."}
              </p>
            )}
          </div>
        </Card>
      )}

      {schedules && schedules.length > 0 ? (
        <div className="space-y-3">
          {schedules.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{s.title}</h3>
                    <Badge>{formatTime12(s.start_time)}</Badge>
                    {s.end_time && <Badge>{formatTime12(s.end_time)}</Badge>}
                  </div>
                  {s.description && (
                    <p className="mt-1 text-sm text-dash-muted">{s.description}</p>
                  )}
                  {s.location && (
                    <p className="mt-1 text-sm text-dash-muted">📍 {s.location}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(s)}>Edit</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm("Delete this schedule item?")) {
                        deleteMutation.mutate(s.id);
                      }
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        !showForm && (
          <EmptyState
            title="No schedule items yet"
            description="Add items to create a timeline for your event day."
            action={<Button onClick={() => setShowForm(true)}>Add Item</Button>}
          />
        )
      )}
    </div>
  );
}
