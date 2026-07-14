import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventSchedule } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { formatDate, formatTime } from "../../lib/utils";

export function EventsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const { data: schedule, isLoading: schedLoading } = useQuery({
    queryKey: ["schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
    enabled: !!eventId,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<EventSchedule | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    schedule_date: "",
    start_time: "",
    end_time: "",
    venue: "",
    address: "",
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = schedule?.reduce((mx, s) => Math.max(mx, s.order_index), -1) ?? -1;
      const { error } = await supabase.from("event_schedule").insert({
        event_id: eventId,
        title: form.title,
        description: form.description || null,
        schedule_date: form.schedule_date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        venue: form.venue || null,
        address: form.address || null,
        order_index: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingItem) return;
      const { error } = await supabase
        .from("event_schedule")
        .update({
          title: form.title,
          description: form.description || null,
          schedule_date: form.schedule_date || null,
          start_time: form.start_time || null,
          end_time: form.end_time || null,
          venue: form.venue || null,
          address: form.address || null,
        })
        .eq("id", editingItem.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowForm(false);
      setEditingItem(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule", eventId] }),
  });

  const resetForm = () => {
    setForm({ title: "", description: "", schedule_date: "", start_time: "", end_time: "", venue: "", address: "" });
  };

  const startEdit = (item: EventSchedule) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description ?? "",
      schedule_date: item.schedule_date ?? "",
      start_time: item.start_time ?? "",
      end_time: item.end_time ?? "",
      venue: item.venue ?? "",
      address: item.address ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) updateMutation.mutate();
    else addMutation.mutate();
  };

  const draftEvent = event ? {
    name: event.draft_name ?? event.name,
    date: event.draft_event_date ?? event.event_date,
    time: event.draft_event_time ?? event.event_time,
    venue: event.draft_venue ?? event.venue,
    address: event.draft_address ?? event.address,
  } : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Events</h2>
        <p className="text-sm text-gray-500">Manage your main event details and schedule.</p>
      </div>

      {draftEvent && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Main Event Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Event Name:</span> <span className="font-medium">{draftEvent.name}</span></div>
            <div><span className="text-gray-500">Date:</span> <span className="font-medium">{formatDate(draftEvent.date)}</span></div>
            <div><span className="text-gray-500">Time:</span> <span className="font-medium">{formatTime(draftEvent.time)}</span></div>
            <div><span className="text-gray-500">Venue:</span> <span className="font-medium">{draftEvent.venue || "—"}</span></div>
            <div className="sm:col-span-2"><span className="text-gray-500">Address:</span> <span className="font-medium">{draftEvent.address || "—"}</span></div>
          </div>
          <p className="text-xs text-gray-400">Edit these in the Settings tab.</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Event Schedule</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setShowForm(!showForm); setEditingItem(null); resetForm(); }}
          >
            {showForm ? "Cancel" : "Add Schedule Item"}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 mb-4">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <DatePicker label="Date" value={form.schedule_date} onChange={(v) => setForm({ ...form, schedule_date: v })} />
              <TimePicker label="Start Time" value={form.start_time} onChange={(v) => setForm({ ...form, start_time: v })} />
              <TimePicker label="End Time" value={form.end_time} onChange={(v) => setForm({ ...form, end_time: v })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
              <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <Button type="submit" size="sm" disabled={addMutation.isPending || updateMutation.isPending}>
              {editingItem ? "Update" : "Add"} Item
            </Button>
          </form>
        )}

        {schedLoading ? (
          <p className="text-sm text-gray-500">Loading schedule…</p>
        ) : schedule && schedule.length > 0 ? (
          <div className="space-y-2">
            {schedule.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-800">{item.title}</h4>
                  {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                  <div className="text-xs text-gray-500 mt-2 space-x-3">
                    {item.schedule_date && <span>{formatDate(item.schedule_date)}</span>}
                    {item.start_time && <span>{formatTime(item.start_time)}{item.end_time ? ` – ${formatTime(item.end_time)}` : ""}</span>}
                    {item.venue && <span>{item.venue}</span>}
                  </div>
                  {item.address && <p className="text-xs text-gray-400 mt-1">{item.address}</p>}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(item)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => { if (confirm("Delete this schedule item?")) deleteMutation.mutate(item.id); }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No schedule items yet. Add one to show guests the timeline of your event.</p>
        )}
      </div>
    </div>
  );
}
