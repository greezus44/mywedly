import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState } from "../../components/ui/index";
import { generateToken } from "../../lib/utils";
import { Plus, Pencil, Trash2, Search, Users, Mail, Phone } from "lucide-react";

export function GuestsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [form, setForm] = useState<{ name: string; username: string; email: string; phone: string }>({ name: "", username: "", email: "", phone: "" });
  const [toast, setToast] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: wedding } = useQuery({
    queryKey: ["wedding", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.id).maybeSingle();
      return data as Wedding | null;
    },
    enabled: !!user,
  });

  const { data: guests, isLoading } = useQuery({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  useEffect(() => {
    if (editingGuest) {
      setForm({ name: editingGuest.name, username: editingGuest.username, email: editingGuest.email || "", phone: editingGuest.phone || "" });
    } else {
      setForm({ name: "", username: generateToken().slice(0, 8), email: "", phone: "" });
    }
  }, [editingGuest]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("guests").insert({
        wedding_id: wedding.id,
        name: form.name,
        username: form.username,
        email: form.email || null,
        phone: form.phone || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", wedding?.id] });
      setModalOpen(false);
      setEditingGuest(null);
      setToast("Guest added");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingGuest) throw new Error("No guest");
      const { error } = await supabase.from("guests").update({
        name: form.name,
        username: form.username,
        email: form.email || null,
        phone: form.phone || null,
      }).eq("id", editingGuest.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", wedding?.id] });
      setModalOpen(false);
      setEditingGuest(null);
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
      queryClient.invalidateQueries({ queryKey: ["guests", wedding?.id] });
      setToast("Guest removed");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const handleSubmit = () => {
    if (editingGuest) updateMutation.mutate();
    else createMutation.mutate();
  };

  const filteredGuests = (guests || []).filter((g) => {
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.username.toLowerCase().includes(q) || (g.email || "").toLowerCase().includes(q);
  });

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading guests...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guests</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your guest list and invitation access.</p>
          </div>
          <Button onClick={() => { setEditingGuest(null); setModalOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Guest
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, or email..."
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <Users className="h-5 w-5 text-gray-900" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Guests</p>
                <p className="text-xl font-bold text-gray-900">{guests?.length || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Guest List */}
        {isLoading ? (
          <div className="text-gray-500">Loading guests...</div>
        ) : filteredGuests.length === 0 ? (
          <Card>
            <EmptyState icon={<Users className="h-8 w-8" />} title={search ? "No guests found" : "No guests yet"} description={search ? "Try a different search." : "Add your first guest to get started."} />
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredGuests.map((guest) => (
              <Card key={guest.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{guest.name}</h3>
                      <Badge variant="default">@{guest.username}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
                      {guest.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {guest.email}</span>}
                      {guest.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {guest.phone}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingGuest(guest); setModalOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(guest.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingGuest ? "Edit Guest" : "Add Guest"}>
          <div className="space-y-4">
            <Input
              label="Guest Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ahmad bin Ali"
            />
            <Input
              label="Username (for sign-in)"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="ahmad"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="ahmad@example.com"
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+60 12 345 6789"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingGuest ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </Modal>

        {toast && (
          <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
