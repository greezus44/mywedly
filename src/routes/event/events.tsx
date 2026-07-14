import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type EventSchedule } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui";
import { LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function EventsPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editEvent, setEditEvent] = useState<SubEvent | null>(null);
  const [editSchedule, setEditSchedule] = useState<EventSchedule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Event form state
  const [name, setName] = useState(""); const [date, setDate] = useState(""); const [time, setTime] = useState("");
  const [venue, setVenue] = useState(""); const [address, setAddress] = useState(""); const [description, setDescription] = useState("");

  // Schedule form state
  const [schedTitle, setSchedTitle] = useState(""); const [schedDate, setSchedDate] = useState("");
  const [schedStart, setSchedStart] = useState(""); const [schedEnd, setSchedEnd] = useState("");
  const [schedVenue, setSchedVenue] = useState(""); const [schedAddress, setSchedAddress] = useState("");
  const [schedDesc, setSchedDesc] = useState("");

  const { data: subEvents, isLoading, isError, error } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", eventId).order("display_order", { ascending: true }); if (error) throw error; return data as SubEvent[]; },
  });

  // FIX #3: Load event schedule
  const { data: schedule } = useQuery({
    queryKey: ["event-schedule", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_schedule").select("*").eq("event_id", eventId).order("order_index", { ascending: true }); if (error) throw error; return data as EventSchedule[]; },
  });

  const today = new Date().toISOString().split("T")[0];
  const upcoming = (subEvents ?? []).filter((e) => (e.date ?? "") >= today);
  const previous = (subEvents ?? []).filter((e) => (e.date ?? "") < today).reverse();

  const resetForm = () => { setName(""); setDate(""); setTime(""); setVenue(""); setAddress(""); setDescription(""); setEditEvent(null); setFormError(null); };
  const openAdd = () => { resetForm(); setShowForm(true); };
  const openEdit = (e: SubEvent) => { setEditEvent(e); setName(e.name ?? ""); setDate(e.date ?? ""); setTime(e.time ?? e.start_time ?? ""); setVenue(e.venue ?? ""); setAddress(e.address ?? ""); setDescription(e.description ?? ""); setFormError(null); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setFormError(null);
    try {
      const payload = { parent_event_id: eventId, name, date: date || null, time: time || null, venue: venue || null, address: address || null, description: description || null, rsvp_enabled: true };
      if (editEvent) { const { error } = await supabase.from("sub_events").update(payload).eq("id", editEvent.id); if (error) throw error; }
      else { const { error } = await supabase.from("sub_events").insert(payload); if (error) throw error; }
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] }); setShowForm(false); resetForm();
    } catch (err) { setFormError(err instanceof Error ? err.message : "Failed to save event"); }
    finally { setSubmitting(false); }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("sub_events").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] }),
  });

  // FIX #3: Schedule management
  const resetSchedForm = () => { setSchedTitle(""); setSchedDate(""); setSchedStart(""); setSchedEnd(""); setSchedVenue(""); setSchedAddress(""); setSchedDesc(""); setEditSchedule(null); setFormError(null); };
  const openAddSchedule = () => { resetSchedForm(); setShowScheduleForm(true); };
  const openEditSchedule = (s: EventSchedule) => { setEditSchedule(s); setSchedTitle(s.title ?? ""); setSchedDate(s.schedule_date ?? ""); setSchedStart(s.start_time ?? ""); setSchedEnd(s.end_time ?? ""); setSchedVenue(s.venue ?? ""); setSchedAddress(s.address ?? ""); setSchedDesc(s.description ?? ""); setFormError(null); setShowScheduleForm(true); };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setFormError(null);
    try {
      const payload = {
        event_id: eventId, title: schedTitle,
        schedule_date: schedDate || null,
        start_time: schedStart || null, end_time: schedEnd || null,
        venue: schedVenue || null, address: schedAddress || null,
        description: schedDesc || null,
        order_index: editSchedule?.order_index ?? (schedule?.length ?? 0),
      };
      if (editSchedule) { const { error } = await supabase.from("event_schedule").update(payload).eq("id", editSchedule.id); if (error) throw error; }
      else { const { error } = await supabase.from("event_schedule").insert(payload); if (error) throw error; }
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] }); setShowScheduleForm(false); resetSchedForm();
    } catch (err) { setFormError(err instanceof Error ? err.message : "Failed to save schedule item"); }
    finally { setSubmitting(false); }
  };

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("event_schedule").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] }),
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
        <div className="flex gap-2"><button onClick={() => openEdit(e)} className="text-xs text-dash-primary hover:underline">Edit</button><button onClick={() => deleteMutation.mutate(e.id)} className="text-xs text-dash-danger hover:underline">Delete</button></div>
      </div>
    </div>
  );

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load events" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-dash-text">Events</h2><Button size="sm" onClick={openAdd}>Add Event</Button></div>

      {/* Event details summary */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-dash-text">Main Event Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-dash-muted">
          {event.event_date && <div><span className="font-medium text-dash-text">Date:</span> {formatDate(event.event_date)}</div>}
          {event.event_time && <div><span className="font-medium text-dash-text">Time:</span> {formatTime12(event.event_time)}</div>}
          {event.venue && <div><span className="font-medium text-dash-text">Venue:</span> {event.venue}</div>}
          {event.address && <div><span className="font-medium text-dash-text">Address:</span> {event.address}</div>}
        </div>
      </div>

      <div><h3 className="mb-3 text-sm font-medium text-dash-muted">Upcoming Events</h3>{upcoming.length === 0 ? <p className="text-sm text-dash-muted">No upcoming events.</p> : <div className="grid gap-3 sm:grid-cols-2">{upcoming.map(renderEventCard)}</div>}</div>
      <div><h3 className="mb-3 text-sm font-medium text-dash-muted">Previous Events</h3>{previous.length === 0 ? <p className="text-sm text-dash-muted">No previous events.</p> : <div className="grid gap-3 sm:grid-cols-2">{previous.map(renderEventCard)}</div>}</div>

      {/* FIX #3: Schedule section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-dash-muted">Schedule / Timeline</h3>
          <Button size="sm" variant="secondary" onClick={openAddSchedule}>Add Schedule Item</Button>
        </div>
        {!schedule || schedule.length === 0 ? (
          <p className="text-sm text-dash-muted">No schedule items yet.</p>
        ) : (
          <div className="space-y-2">
            {schedule.map((item) => (
              <div key={item.id} className="rounded-lg border border-dash-border bg-dash-surface p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-dash-text">{item.title}</p>
                    <p className="text-sm text-dash-muted">
                      {item.schedule_date && formatDate(item.schedule_date)}{item.start_time ? ` ${formatTime12(item.start_time)}` : ""}{item.end_time ? ` - ${formatTime12(item.end_time)}` : ""}
                    </p>
                    {item.venue && <p className="text-sm text-dash-muted">{item.venue}</p>}
                    {item.address && <p className="text-sm text-dash-muted">{item.address}</p>}
                    {item.description && <p className="mt-1 text-sm text-dash-muted">{item.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditSchedule(item)} className="text-xs text-dash-primary hover:underline">Edit</button>
                    <button onClick={() => deleteScheduleMutation.mutate(item.id)} className="text-xs text-dash-danger hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Form Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={editEvent ? "Edit Event" : "Add Event"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Event Name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          <div className="grid grid-cols-2 gap-3"><Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /><Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          <Input label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} /><Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div><label className="mb-1.5 block text-sm font-medium text-dash-text">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:border-dash-primary focus:outline-none" /></div>
          {formError && <p className="text-sm text-dash-danger">{formError}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button><Button type="submit" loading={submitting}>{editEvent ? "Update" : "Add"}</Button></div>
        </form>
      </Modal>

      {/* Schedule Form Modal */}
      <Modal open={showScheduleForm} onClose={() => { setShowScheduleForm(false); resetSchedForm(); }} title={editSchedule ? "Edit Schedule Item" : "Add Schedule Item"}>
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <Input label="Title" value={schedTitle} onChange={(e) => setSchedTitle(e.target.value)} placeholder="e.g. Ceremony" required autoFocus />
          <Input label="Date" type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} />
          <div className="grid grid-cols-2 gap-3"><Input label="Start Time" type="time" value={schedStart} onChange={(e) => setSchedStart(e.target.value)} /><Input label="End Time" type="time" value={schedEnd} onChange={(e) => setSchedEnd(e.target.value)} /></div>
          <Input label="Venue" value={schedVenue} onChange={(e) => setSchedVenue(e.target.value)} /><Input label="Address" value={schedAddress} onChange={(e) => setSchedAddress(e.target.value)} />
          <div><label className="mb-1.5 block text-sm font-medium text-dash-text">Description</label><textarea value={schedDesc} onChange={(e) => setSchedDesc(e.target.value)} rows={3} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:border-dash-primary focus:outline-none" /></div>
          {formError && <p className="text-sm text-dash-danger">{formError}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => { setShowScheduleForm(false); resetSchedForm(); }}>Cancel</Button><Button type="submit" loading={submitting}>{editSchedule ? "Update" : "Add"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
