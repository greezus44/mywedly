import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, Toggle } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { generateToken } from "../../lib/utils";
import { Users, Plus, Pencil, Trash2, Search, Mail, Phone } from "lucide-react";

export function GuestsPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: wedding, isLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: guests, isLoading: guestsLoading } = useQuery({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  const createGuest = useMutation({
    mutationFn: async (guest: Omit<Guest, "id" | "created_at">) => {
      const { error } = await supabase.from("guests").insert(guest);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guests"] }); setToast("Guest added"); setShowModal(false); },
  });

  const updateGuest = useMutation({
    mutationFn: async ({ id, ...guest }: Partial<Guest> & { id: string }) => {
      const { error } = await supabase.from("guests").update(guest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guests"] }); setToast("Guest updated"); setShowModal(false); },
  });

  const deleteGuest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guests"] }); setToast("Guest deleted"); },
  });

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Loading...</div></div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="p-6 text-gray-500">Wedding not found</div></AdminLayout>;

  const filteredGuests = (guests || []).filter((g) => {
    const q = search.toLowerCase();
    return g.full_name.toLowerCase().includes(q) || (g.email || "").toLowerCase().includes(q) || (g.phone || "").toLowerCase().includes(q) || g.username.toLowerCase().includes(q) || (g.group_label || "").toLowerCase().includes(q);
  });

  const handleAdd = () => { setEditingGuest(null); setShowModal(true); };
  const handleEdit = (guest: Guest) => { setEditingGuest(guest); setShowModal(true); };

  const handleSave = (formData: Record<string, string>) => {
    const guestData = {
      wedding_id: wedding.id,
      full_name: formData.full_name || "",
      email: formData.email || null,
      phone: formData.phone || null,
      group_label: formData.group_label || null,
      tag: formData.tag || null,
      plus_one_allowed: formData.plus_one_allowed === "true",
      address: formData.address || null,
      notes: formData.notes || null,
      invite_code: formData.invite_code || generateToken().slice(0, 8).toUpperCase(),
      username: formData.username || formData.full_name.toLowerCase().replace(/\s+/g, "."),
      rsvp_status: formData.rsvp_status || "pending",
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      dietary_requirements: formData.dietary_requirements || null,
    };

    if (editingGuest) {
      updateGuest.mutate({ id: editingGuest.id, ...guestData });
    } else {
      createGuest.mutate(guestData as any);
    }
  };

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-indigo-600" />
              <h1 className="font-ui text-xl font-bold text-gray-900">Guests</h1>
              {guests && <Badge variant="default">{guests.length} total</Badge>}
            </div>
            <Button variant="primary" size="sm" onClick={handleAdd}><Plus size={14} className="mr-1" /> Add Guest</Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, phone, username, or group..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg font-ui text-sm text-gray-700 focus:outline-none focus:border-indigo-400" />
          </div>

          {guestsLoading ? (
            <div className="text-center py-8 text-gray-400 font-ui text-sm">Loading guests...</div>
          ) : filteredGuests.length > 0 ? (
            <div className="space-y-3">
              {filteredGuests.map((guest) => (
                <Card key={guest.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-ui text-sm font-semibold text-gray-900 truncate">{guest.full_name}</h3>
                        <Badge variant={guest.rsvp_status === "accepted" ? "success" : guest.rsvp_status === "declined" ? "error" : guest.rsvp_status === "tentative" ? "warning" : "default"}>{guest.rsvp_status}</Badge>
                        {guest.plus_one_allowed && <Badge variant="default">+1</Badge>}
                      </div>
                      <div className="flex items-center gap-4 flex-wrap font-ui text-xs text-gray-500">
                        <span className="font-mono">@{guest.username}</span>
                        {guest.email && <span className="flex items-center gap-1"><Mail size={11} />{guest.email}</span>}
                        {guest.phone && <span className="flex items-center gap-1"><Phone size={11} />{guest.phone}</span>}
                        {guest.group_label && <Badge variant="default">{guest.group_label}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => handleEdit(guest)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Pencil size={14} className="text-gray-500" /></button>
                      <button onClick={() => { if (confirm("Delete this guest?")) deleteGuest.mutate(guest.id); }} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} className="text-red-500" /></button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Users size={48} />} title={search ? "No guests found" : "No guests yet"} description={search ? "Try a different search term." : "Add guests to your wedding invitation list."} action={!search ? <Button variant="primary" size="sm" onClick={handleAdd}><Plus size={14} className="mr-1" /> Add Guest</Button> : undefined} />
          )}
        </div>
      </div>

      {showModal && <GuestModal guest={editingGuest} onClose={() => setShowModal(false)} onSave={handleSave} />}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}

function GuestModal({ guest, onClose, onSave }: { guest: Guest | null; onClose: () => void; onSave: (data: Record<string, string>) => void }) {
  const [form, setForm] = useState<Record<string, string>>({
    full_name: guest?.full_name || "",
    first_name: guest?.first_name || "",
    last_name: guest?.last_name || "",
    email: guest?.email || "",
    phone: guest?.phone || "",
    username: guest?.username || "",
    group_label: guest?.group_label || "",
    tag: guest?.tag || "",
    plus_one_allowed: String(guest?.plus_one_allowed ?? false),
    address: guest?.address || "",
    notes: guest?.notes || "",
    invite_code: guest?.invite_code || "",
    rsvp_status: guest?.rsvp_status || "pending",
    dietary_requirements: guest?.dietary_requirements || "",
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal open onClose={onClose} title={guest ? "Edit Guest" : "Add Guest"} maxWidth="max-w-xl">
      <div className="space-y-4">
        <FormField label="Full Name"><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Guest full name" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name"><Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
          <FormField label="Last Name"><Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        </div>
        <FormField label="Username" hint="Used for guest sign-in"><Input value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="username" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
          <FormField label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+60 12 345 6789" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Group Label"><Input value={form.group_label} onChange={(e) => set("group_label", e.target.value)} placeholder="e.g. Family" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
          <FormField label="Tag"><Input value={form.tag} onChange={(e) => set("tag", e.target.value)} placeholder="e.g. VIP" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        </div>
        <FormField label="RSVP Status">
          <Select value={form.rsvp_status} onChange={(e) => set("rsvp_status", e.target.value)} className="!bg-white !border-gray-200 !text-gray-700">
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="tentative">Tentative</option>
          </Select>
        </FormField>
        <div className="flex items-center gap-3">
          <Toggle checked={form.plus_one_allowed === "true"} onChange={(v) => set("plus_one_allowed", String(v))} />
          <span className="font-ui text-sm text-gray-700">Plus one allowed</span>
        </div>
        <FormField label="Address"><Textarea value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Mailing address" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <FormField label="Dietary Requirements"><Input value={form.dietary_requirements} onChange={(e) => set("dietary_requirements", e.target.value)} placeholder="e.g. Vegetarian, Halal" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <FormField label="Invite Code" hint="Auto-generated if left blank"><Input value={form.invite_code} onChange={(e) => set("invite_code", e.target.value)} placeholder="Auto-generated" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <FormField label="Notes"><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Internal notes" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="outline" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" onClick={() => onSave(form)}>{guest ? "Update" : "Add"} Guest</Button>
        </div>
      </div>
    </Modal>
  );
}
