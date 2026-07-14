import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui";
import { LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function EventsPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<SubEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const { data: subEvents, isLoading, isError, error } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const today = new Date().toISOString().split("T")[0];

  // FIX #2: Split into upcoming (date >= today) and previous (date < today)
  const upcoming = (subEvents ?? []).filter((e) => (e.date ?? "") >= today);
  const previous = (subEvents ?? []).filter((e) => (e.date ?? "") < today).reverse();

  const resetForm = () => {
    setName(""); setDate(""); setTime(""); setVenue(""); setAddress(""); setDescription("");
    setEditEvent(null); setFormError(null);
  };

  const openAdd = () => { resetForm(); setShowForm(true); };
  const openEdit = (e: SubEvent) => {
    setEditEvent(e);
    setName(e.name ?? "");
    setDate(e.date ?? "");
    setTime(e.time ?? e.start_time ?? "");
    setVenue(e.venue ?? "");
    setAddress(e.address ?? "");
    setDescription(e.description ?? "");
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        parent_event_id: eventId,
        name,
        date: date || null,
        time: time || null,
        venue: venue || null,
        address: address || null,
        description: description || null,
        rsvp_enabled: true,
      };
      if (editEvent) {
        const { error } = await supabase.from("sub_events").update(payload).eq("id", editEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sub_events").insert(payload);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowForm(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] }),
  });

  const renderEventCard = (e: SubEvent) => (
    <div key={e.id} className="rounded-lg border border-dash-border bg-dash-surface p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-dash-text">{e.name}</h3>
          {e.date && <p className="text-sm text-dash-muted">{formatDate(e.date)}{e.time ? ` at ${formatTime12(e.time)}` : ""}</p>}
          {e.venue && <p className="text-sm text-dash-muted">{e.venue}</p>}
          {e.address && <p className="text-sm text-dash-muted">{e.address}</p>}
          {e.description && <p className="mt-2 text-sm text-dash-muted">{e.description}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => openEdit(e)} className="text-xs text-dash-primary hover:underline">Edit</button>
          <button onClick={() => deleteMutation.mutate(e.id)} className="text-xs text-dash-danger hover:underline">Delete</button>
        </div>
      </div>
    </div>
  );

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load events" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Events</h2>
        <Button size="sm" onClick={openAdd}>Add Event</Button>
      </div>

      {/* Upcoming Events */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-dash-muted">Upcoming Events</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-dash-muted">No upcoming events.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">{upcoming.map(renderEventCard)}</div>
        )}
      </div>

      {/* FIX #2: Previous Events — now displayed */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-dash-muted">Previous Events</h3>
        {previous.length === 0 ? (
          <p className="text-sm text-dash-muted">No previous events.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">{previous.map(renderEventCard)}</div>
        )}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={editEvent ? "Edit Event" : "Add Event"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Event Name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <Input label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:border-dash-primary focus:outline-none" />
          </div>
          {formError && <p className="text-sm text-dash-danger">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editEvent ? "Update" : "Add"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
