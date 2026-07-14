import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { formatDate, formatTime12 } from "../../lib/utils";

export function EventsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SubEvent | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");

  const { data: subEvents, isLoading, isError, refetch } = useQuery({
    queryKey: ["sub-events", eventId],
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
        : (subEvents?.length ?? 0);
      const payload = {
        event_id: eventId,
        name,
        description: description || null,
        start_date: startDate || null,
        start_time: startTime || null,
        end_date: endDate || null,
        end_time: endTime || null,
        venue: venue || null,
        address: address || null,
        sort_order: sortOrder,
      };
      if (editing) {
        const { error } = await supabase
          .from("sub_events")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_events")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sub_events")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
    },
  });

  function resetForm() {
    setName("");
    setDescription("");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setVenue("");
    setAddress("");
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(se: SubEvent) {
    setEditing(se);
    setName(se.name);
    setDescription(se.description ?? "");
    setStartDate(se.start_date ?? "");
    setStartTime(se.start_time ?? "");
    setEndDate(se.end_date ?? "");
    setEndTime(se.end_time ?? "");
    setVenue(se.venue ?? "");
    setAddress(se.address ?? "");
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
    return <ErrorState message="Failed to load events." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Events</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Manage the individual events within your celebration (e.g. ceremony, reception).
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          Add Event
        </Button>
      </div>

      {showForm && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-dash-text">
            {editing ? "Edit Event" : "New Event"}
          </h2>
          <div className="space-y-4">
            <Input
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ceremony"
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
            />
            <div className="grid grid-cols-2 gap-4">
              <DatePicker label="Start date" value={startDate} onChange={setStartDate} />
              <TimePicker label="Start time" value={startTime} onChange={setStartTime} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DatePicker label="End date (optional)" value={endDate} onChange={setEndDate} />
              <TimePicker label="End time (optional)" value={endTime} onChange={setEndTime} />
            </div>
            <Input
              label="Venue"
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. St. Mary's Church"
            />
            <Input
              label="Address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street, City"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => saveMutation.mutate()}
                loading={saveMutation.isPending}
                disabled={!name.trim() || saveMutation.isPending}
              >
                {editing ? "Update" : "Create"}
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

      {subEvents && subEvents.length > 0 ? (
        <div className="space-y-3">
          {subEvents.map((se, idx) => (
            <Card key={se.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">Event {idx + 1}</Badge>
                    <h3 className="text-base font-semibold text-dash-text">{se.name}</h3>
                  </div>
                  {se.description && (
                    <p className="mt-1 text-sm text-dash-muted">{se.description}</p>
                  )}
                  {se.start_date && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {formatDate(se.start_date)}
                      {se.start_time && ` at ${formatTime12(se.start_time)}`}
                    </p>
                  )}
                  {se.venue && (
                    <p className="mt-1 text-sm text-dash-muted">📍 {se.venue}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(se)}>Edit</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm("Delete this event?")) {
                        deleteMutation.mutate(se.id);
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
            title="No events yet"
            description="Add events like a ceremony, reception, or rehearsal dinner."
            action={<Button onClick={() => setShowForm(true)}>Add Event</Button>}
          />
        )
      )}
    </div>
  );
}
