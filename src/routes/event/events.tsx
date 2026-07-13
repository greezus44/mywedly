import { useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, FormField, EmptyState, Skeleton, Modal, Toast, Badge } from "../../components/ui";
import { Plus, Trash2, Calendar } from "lucide-react";
import { useState } from "react";

type Ctx = { event: UserEvent };
export default function EventsPage() {
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newSub, setNewSub] = useState({ name: "", date: "", time: "", venue: "", address: "" });

  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("sub_events").select("*").eq("parent_eventId", eventId).order("order_index", { ascending: true }); if (error) throw error; return data as SubEvent[]; },
  });

  const createMutation = useMutation({
    mutationFn: async () => { const order = (subEvents?.length || 0); const { error } = await supabase.from("sub_events").insert({ parent_eventId: eventId, name: newSub.name, date: newSub.date || null, time: newSub.time || null, venue: newSub.venue || null, address: newSub.address || null, order_index: order, rsvp_enabled: true }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] }); setShowAdd(false); setNewSub({ name: "", date: "", time: "", venue: "", address: "" }); setToast("Event added"); },
    onError: (e: Error) => setToast(`Failed: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("sub_events").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] }); setToast("Event removed"); },
    onError: (e: Error) => setToast(`Failed: ${e.message}`),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="font-heading text-2xl text-gray-900">Events</h2><p className="text-sm text-gray-500 mt-1">Add ceremony, reception, and other events</p></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Event</Button>
      </div>
      {isLoading ? <Skeleton className="h-32" /> : !subEvents || subEvents.length === 0 ? <EmptyState icon={<Calendar className="w-12 h-12" />} title="No sub-events" description="Add a ceremony, reception, or other event." action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Event</Button>} /> : (
        <div className="space-y-4">{subEvents.map((se) => (
          <Card key={se.id} className="flex items-start justify-between p-5">
            <div><h3 className="font-medium text-gray-900">{se.name}</h3><div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">{se.date && <Badge>{se.date}</Badge>}{se.time && <Badge>{se.time}</Badge>}{se.venue && <span>· {se.venue}</span>}</div>{se.address && <p className="text-xs text-gray-400 mt-1">{se.address}</p>}</div>
            <button onClick={() => deleteMutation.mutate(se.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </Card>
        ))}</div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Event">
        <div className="space-y-4">
          <FormField label="Name"><Input value={newSub.name} onChange={(e) => setNewSub({ ...newSub, name: e.target.value })} placeholder="Ceremony" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date"><Input type="date" value={newSub.date} onChange={(e) => setNewSub({ ...newSub, date: e.target.value })} /></FormField>
            <FormField label="Time"><Input type="time" value={newSub.time} onChange={(e) => setNewSub({ ...newSub, time: e.target.value })} /></FormField>
          </div>
          <FormField label="Venue"><Input value={newSub.venue} onChange={(e) => setNewSub({ ...newSub, venue: e.target.value })} /></FormField>
          <FormField label="Address"><Textarea value={newSub.address} onChange={(e) => setNewSub({ ...newSub, address: e.target.value })} rows={2} /></FormField>
          <div className="flex gap-3"><Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!newSub.name}>Add</Button><Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button></div>
        </div>
      </Modal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
