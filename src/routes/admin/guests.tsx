import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, Toggle } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";

const EMPTY_GUEST: Partial<Guest> = {
  full_name: "", email: "", phone: "", group_label: "", tag: "", plus_one_allowed: false,
  address: "", notes: "", username: "", first_name: "", last_name: "", rsvp_status: "pending",
};

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "error"> = {
  pending: "warning", accepted: "success", declined: "error", tentative: "default",
};

export function GuestsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<Guest> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading: wLoading, error: wError } = useQuery<Wedding>({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: guests = [], isLoading: gLoading } = useQuery<Guest[]>({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  const createMutation = useMutation({
    mutationFn: async (g: Partial<Guest>) => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("guests").insert({ ...g, wedding_id: wedding.id });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guests", wedding?.id] }); setToast({ message: "Guest created", type: "success" }); setModalOpen(false); },
    onError: () => setToast({ message: "Failed to create guest", type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...g }: Partial<Guest> & { id: string }) => {
      const { error } = await supabase.from("guests").update(g).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guests", wedding?.id] }); setToast({ message: "Guest updated", type: "success" }); setModalOpen(false); },
    onError: () => setToast({ message: "Failed to update guest", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guests", wedding?.id] }); setToast({ message: "Guest deleted", type: "success" }); },
    onError: () => setToast({ message: "Failed to delete guest", type: "error" }),
  });

  const openCreate = () => { setEditing({ ...EMPTY_GUEST }); setModalOpen(true); };
  const openEdit = (g: Guest) => { setEditing({ ...g }); setModalOpen(true); };
  const handleSave = () => {
    if (!editing) return;
    if (editing.id) updateMutation.mutate(editing as Guest);
    else createMutation.mutate(editing);
  };

  const filtered = guests.filter((g) => {
    const q = search.toLowerCase();
    return !q || g.full_name.toLowerCase().includes(q) || (g.email || "").toLowerCase().includes(q) || (g.username || "").toLowerCase().includes(q) || (g.group_label || "").toLowerCase().includes(q);
  });

  if (wLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-gray-500">Loading guests...</p>
        </div>
      </AdminLayout>
    );
  }

  if (wError || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-ui text-xl font-bold text-gray-900">Guests</h1>
            <p className="font-ui text-sm text-gray-500 mt-1">{guests.length} total guests</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-ui text-xs font-medium uppercase tracking-wider rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={14} /> Add Guest
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, username, or group..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg font-ui text-sm text-gray-700 focus:outline-none focus:border-indigo-400"
          />
        </div>

        {gLoading ? (
          <p className="font-ui text-sm text-gray-500">Loading guests...</p>
        ) : filtered.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={<Users size={40} />}
              title={search ? "No guests found" : "No guests yet"}
              description={search ? "Try a different search term." : "Add your first guest to start managing invitations."}
              action={!search ? <Button variant="outline" size="sm" onClick={openCreate}><Plus size={14} className="mr-1.5" /> Add Guest</Button> : undefined}
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((guest) => (
              <Card key={guest.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-ui text-sm font-semibold text-gray-900 truncate">{guest.full_name}</h3>
                      <Badge variant={STATUS_VARIANTS[guest.rsvp_status] || "default"}>{guest.rsvp_status}</Badge>
                      {guest.plus_one_allowed && <Badge variant="default">+1</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <p className="font-ui text-xs text-gray-500">@{guest.username}</p>
                      {guest.email && <p className="font-ui text-xs text-gray-500">{guest.email}</p>}
                      {guest.phone && <p className="font-ui text-xs text-gray-500">{guest.phone}</p>}
                      {guest.group_label && <p className="font-ui text-xs text-gray-500">Group: {guest.group_label}</p>}
                    </div>
                    {guest.tag && <p className="font-ui text-xs text-indigo-600 mt-1">Tag: {guest.tag}</p>}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => openEdit(guest)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => deleteMutation.mutate(guest.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing?.id ? "Edit Guest" : "New Guest"} maxWidth="max-w-xl">
        {editing && (
          <div className="space-y-4">
            <FormField label="Full Name">
              <Input value={editing.full_name || ""} onChange={(e) => setEditing((p) => ({ ...p, full_name: e.target.value }))} placeholder="John Doe" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="First Name">
                <Input value={editing.first_name || ""} onChange={(e) => setEditing((p) => ({ ...p, first_name: e.target.value }))} placeholder="John" />
              </FormField>
              <FormField label="Last Name">
                <Input value={editing.last_name || ""} onChange={(e) => setEditing((p) => ({ ...p, last_name: e.target.value }))} placeholder="Doe" />
              </FormField>
            </div>
            <FormField label="Username" hint="Used for guest sign-in">
              <Input value={editing.username || ""} onChange={(e) => setEditing((p) => ({ ...p, username: e.target.value }))} placeholder="johndoe" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Email">
                <Input type="email" value={editing.email || ""} onChange={(e) => setEditing((p) => ({ ...p, email: e.target.value }))} placeholder="john@example.com" />
              </FormField>
              <FormField label="Phone">
                <Input value={editing.phone || ""} onChange={(e) => setEditing((p) => ({ ...p, phone: e.target.value }))} placeholder="+60 12 345 6789" />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Group Label">
                <Input value={editing.group_label || ""} onChange={(e) => setEditing((p) => ({ ...p, group_label: e.target.value }))} placeholder="Family" />
              </FormField>
              <FormField label="Tag">
                <Input value={editing.tag || ""} onChange={(e) => setEditing((p) => ({ ...p, tag: e.target.value }))} placeholder="VIP" />
              </FormField>
            </div>
            <FormField label="Address">
              <Textarea value={editing.address || ""} onChange={(e) => setEditing((p) => ({ ...p, address: e.target.value }))} placeholder="Guest address" />
            </FormField>
            <FormField label="Notes">
              <Textarea value={editing.notes || ""} onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))} placeholder="Internal notes" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="RSVP Status">
                <Select value={editing.rsvp_status || "pending"} onChange={(e) => setEditing((p) => ({ ...p, rsvp_status: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="declined">Declined</option>
                  <option value="tentative">Tentative</option>
                </Select>
              </FormField>
              <FormField label="Plus One Allowed">
                <div className="pt-2"><Toggle checked={editing.plus_one_allowed ?? false} onChange={(v) => setEditing((p) => ({ ...p, plus_one_allowed: v }))} /></div>
              </FormField>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white font-ui text-xs font-medium uppercase tracking-wider rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {editing.id ? "Update" : "Create"}
              </button>
            </div>
          </div>
        )}
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
