import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, EmptyState, Skeleton, Modal, Toast, Badge, FormField } from "../../components/ui";
import { Plus, Trash2, Users, Search } from "lucide-react";
import { useState } from "react";

export default function GuestsPage() {
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [newGuest, setNewGuest] = useState({ name: "", email: "", phone: "", group_name: "" });

  const { data: guests, isLoading } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId).order("name", { ascending: true }); if (error) throw error; return data as EventGuest[]; },
  });

  const createMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("event_guests").insert({ event_id: eventId, name: newGuest.name, email: newGuest.email || null, phone: newGuest.phone || null, group_name: newGuest.group_name || null, rsvp_status: "pending" }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] }); setShowAdd(false); setNewGuest({ name: "", email: "", phone: "", group_name: "" }); setToast("Guest added"); },
    onError: (e: Error) => setToast(`Failed: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("event_guests").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] }); setToast("Guest removed"); },
    onError: (e: Error) => setToast(`Failed: ${e.message}`),
  });

  const filtered = guests?.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()) || g.email?.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="font-heading text-2xl text-gray-900">Guests</h2><p className="text-sm text-gray-500 mt-1">{guests?.length || 0} total guests</p></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Guest</Button>
      </div>
      <div className="mb-4 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guests..." className="pl-10" /></div>
      {isLoading ? <Skeleton className="h-64" /> : filtered.length === 0 ? <EmptyState icon={<Users className="w-12 h-12" />} title="No guests found" description="Add guests manually or import via CSV." action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Guest</Button>} /> : (
        <div className="space-y-2">{filtered.map((g) => (
          <Card key={g.id} className="flex items-center justify-between py-3 px-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">{g.name.charAt(0).toUpperCase()}</div>
              <div><p className="font-medium text-gray-900">{g.name}</p><p className="text-xs text-gray-500">{g.email || g.phone || "No contact"}</p></div>
            </div>
            <div className="flex items-center gap-2">
              {g.rsvp_status && g.rsvp_status !== "pending" && <Badge variant={g.rsvp_status === "attending" ? "success" : "error"}>{g.rsvp_status}</Badge>}
              <button onClick={() => deleteMutation.mutate(g.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </Card>
        ))}</div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Guest">
        <div className="space-y-4">
          <FormField label="Name"><Input value={newGuest.name} onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })} /></FormField>
          <FormField label="Email"><Input type="email" value={newGuest.email} onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })} /></FormField>
          <FormField label="Phone"><Input value={newGuest.phone} onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })} /></FormField>
          <FormField label="Group"><Input value={newGuest.group_name} onChange={(e) => setNewGuest({ ...newGuest, group_name: e.target.value })} placeholder="Bride's Family" /></FormField>
          <div className="flex gap-3"><Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!newGuest.name}>Add</Button><Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button></div>
        </div>
      </Modal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
