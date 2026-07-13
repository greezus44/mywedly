import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { generateToken } from "../../lib/utils";
import { Plus, Pencil, Trash2, Save, Search, Users } from "lucide-react";

export function GuestsPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [form, setForm] = useState<Partial<Guest>>({});
  const qc = useQueryClient();

  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      return data as Wedding | null;
    },
  });

  const { data: guests, isLoading } = useQuery({
    queryKey: ["guests", wedding?.id, search],
    queryFn: async () => {
      if (!wedding) return [];
      let q = supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      if (search.trim()) {
        const s = search.trim();
        q = q.or(`name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,username.ilike.%${s}%,group_id.ilike.%${s}%`);
      }
      const { data } = await q;
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  const createGuest = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("guests").insert({
        wedding_id: wedding.id,
        name: form.name || "Guest",
        username: form.username || generateToken().slice(0, 8),
        email: form.email || null,
        phone: form.phone || null,
        group_id: form.group_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["guests"] }); setModalOpen(false); },
  });

  const updateGuest = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error("No guest");
      const { error } = await supabase.from("guests").update({
        name: form.name,
        username: form.username,
        email: form.email || null,
        phone: form.phone || null,
        group_id: form.group_id || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["guests"] }); setModalOpen(false); },
  });

  const deleteGuest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guests"] }),
  });

  const openCreate = () => { setEditing(null); setForm({ username: generateToken().slice(0, 8) }); setModalOpen(true); };
  const openEdit = (g: Guest) => { setEditing(g); setForm(g); setModalOpen(true); };
  const save = () => { if (editing) updateGuest.mutate(); else createGuest.mutate(); };

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Guests</h2>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Guest</Button>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, phone, username, group..." className="pl-10" />
      </div>

      <Card>
        {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
        {guests && guests.length === 0 && !isLoading && (
          <EmptyState icon={<Users className="h-8 w-8" />} title="No guests found" description="Add your first guest" />
        )}
        {guests && guests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Username</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Phone</th>
                  <th className="pb-2 pr-4 font-medium">Group</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => (
                  <tr key={g.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-gray-900">{g.name}</td>
                    <td className="py-3 pr-4"><Badge variant="default">{g.username}</Badge></td>
                    <td className="py-3 pr-4 text-gray-500">{g.email || "—"}</td>
                    <td className="py-3 pr-4 text-gray-500">{g.phone || "—"}</td>
                    <td className="py-3 pr-4 text-gray-500">{g.group_id || "—"}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(g)}><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteGuest.mutate(g.id)}><Trash2 className="h-3 w-3 text-red-600" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Guest" : "Add Guest"}>
        <div className="space-y-4">
          <FormField label="Name"><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Username"><Input value={form.username || ""} onChange={(e) => setForm({ ...form, username: e.target.value })} /></FormField>
          <FormField label="Email"><Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
          <FormField label="Phone"><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField>
          <FormField label="Group"><Input value={form.group_id || ""} onChange={(e) => setForm({ ...form, group_id: e.target.value })} /></FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={createGuest.isPending || updateGuest.isPending}><Save className="mr-2 h-4 w-4" /> {editing ? "Update" : "Create"}</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
