import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type ScheduleItem } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, EmptyState, Skeleton, Modal, Toast, FormField } from "../../components/ui";
import { Plus, Trash2, Clock, GripVertical } from "lucide-react";
import { useState } from "react";

export default function TimelinePage() {
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", start_time: "", description: "" });

  const { data: items, isLoading } = useQuery({
    queryKey: ["event-schedule", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_schedule").select("*").eq("event_id", eventId).order("order_index", { ascending: true }); if (error) throw error; return data as ScheduleItem[]; },
  });

  const createMutation = useMutation({
    mutationFn: async () => { const order = (items?.length || 0); const { error } = await supabase.from("event_schedule").insert({ event_id: eventId, title: newItem.title, start_time: newItem.start_time || null, description: newItem.description || null, order_index: order }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] }); setShowAdd(false); setNewItem({ title: "", start_time: "", description: "" }); setToast("Item added"); },
    onError: (e: Error) => setToast(`Failed: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("event_schedule").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] }); setToast("Item removed"); },
    onError: (e: Error) => setToast(`Failed: ${e.message}`),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="font-heading text-2xl text-gray-900">Timeline</h2><p className="text-sm text-gray-500 mt-1">Schedule of events</p></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Item</Button>
      </div>
      {isLoading ? <Skeleton className="h-32" /> : !items || items.length === 0 ? <EmptyState icon={<Clock className="w-12 h-12" />} title="No timeline items" description="Add items like 'Ceremony begins' or 'Dinner served'." action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Item</Button>} /> : (
        <div className="space-y-3">{items.map((item) => (
          <Card key={item.id} className="flex items-start gap-4 p-5">
            <GripVertical className="w-4 h-4 text-gray-300 mt-1" />
            <div className="flex-1"><div className="flex items-center gap-2"><span className="text-xs font-mono text-gray-500">{item.start_time}</span><h3 className="font-medium text-gray-900">{item.title}</h3></div>{item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}</div>
            <button onClick={() => deleteMutation.mutate(item.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </Card>
        ))}</div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Timeline Item">
        <div className="space-y-4">
          <FormField label="Title"><Input value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} placeholder="Ceremony begins" /></FormField>
          <FormField label="Time"><Input value={newItem.start_time} onChange={(e) => setNewItem({ ...newItem, start_time: e.target.value })} placeholder="4:00 PM" /></FormField>
          <FormField label="Description"><Textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} rows={2} /></FormField>
          <div className="flex gap-3"><Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!newItem.title}>Add</Button><Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button></div>
        </div>
      </Modal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
