import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select, Modal, Card, EmptyState, Badge, FormField } from "../../components/ui";
import { UserPlus, Search, Trash2 } from "lucide-react";

export default function GuestsEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", group_name: "", side: "" });

  const { data: guests, isLoading } = useQuery({
    queryKey: ["guests", event.id],
    queryFn: async () => { const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", event.id).order("created_at", { ascending: false }); if (error) throw error; return data as EventGuest[]; },
  });

  const createMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("event_guests").insert({ event_id: event.id, ...form }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guests", event.id] }); setShowModal(false); setForm({ name: "", email: "", phone: "", group_name: "", side: "" }); },
    onError: (err: any) => alert("Failed to add guest: " + (err.message || "Unknown error")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("event_guests").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guests", event.id] }),
    onError: (err: any) => alert("Failed to delete: " + (err.message || "Unknown error")),
  });

  const filtered = guests?.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-dash-text">Guests</h2>
        <Button onClick={() => { setForm({ name: "", email: "", phone: "", group_name: "", side: "" }); setShowModal(true); }}><UserPlus className="w-4 h-4" /> Add Guest</Button>
      </div>
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-muted" />
        <Input placeholder="Search guests..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="pl-10" />
      </div>
      {isLoading ? <div className="text-center py-12 text-dash-muted">Loading...</div> : filtered.length === 0 ? (
        <EmptyState icon={<UserPlus className="w-12 h-12" />} title="No guests found" description="Add guests to your event." />
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => (
            <Card key={g.id} className="p-3 flex items-center justify-between">
              <div><h3 className="font-medium text-dash-text">{g.name}</h3><p className="text-sm text-dash-muted">{g.email || g.phone || ""}</p></div>
              <div className="flex items-center gap-2">
                <Badge variant={g.rsvp_status === "attending" ? "success" : g.rsvp_status === "declined" ? "danger" : "default"}>{g.rsvp_status}</Badge>
                <button onClick={() => { if (confirm("Remove this guest?")) deleteMutation.mutate(g.id); }} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Guest">
        <div className="space-y-4">
          <FormField label="Name"><Input value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Email"><Input type="email" value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} /></FormField>
          <FormField label="Phone"><Input value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })} /></FormField>
          <FormField label="Group"><Input value={form.group_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, group_name: e.target.value })} /></FormField>
          <FormField label="Side">
            <Select value={form.side} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, side: e.target.value })}>
              <option value="">None</option><option value="groom">Groom</option><option value="bride">Bride</option><option value="family">Family</option><option value="friend">Friend</option>
            </Select>
          </FormField>
          <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!form.name.trim()} className="w-full">Add Guest</Button>
        </div>
      </Modal>
    </div>
  );
}
