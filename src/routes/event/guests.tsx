import { useState, useMemo } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { FormField, Modal, Badge, EmptyState, ErrorState, Skeleton, Toast } from "../../components/ui/index";
import { Users, Plus, Search, Pencil, Trash2 } from "lucide-react";

type Ctx = { event: UserEvent | null };

type GuestForm = {
  name: string;
  email: string;
  phone: string;
  group_name: string;
  side: string;
  plus_ones: number;
};

const emptyForm: GuestForm = { name: "", email: "", phone: "", group_name: "", side: "", plus_ones: 0 };

export default function Guests() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<EventGuest | null>(null);
  const [form, setForm] = useState<GuestForm>(emptyForm);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: guests = [], isLoading, isError, refetch } = useQuery<EventGuest[]>({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
    staleTime: 30000,
  });

  const addMutation = useMutation({
    mutationFn: async (g: GuestForm) => {
      const { error } = await supabase.from("event_guests").insert({
        event_id: eventId,
        name: g.name,
        email: g.email || null,
        phone: g.phone || null,
        group_name: g.group_name || null,
        side: g.side || null,
        plus_ones: g.plus_ones,
        rsvp_status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guests", eventId] }); setToast({ message: "Guest added", type: "success" }); setModalOpen(false); },
    onError: (err: any) => setToast({ message: "Failed: " + err.message, type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...g }: GuestForm & { id: string }) => {
      const { error } = await supabase.from("event_guests").update({
        name: g.name,
        email: g.email || null,
        phone: g.phone || null,
        group_name: g.group_name || null,
        side: g.side || null,
        plus_ones: g.plus_ones,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guests", eventId] }); setToast({ message: "Guest updated", type: "success" }); setModalOpen(false); },
    onError: (err: any) => setToast({ message: "Failed: " + err.message, type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guests", eventId] }); setToast({ message: "Guest deleted", type: "success" }); },
    onError: (err: any) => setToast({ message: "Failed: " + err.message, type: "error" }),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return guests;
    return guests.filter(g =>
      g.name.toLowerCase().includes(q) ||
      (g.email || "").toLowerCase().includes(q) ||
      (g.phone || "").toLowerCase().includes(q) ||
      (g.group_name || "").toLowerCase().includes(q) ||
      (g.side || "").toLowerCase().includes(q)
    );
  }, [guests, search]);

  const summary = useMemo(() => ({
    total: guests.length,
    attending: guests.filter(g => g.rsvp_status === "attending").length,
    declined: guests.filter(g => g.rsvp_status === "declined").length,
    pending: guests.filter(g => !g.rsvp_status || g.rsvp_status === "pending").length,
  }), [guests]);

  const openAdd = () => { setEditingGuest(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (g: EventGuest) => {
    setEditingGuest(g);
    setForm({ name: g.name, email: g.email || "", phone: g.phone || "", group_name: g.group_name || "", side: g.side || "", plus_ones: g.plus_ones || 0 });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setToast({ message: "Name is required", type: "error" }); return; }
    if (editingGuest) updateMutation.mutate({ id: editingGuest.id, ...form });
    else addMutation.mutate(form);
  };

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Guests</h1>
          <p className="text-sm text-gray-500">Manage your guest list</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Guest</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Attending</p>
          <p className="text-2xl font-bold text-green-600">{summary.attending}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Declined</p>
          <p className="text-2xl font-bold text-red-600">{summary.declined}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-gray-600">{summary.pending}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guests..." className="pl-9" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load guests" onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users className="w-12 h-12" />} title={search ? "No guests found" : "No guests yet"} description={search ? "Try a different search term" : "Add your first guest to get started"} action={!search && <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Guest</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Group</th>
                  <th className="px-4 py-3 font-medium">Side</th>
                  <th className="px-4 py-3 font-medium">RSVP</th>
                  <th className="px-4 py-3 font-medium">Plus Ones</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(g => (
                  <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{g.name}</td>
                    <td className="px-4 py-3 text-gray-600">{g.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{g.phone || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{g.group_name || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{g.side || "—"}</td>
                    <td className="px-4 py-3">
                      {g.rsvp_status === "attending" ? <Badge variant="success">Attending</Badge>
                        : g.rsvp_status === "declined" ? <Badge variant="error">Declined</Badge>
                        : <Badge variant="warning">Pending</Badge>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{g.plus_ones ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm(`Delete ${g.name}?`)) deleteMutation.mutate(g.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingGuest ? "Edit Guest" : "Add Guest"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name">
            <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Guest name" required />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email"><Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" /></FormField>
            <FormField label="Phone"><Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Group"><Input value={form.group_name} onChange={(e) => setForm(f => ({ ...f, group_name: e.target.value }))} placeholder="e.g. Family" /></FormField>
            <FormField label="Side">
              <Select value={form.side} onChange={(e) => setForm(f => ({ ...f, side: e.target.value }))}>
                <option value="">None</option>
                <option value="groom">Groom</option>
                <option value="bride">Bride</option>
                <option value="host">Host</option>
                <option value="other">Other</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Plus Ones">
            <Input type="number" min={0} value={form.plus_ones} onChange={(e) => setForm(f => ({ ...f, plus_ones: Number(e.target.value) }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={addMutation.isPending || updateMutation.isPending}>{editingGuest ? "Save Changes" : "Add Guest"}</Button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
