import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { generateToken } from "../../lib/utils";
import { Plus, Pencil, Trash2, Search, Users, Save, Mail, Phone } from "lucide-react";

interface GuestForm {
  name: string;
  username: string;
  email: string;
  phone: string;
  group_id: string;
}

const emptyForm: GuestForm = { name: "", username: "", email: "", phone: "", group_id: "" };

export function GuestsPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestForm>(emptyForm);
  const [toast, setToast] = useState<string | null>(null);
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
    queryKey: ["guests"],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("guests").insert({
        wedding_id: wedding.id,
        name: form.name,
        username: form.username || generateToken().slice(0, 8),
        email: form.email || null,
        phone: form.phone || null,
        group_id: form.group_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guests"] });
      setModalOpen(false);
      setForm(emptyForm);
      setToast("Guest added");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No guest selected");
      const { error } = await supabase.from("guests").update({
        name: form.name,
        username: form.username,
        email: form.email || null,
        phone: form.phone || null,
        group_id: form.group_id || null,
      }).eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guests"] });
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setToast("Guest updated");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guests"] });
      setToast("Guest deleted");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, username: generateToken().slice(0, 8) });
    setModalOpen(true);
  };

  const openEdit = (guest: Guest) => {
    setEditingId(guest.id);
    setForm({
      name: guest.name,
      username: guest.username,
      email: guest.email || "",
      phone: guest.phone || "",
      group_id: guest.group_id || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) updateMutation.mutate();
    else createMutation.mutate();
  };

  const update = (patch: Partial<GuestForm>) => setForm({ ...form, ...patch });

  const filtered = (guests || []).filter((g) => {
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      (g.email || "").toLowerCase().includes(q) ||
      (g.phone || "").toLowerCase().includes(q) ||
      g.username.toLowerCase().includes(q) ||
      (g.group_id || "").toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Guests</h2>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Guest
        </Button>
      </div>

      <Card className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, username, or group..."
            className="pl-10"
          />
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading guests...</div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Username</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Phone</th>
                  <th className="pb-3 pr-4">Group</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((guest) => (
                  <tr key={guest.id} className="text-sm">
                    <td className="py-3 pr-4 font-medium text-gray-900">{guest.name}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="default">{guest.username}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {guest.email ? (
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {guest.email}</span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {guest.phone ? (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {guest.phone}</span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{guest.group_id || <span className="text-gray-400">—</span>}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(guest)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(guest.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Users className="h-10 w-10" />} title="No guests found" description={search ? "Try a different search term." : "Add your first guest to get started."} />
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Guest" : "Add Guest"}>
        <div className="space-y-4">
          <FormField label="Guest Name">
            <Input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Full name" />
          </FormField>
          <FormField label="Username" hint="Used for sign-in and QR code token">
            <Input value={form.username} onChange={(e) => update({ username: e.target.value })} placeholder="Auto-generated if empty" />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="guest@example.com" />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="+60 12 345 6789" />
          </FormField>
          <FormField label="Group">
            <Input value={form.group_id} onChange={(e) => update({ group_id: e.target.value })} placeholder="e.g. family, friends" />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || !form.name}>
              <Save className="mr-2 h-4 w-4" /> {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
