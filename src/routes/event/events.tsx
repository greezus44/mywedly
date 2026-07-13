import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Modal, Card, EmptyState, FormField } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { Plus, Calendar, Trash2, Edit2, GripVertical } from "lucide-react";
import { formatDateShort, formatTime12 } from "../../lib/utils";

interface SubEventForm {
  name: string;
  description: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  address: string;
  dress_code: string;
}

const EMPTY_FORM: SubEventForm = {
  name: "",
  description: "",
  date: null,
  start_time: null,
  end_time: null,
  venue: "",
  address: "",
  dress_code: "",
};

export default function EventsEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["sub-events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sub_events").insert({
        parent_event_id: event.id,
        name: form.name,
        description: form.description || null,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue,
        address: form.address,
        dress_code: form.dress_code,
        display_order: (subEvents?.length || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setError(null);
    },
    onError: (err: any) => {
      const msg = err?.message || "";
      if (msg.includes("parent_eventId") || msg.includes("column") || msg.includes("schema")) {
        setError("Sub-events are temporarily unavailable due to a configuration issue. Please try again later.");
      } else {
        setError("Unable to create sub-event: " + msg);
      }
      console.error("Sub-event creation error:", err);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sub_events").update({
        name: form.name,
        description: form.description || null,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue,
        address: form.address,
        dress_code: form.dress_code,
      }).eq("id", editingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] });
      setShowModal(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setError(null);
    },
    onError: (err: any) => alert("Failed to update: " + (err.message || "Unknown error")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] }),
    onError: (err: any) => alert("Failed to delete: " + (err.message || "Unknown error")),
  });

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setError(null); setShowModal(true); };
  const openEdit = (se: SubEvent) => {
    setForm({
      name: se.name,
      description: se.description || "",
      date: se.date,
      start_time: se.start_time || se.time,
      end_time: se.end_time,
      venue: se.venue || "",
      address: se.address || "",
      dress_code: se.dress_code || "",
    });
    setEditingId(se.id);
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingId) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-dash-text">Sub-Events</h2>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Sub-Event</Button>
      </div>
      {isLoading ? (
        <div className="text-center py-12 text-dash-muted">Loading...</div>
      ) : !subEvents || subEvents.length === 0 ? (
        <EmptyState icon={<Calendar className="w-12 h-12" />} title="No sub-events yet" description="Add sub-events like ceremony, reception, or after-party." action={<Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Sub-Event</Button>} />
      ) : (
        <div className="space-y-3">
          {subEvents.map((se, i) => (
            <Card key={se.id} className="p-4 flex items-start gap-3">
              <GripVertical className="w-5 h-5 text-dash-muted mt-1 cursor-grab" />
              <div className="flex-1">
                <h3 className="font-medium text-dash-text">{se.name}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-dash-muted mt-1">
                  {se.date && <span>{formatDateShort(se.date)}</span>}
                  {se.start_time && <span>{formatTime12(se.start_time)}</span>}
                  {se.venue && <span>{se.venue}</span>}
                </div>
                {se.description && <p className="text-sm text-dash-muted mt-1">{se.description}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(se)} className="text-dash-muted hover:text-dash-primary"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm("Delete this sub-event?")) deleteMutation.mutate(se.id); }} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={showModal} onClose={() => { setShowModal(false); setError(null); }} title={editingId ? "Edit Sub-Event" : "New Sub-Event"}>
        <div className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <FormField label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ceremony" /></FormField>
          <FormField label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></FormField>
          <FormField label="Date"><DatePicker value={form.date} onChange={(d) => setForm({ ...form, date: d })} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time"><TimePicker value={form.start_time} onChange={(t) => setForm({ ...form, start_time: t })} /></FormField>
            <FormField label="End Time"><TimePicker value={form.end_time} onChange={(t) => setForm({ ...form, end_time: t })} /></FormField>
          </div>
          <FormField label="Venue"><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></FormField>
          <FormField label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></FormField>
          <FormField label="Dress Code"><Input value={form.dress_code} onChange={(e) => setForm({ ...form, dress_code: e.target.value })} /></FormField>
          <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending} disabled={!form.name.trim()} className="w-full">
            {editingId ? "Save Changes" : "Create Sub-Event"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
