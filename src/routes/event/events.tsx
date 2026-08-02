import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type EventSchedule } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui";
import { LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

interface ProgrammeItem {
  id?: string;
  start_time: string;
  end_time: string;
  title: string;
  description: string;
}

export function EventsPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<SubEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Event form state
  const [name, setName] = useState(""); const [date, setDate] = useState(""); const [time, setTime] = useState("");
  const [venue, setVenue] = useState(""); const [address, setAddress] = useState(""); const [description, setDescription] = useState("");

  // Programme items within the event form
  const [programmeItems, setProgrammeItems] = useState<ProgrammeItem[]>([]);

  const { data: subEvents, isLoading, isError, error } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", eventId).order("display_order", { ascending: true }); if (error) throw error; return data as SubEvent[]; },
  });

  // Load all schedule items for this event
  const { data: allSchedule } = useQuery({
    queryKey: ["event-schedule", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_schedule").select("*").eq("event_id", eventId).order("order_index", { ascending: true }); if (error) throw error; return data as EventSchedule[]; },
  });

  const today = new Date().toISOString().split("T")[0];
  const upcoming = (subEvents ?? []).filter((e) => (e.date ?? "") >= today);
  const previous = (subEvents ?? []).filter((e) => (e.date ?? "") < today).reverse();

  const resetForm = () => { setName(""); setDate(""); setTime(""); setVenue(""); setAddress(""); setDescription(""); setEditEvent(null); setProgrammeItems([]); setFormError(null); };
  const openAdd = () => { resetForm(); setShowForm(true); };

  const openEdit = async (e: SubEvent) => {
    setEditEvent(e); setName(e.name ?? ""); setDate(e.date ?? ""); setTime(e.time ?? e.start_time ?? ""); setVenue(e.venue ?? ""); setAddress(e.address ?? ""); setDescription(e.description ?? ""); setFormError(null);
    // Load existing programme items for this sub-event
    const items = (allSchedule ?? []).filter((s) => s.sub_event_id === e.id).map((s) => ({
      id: s.id, start_time: s.start_time ?? "", end_time: s.end_time ?? "", title: s.title, description: s.description ?? "",
    }));
    setProgrammeItems(items);
    setShowForm(true);
  };

  const addProgrammeItem = () => {
    setProgrammeItems((p) => [...p, { start_time: "", end_time: "", title: "", description: "" }]);
  };
  const updateProgrammeItem = (index: number, patch: Partial<ProgrammeItem>) => {
    setProgrammeItems((p) => p.map((item, i) => i === index ? { ...item, ...patch } : item));
  };
  const removeProgrammeItem = (index: number) => {
    setProgrammeItems((p) => p.filter((_, i) => i !== index));
  };
  const moveProgrammeItem = (index: number, dir: -1 | 1) => {
    setProgrammeItems((p) => {
      const newIndex = index + dir;
      if (newIndex < 0 || newIndex >= p.length) return p;
      const copy = [...p];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setFormError(null);
    try {
      const payload = { parent_event_id: eventId, name, date: date || null, time: time || null, venue: venue || null, address: address || null, description: description || null, rsvp_enabled: true };
      let subEventId: string;
      if (editEvent) {
        const { error } = await supabase.from("sub_events").update(payload).eq("id", editEvent.id);
        if (error) throw error;
        subEventId = editEvent.id;
      } else {
        const { data: newSub, error } = await supabase.from("sub_events").insert(payload).select("id").single();
        if (error) throw error;
        subEventId = newSub.id;
      }

      // Save programme items for this sub-event
      // Delete removed items, upsert remaining
      const existingItems = (allSchedule ?? []).filter((s) => s.sub_event_id === subEventId);
      const keptIds = new Set(programmeItems.filter((p) => p.id).map((p) => p.id));
      const toDelete = existingItems.filter((s) => !keptIds.has(s.id));
      if (toDelete.length > 0) {
        await supabase.from("event_schedule").delete().in("id", toDelete.map((s) => s.id));
      }
      for (let i = 0; i < programmeItems.length; i++) {
        const item = programmeItems[i];
        if (!item.title.trim()) continue;
        const itemPayload = {
          event_id: eventId, sub_event_id: subEventId,
          title: item.title,
          schedule_date: date || null,
          start_time: item.start_time || null,
          end_time: item.end_time || null,
          description: item.description || null,
          order_index: i,
        };
        if (item.id) {
          await supabase.from("event_schedule").update(itemPayload).eq("id", item.id);
        } else {
          await supabase.from("event_schedule").insert(itemPayload);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setShowForm(false); resetForm();
    } catch (err) { setFormError(err instanceof Error ? err.message : "Failed to save event"); }
    finally { setSubmitting(false); }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("event_schedule").delete().eq("sub_event_id", id);
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
    },
  });

  const scheduleForSubEvent = (subEventId: string) => (allSchedule ?? []).filter((s) => s.sub_event_id === subEventId);

  const renderEventCard = (e: SubEvent) => {
    const items = scheduleForSubEvent(e.id);
    return (
      <div key={e.id} className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-dash-text">{e.name}</h3>
            {e.date && <p className="text-sm text-dash-muted">{formatDate(e.date)}{e.time ? ` at ${formatTime12(e.time)}` : ""}</p>}
            {e.venue && <p className="text-sm text-dash-muted">{e.venue}</p>}
            {e.address && <p className="text-sm text-dash-muted">{e.address}</p>}
            {e.description && <p className="mt-2 text-sm text-dash-muted">{e.description}</p>}
            {items.length > 0 && (
              <div className="mt-3 border-t border-dash-border pt-3">
                <p className="mb-2 text-xs font-semibold text-dash-muted">Programme</p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 text-sm">
                      <span className="text-dash-muted whitespace-nowrap">{item.start_time ? formatTime12(item.start_time) : ""}{item.end_time ? ` – ${formatTime12(item.end_time)}` : ""}</span>
                      <span className="text-dash-text">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2"><button onClick={() => openEdit(e)} className="text-xs text-dash-primary hover:underline">Edit</button><button onClick={() => deleteMutation.mutate(e.id)} className="text-xs text-dash-danger hover:underline">Delete</button></div>
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load events" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-dash-text">Events</h2><Button size="sm" onClick={openAdd}>Add Event</Button></div>

      <div><h3 className="mb-3 text-sm font-medium text-dash-muted">Upcoming Events</h3>{upcoming.length === 0 ? <p className="text-sm text-dash-muted">No upcoming events. Click "Add Event" to create one.</p> : <div className="grid gap-3 sm:grid-cols-2">{upcoming.map(renderEventCard)}</div>}</div>
      <div><h3 className="mb-3 text-sm font-medium text-dash-muted">Previous Events</h3>{previous.length === 0 ? <p className="text-sm text-dash-muted">No previous events.</p> : <div className="grid gap-3 sm:grid-cols-2">{previous.map(renderEventCard)}</div>}</div>

      {/* Event Form Modal with integrated Programme editor */}
      <Modal open={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={editEvent ? "Edit Event" : "Add Event"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Event Name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          <div className="grid grid-cols-2 gap-3"><Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /><Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          <Input label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} /><Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div><label className="mb-1.5 block text-sm font-medium text-dash-text">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:border-dash-primary focus:outline-none" /></div>

          {/* Programme section */}
          <div className="border-t border-dash-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-dash-text">Programme</label>
              <Button type="button" size="sm" variant="secondary" onClick={addProgrammeItem}>Add Item</Button>
            </div>
            {programmeItems.length === 0 ? (
              <p className="text-sm text-dash-muted">No programme items yet. Add items like "2:00 PM – Arrival of Guests".</p>
            ) : (
              <div className="space-y-3">
                {programmeItems.map((item, index) => (
                  <div key={index} className="rounded-lg border border-dash-border bg-dash-bg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-dash-muted">Item {index + 1}</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => moveProgrammeItem(index, -1)} disabled={index === 0} className="text-xs text-dash-muted hover:text-dash-text disabled:opacity-30">↑</button>
                        <button type="button" onClick={() => moveProgrammeItem(index, 1)} disabled={index === programmeItems.length - 1} className="text-xs text-dash-muted hover:text-dash-text disabled:opacity-30">↓</button>
                        <button type="button" onClick={() => removeProgrammeItem(index)} className="text-xs text-dash-danger hover:underline">Remove</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Start Time" type="time" value={item.start_time} onChange={(e) => updateProgrammeItem(index, { start_time: e.target.value })} />
                      <Input label="End Time (optional)" type="time" value={item.end_time} onChange={(e) => updateProgrammeItem(index, { end_time: e.target.value })} />
                    </div>
                    <Input label="Title" value={item.title} onChange={(e) => updateProgrammeItem(index, { title: e.target.value })} placeholder="e.g. Arrival of Guests" />
                    <div><label className="mb-1 block text-xs font-medium text-dash-muted">Description (optional)</label><textarea value={item.description} onChange={(e) => updateProgrammeItem(index, { description: e.target.value })} rows={2} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" /></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formError && <p className="text-sm text-dash-danger">{formError}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button><Button type="submit" loading={submitting}>{editEvent ? "Update" : "Add"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
