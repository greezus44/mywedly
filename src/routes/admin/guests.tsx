import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { generateToken, formatDate } from "../../lib/utils";
import { Plus, Pencil, Trash2, Search, Users, Copy } from "lucide-react";

export function GuestsPage() {
  const queryClient = useQueryClient();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [form, setForm] = useState({ name: "", username: "", email: "", phone: "" });

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });

  const { data: wed, isLoading, error } = useQuery({
    queryKey: ["wedding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user!.id).maybeSingle();
      if (error) throw error;
      return data as Wedding | null;
    },
  });

  const { data: guestData, refetch } = useQuery({
    queryKey: ["guests", wed?.id],
    enabled: !!wed,
    queryFn: async () => {
      const { data, error } = await supabase.from("guests").select("*").eq("wedding_id", wed!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Guest[];
    },
  });

  useEffect(() => { if (wed) setWedding(wed); }, [wed]);
  useEffect(() => { if (guestData) setGuests(guestData); }, [guestData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingGuest) {
        const { error } = await supabase.from("guests").update({
          name: form.name, username: form.username, email: form.email || null, phone: form.phone || null,
        }).eq("id", editingGuest.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("guests").insert({
          wedding_id: wedding!.id, name: form.name, username: form.username || generateToken().slice(0, 8),
          email: form.email || null, phone: form.phone || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["guests", wed?.id] });
      setModalOpen(false);
      setToast({ message: editingGuest ? "Guest updated" : "Guest added", type: "success" });
    },
    onError: (e) => setToast({ message: e.message, type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { refetch(); queryClient.invalidateQueries({ queryKey: ["guests", wed?.id] }); setToast({ message: "Guest deleted", type: "success" }); },
    onError: (e) => setToast({ message: e.message, type: "error" }),
  });

  const openCreate = () => {
    setEditingGuest(null);
    setForm({ name: "", username: "", email: "", phone: "" });
    setModalOpen(true);
  };

  const openEdit = (g: Guest) => {
    setEditingGuest(g);
    setForm({ name: g.name, username: g.username, email: g.email || "", phone: g.phone || "" });
    setModalOpen(true);
  };

  const filtered = guests.filter((g) => {
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.username.toLowerCase().includes(q) || (g.email || "").toLowerCase().includes(q) || (g.phone || "").includes(q);
  });

  if (isLoading) return <AdminLayout><div className="py-20 text-center text-gray-500">Loading…</div></AdminLayout>;
  if (error) return <AdminLayout><div className="py-20 text-center text-red-600">{error.message}</div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="py-20 text-center text-gray-500">No wedding found.</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Guests</h2>
            <p className="text-sm text-gray-500">{guests.length} total guests</p>
          </div>
          <Button onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" /> Add Guest</Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-10" placeholder="Search guests by name, username, email, or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? (
          <Card><EmptyState icon={<Users className="h-10 w-10" />} title={search ? "No matching guests" : "No guests yet"} description={search ? "Try a different search term." : "Click 'Add Guest' to invite your first guest."} /></Card>
        ) : (
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Added</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{g.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <button onClick={() => { navigator.clipboard.writeText(g.username); setToast({ message: "Username copied", type: "success" }); }} className="flex items-center gap-1 hover:text-gray-900">
                          {g.username} <Copy className="h-3 w-3 text-gray-400" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{g.email || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{g.phone || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(g.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(g)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this guest?")) deleteMutation.mutate(g.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingGuest ? "Edit Guest" : "Add Guest"}>
        <div className="space-y-4">
          <FormField label="Full Name">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
          </FormField>
          <FormField label="Username" hint="Used for guest sign-in. Leave blank to auto-generate.">
            <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="johndoe" />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="john@example.com" />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+60 12 345 6789" />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name}>{editingGuest ? "Update" : "Add"}</Button>
          </div>
        </div>
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </AdminLayout>
  );
}
