import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventSchedule } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, DatePicker, TimePicker } from "../../components/ui";
import { LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function TimelinePage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<EventSchedule | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: schedule, isLoading, isError, error } = useQuery({
    queryKey: ["event-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_schedule").select("*").eq("event_id", eventId).order("order_index", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
  });

  const openForm = (item?: EventSchedule) => {
    if (item) { setEditItem(item); setTitle(item.title); setDescription(item.description ?? ""); setDate(item.schedule_date ?? ""); setStartTime(item.start_time ?? ""); setEndTime(item.end_time ?? ""); setVenue(item.venue ?? ""); setAddress(item.address ?? ""); }
    else { setEditItem(null); setTitle(""); setDescription(""); setDate(""); setStartTime(""); setEndTime(""); setVenue(""); setAddress(""); }
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { setFormError("Title is required"); return; }
    setSaving(true); setFormError(null);
    try {
      const payload = { event_id: eventId, title, description: description || null, schedule_date: date || null, start_time: startTime || null, end_time: endTime || null, venue: venue || null, address: address || null };
      if (editItem) {
        const { error } = await supabase.from("event_schedule").update(payload).eq("id", editItem.id);
        if (error) throw error;
      } else {
        const orderIndex = (schedule?.length ?? 0);
        const { error } = await supabase.from("event_schedule").insert({ ...payload, order_index: orderIndex });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setShowForm(false);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("event_schedule").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load schedule" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Schedule</h2>
        <Button size="sm" onClick={() => openForm()}>Add Item</Button>
      </div>
      {!schedule || schedule.length === 0 ? (
        <EmptyState title="No schedule items" description="Add items to build your event timeline." action={<Button size="sm" onClick={() => openForm()}>Add Item</Button>} />
      ) : (
        <div className="space-y-3">
          {schedule.map((item) => (
            <div key={item.id} className="rounded-lg border border-dash-border bg-dash-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-dash-text">{item.title}</h3>
                  {item.schedule_date && <p className="text-sm text-dash-muted">{formatDate(item.schedule_date)}{item.start_time ? ` at ${formatTime12(item.start_time)}` : ""}{item.end_time ? ` – ${formatTime12(item.end_time)}` : ""}</p>}
                  {item.description && <p className="mt-1 text-sm text-dash-muted">{item.description}</p>}
                  {item.venue && <p className="mt-1 text-sm text-dash-muted">{item.venue}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openForm(item)} className="text-xs text-dash-primary hover:underline">Edit</button>
                  <button onClick={() => deleteMutation.mutate(item.id)} className="text-xs text-dash-danger hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Edit Schedule Item" : "Add Schedule Item"}>
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ceremony" autoFocus />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <DatePicker label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <TimePicker label="Start Time" value={startTime} onChange={setStartTime} />
            <TimePicker label="End Time" value={endTime} onChange={setEndTime} />
          </div>
          <Input label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          {formError && <p className="text-sm text-dash-danger">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editItem ? "Update" : "Add"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
