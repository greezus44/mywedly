import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type ScheduleItem } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Modal, Card, EmptyState, FormField } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { Plus, Clock, Trash2, Edit2 } from "lucide-react";
import { formatDateShort, formatTime12 } from "../../lib/utils";

export default function TimelineEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", schedule_date: null as string | null, start_time: null as string | null, end_time: null as string | null, venue: "", address: "", dress_code: "" });

  const { data: items, isLoading } = useQuery({
    queryKey: ["timeline", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_schedule").select("*").eq("event_id", event.id).order("order_index", { ascending: true });
      if (error) throw error;
      return data as ScheduleItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_schedule").insert({ event_id: event.id, ...form, order_index: items?.length || 0 });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["timeline", event.id] }); setShowModal(false); setForm({ title: "", description: "", schedule_date: null, start_time: null, end_time: null, venue: "", address: "", dress_code: "" }); setEditingId(null); },
    onError: (err: any) => alert("Failed to create: " + (err.message || "Unknown error")),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_schedule").update(form).eq("id", editingId!);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["timeline", event.id] }); setShowModal(false); setForm({ title: "", description: "", schedule_date: null, start_time: null, end_time: null, venue: "", address: "", dress_code: "" }); setEditingId(null); },
    onError: (err: any) => alert("Failed to update: " + (err.message || "Unknown error")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("event_schedule").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["timeline", event.id] }),
    onError: (err: any) => alert("Failed to delete: " + (err.message || "Unknown error")),
  });

  const openEdit = (item: ScheduleItem) => {
    setForm({ title: item.title, description: item.description, schedule_date: item.schedule_date, start_time: item.start_time, end_time: item.end_time, venue: item.venue, address: item.address, dress_code: item.dress_code });
    setEditingId(item.id);
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-dash-text">Timeline</h2>
        <Button onClick={() => { setForm({ title: "", description: "", schedule_date: null, start_time: null, end_time: null, venue: "", address: "", dress_code: "" }); setEditingId(null); setShowModal(true); }}><Plus className="w-4 h-4" /> Add Item</Button>
      </div>
      {isLoading ? <div className="text-center py-12 text-dash-muted">Loading...</div> : !items || items.length === 0 ? (
        <EmptyState icon={<Clock className="w-12 h-12" />} title="No timeline items" description="Add schedule items for your event." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-dash-text">{item.title}</h3>
                  <div className="flex gap-3 text-sm text-dash-muted mt-1">
                    {item.schedule_date && <span>{formatDateShort(item.schedule_date)}</span>}
                    {item.start_time && <span>{formatTime12(item.start_time)}</span>}
                    {item.venue && <span>{item.venue}</span>}
                  </div>
                  {item.description && <p className="text-sm text-dash-muted mt-1">{item.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(item)} className="text-dash-muted hover:text-dash-primary"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(item.id); }} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Timeline Item" : "New Timeline Item"}>
        <div className="space-y-4">
          <FormField label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></FormField>
          <FormField label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></FormField>
          <FormField label="Date"><DatePicker value={form.schedule_date} onChange={(d) => setForm({ ...form, schedule_date: d })} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time"><TimePicker value={form.start_time} onChange={(t) => setForm({ ...form, start_time: t })} /></FormField>
            <FormField label="End Time"><TimePicker value={form.end_time} onChange={(t) => setForm({ ...form, end_time: t })} /></FormField>
          </div>
          <FormField label="Venue"><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></FormField>
          <Button onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()} loading={createMutation.isPending || updateMutation.isPending} disabled={!form.title.trim()} className="w-full">{editingId ? "Save" : "Create"}</Button>
        </div>
      </Modal>
    </div>
  );
}
