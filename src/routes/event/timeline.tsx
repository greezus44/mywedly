import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventSchedule } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Card, LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import { TimePicker } from "../../components/ui/TimePicker";
import { formatTime12 } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function TimelinePage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<EventSchedule | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: schedule, isLoading, isError, error } = useQuery({
    queryKey: ["event-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
  });

  const resetForm = () => {
    setTitle(""); setDescription(""); setStartTime(""); setEndTime(""); setLocation("");
    setEditItem(null); setFormError(null);
  };

  const openAdd = () => { resetForm(); setShowForm(true); };
  const openEdit = (item: EventSchedule) => {
    setEditItem(item);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setStartTime(item.start_time.slice(0, 5));
    setEndTime((item.end_time ?? "").slice(0, 5));
    setLocation(item.location ?? "");
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        event_id: eventId,
        title,
        description: description || null,
        start_time: startTime || null,
        end_time: endTime || null,
        location: location || null,
      };
      if (editItem) {
        const { error } = await supabase.from("event_schedule").update(payload).eq("id", editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_schedule").insert(payload);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setShowForm(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load timeline" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Schedule / Timeline</h2>
        <Button size="sm" onClick={openAdd}>Add Item</Button>
      </div>

      {!schedule || schedule.length === 0 ? (
        <EmptyState title="No schedule items" description="Add items to show your event timeline." action={<Button size="sm" onClick={openAdd}>Add Item</Button>} />
      ) : (
        <div className="space-y-3">
          {schedule.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {item.start_time && (
                      <span className="text-sm font-medium text-dash-primary">{formatTime12(item.start_time)}</span>
                    )}
                    {item.end_time && (
                      <span className="text-xs text-dash-muted">– {formatTime12(item.end_time)}</span>
                    )}
                  </div>
                  <h3 className="mt-1 font-semibold text-dash-text">{item.title}</h3>
                  {item.location && <p className="text-sm text-dash-muted">📍 {item.location}</p>}
                  {item.description && <p className="mt-1 text-sm text-dash-muted">{item.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(item)} className="text-xs text-dash-primary hover:underline">Edit</button>
                  <button onClick={() => deleteMutation.mutate(item.id)} className="text-xs text-dash-danger hover:underline">Delete</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={editItem ? "Edit Item" : "Add Item"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ceremony" required autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <TimePicker label="Start Time" value={startTime} onChange={setStartTime} />
            <TimePicker label="End Time" value={endTime} onChange={setEndTime} />
          </div>
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30" />
          </div>
          {formError && <p className="text-sm text-dash-danger">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editItem ? "Update" : "Add"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
