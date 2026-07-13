import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle } from "../../components/ui/Input";
import { FormField } from "../../components/ui/ImageUpload";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { formatDate, cn } from "../../lib/utils";
import { Plus, Pencil, Trash2, Search, Users, RefreshCw, Copy, Mail, Phone } from "lucide-react";

const emptyForm = {
  full_name: "",
  username: "",
  email: "",
  phone: "",
  group_label: "",
  plus_one_allowed: false,
  invite_code: "",
};

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function GuestsPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [form, setForm] = useState(emptyForm);

  const weddingQuery = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const wedding = weddingQuery.data;

  const guestsQuery = useQuery({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  const guests = guestsQuery.data || [];
  const filteredGuests = guests.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.full_name.toLowerCase().includes(q) ||
      g.username.toLowerCase().includes(q) ||
      (g.email || "").toLowerCase().includes(q) ||
      (g.group_label || "").toLowerCase().includes(q) ||
      g.invite_code.toLowerCase().includes(q)
    );
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof emptyForm) => {
      if (!wedding) throw new Error("No wedding");
      const { data, error } = await supabase
        .from("guests")
        .insert({
          wedding_id: wedding.id,
          full_name: values.full_name,
          username: values.username,
          email: values.email || null,
          phone: values.phone || null,
          group_label: values.group_label || null,
          plus_one_allowed: values.plus_one_allowed,
          invite_code: values.invite_code || generateInviteCode(),
          rsvp_status: "pending",
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as Guest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setModalOpen(false);
      setToast({ message: "Guest added", type: "success" });
    },
    onError: () => setToast({ message: "Failed to add guest", type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: typeof emptyForm }) => {
      const { data, error } = await supabase
        .from("guests")
        .update({
          full_name: values.full_name,
          username: values.username,
          email: values.email || null,
          phone: values.phone || null,
          group_label: values.group_label || null,
          plus_one_allowed: values.plus_one_allowed,
          invite_code: values.invite_code,
        })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Guest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setModalOpen(false);
      setToast({ message: "Guest updated", type: "success" });
    },
    onError: () => setToast({ message: "Failed to update guest", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setToast({ message: "Guest deleted", type: "success" });
    },
    onError: () => setToast({ message: "Failed to delete guest", type: "error" }),
  });

  const openCreate = () => {
    setEditingGuest(null);
    setForm({ ...emptyForm, invite_code: generateInviteCode() });
    setModalOpen(true);
  };

  const openEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setForm({
      full_name: guest.full_name,
      username: guest.username,
      email: guest.email || "",
      phone: guest.phone || "",
      group_label: guest.group_label || "",
      plus_one_allowed: guest.plus_one_allowed,
      invite_code: guest.invite_code,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGuest) {
      updateMutation.mutate({ id: editingGuest.id, values: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setToast({ message: "Invite code copied", type: "success" });
  };

  if (weddingQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-20">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary)]" />
        </div>
      </AdminLayout>
    );
  }

  if (weddingQuery.isError || !wedding) {
    return (
      <AdminLayout>
        <div className="p-8">
          <EmptyState title="Unable to load guests" description="Please try again later." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--color-bg)]">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="font-heading text-2xl text-[var(--color-text)] mb-1">Guests</h1>
              <p className="font-ui text-sm text-[var(--color-text-muted)]">{guests.length} guest{guests.length !== 1 ? "s" : ""}</p>
            </div>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={14} className="mr-1" /> Add Guest
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username, email, group, or invite code..."
              className="pl-10"
            />
          </div>

          {/* Table */}
          {guestsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw size={20} className="animate-spin text-[var(--color-primary)]" />
            </div>
          ) : filteredGuests.length === 0 ? (
            <Card className="p-8">
              <EmptyState
                icon={<Users size={32} />}
                title={search ? "No guests found" : "No guests yet"}
                description={search ? "Try a different search term." : "Add your first guest to get started."}
                action={!search && <Button variant="outline" size="sm" onClick={openCreate}><Plus size={14} className="mr-1" /> Add Guest</Button>}
              />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]/15 bg-[var(--color-bg)]/50">
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Name</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)] hidden md:table-cell">Username</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)] hidden lg:table-cell">Group</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)] hidden lg:table-cell">Invite Code</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">RSVP</th>
                      <th className="text-right px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuests.map((guest) => (
                      <tr key={guest.id} className="border-b border-[var(--color-border)]/10 last:border-0 hover:bg-[var(--color-bg)]/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-ui text-sm text-[var(--color-text)]">{guest.full_name}</div>
                          {guest.email && (
                            <div className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                              <Mail size={10} /> {guest.email}
                            </div>
                          )}
                          {guest.phone && (
                            <div className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                              <Phone size={10} /> {guest.phone}
                            </div>
                          )}
                          {guest.plus_one_allowed && (
                            <Badge variant="default">+1 Allowed</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="font-ui text-sm text-[var(--color-text-muted)]">{guest.username}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {guest.group_label ? (
                            <Badge variant="default">{guest.group_label}</Badge>
                          ) : (
                            <span className="font-ui text-xs text-[var(--color-text-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <button
                            onClick={() => copyInviteCode(guest.invite_code)}
                            className="inline-flex items-center gap-1.5 font-ui text-xs text-[var(--color-primary)] hover:underline"
                          >
                            {guest.invite_code}
                            <Copy size={12} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              guest.rsvp_status === "accepted" ? "success" :
                              guest.rsvp_status === "declined" ? "error" :
                              guest.rsvp_status === "tentative" ? "warning" : "default"
                            }
                          >
                            {guest.rsvp_status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button onClick={() => openEdit(guest)} className="p-2 hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors">
                              <Pencil size={14} className="text-[var(--color-primary)]" />
                            </button>
                            <button
                              onClick={() => { if (confirm(`Delete ${guest.full_name}?`)) deleteMutation.mutate(guest.id); }}
                              className="p-2 hover:bg-[var(--color-error)]/10 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} className="text-[var(--color-error)]" />
                            </button>
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
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingGuest ? "Edit Guest" : "Add Guest"} maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Full Name">
            <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="John Doe" required />
          </FormField>

          <FormField label="Username" hint="Used for guest login">
            <Input value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="johndoe" required />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email">
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com" />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+60 12-345 6789" />
            </FormField>
          </div>

          <FormField label="Group Label">
            <Input value={form.group_label} onChange={(e) => update("group_label", e.target.value)} placeholder="Family / Friends / Colleagues" />
          </FormField>

          <FormField label="Invite Code" hint="Auto-generated, editable">
            <div className="flex gap-2">
              <Input value={form.invite_code} onChange={(e) => update("invite_code", e.target.value)} placeholder="ABC12345" />
              <Button type="button" variant="ghost" size="sm" onClick={() => update("invite_code", generateInviteCode())}>
                <RefreshCw size={14} />
              </Button>
            </div>
          </FormField>

          <div className="flex items-center justify-between py-3 px-4 bg-[var(--color-bg)] rounded-lg">
            <div>
              <Label className="mb-0">Plus One Allowed</Label>
              <p className="font-ui text-xs text-[var(--color-text-muted)] mt-1">Allow this guest to bring a plus one</p>
            </div>
            <Toggle checked={form.plus_one_allowed} onChange={(v) => update("plus_one_allowed", v)} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingGuest ? "Update Guest" : "Add Guest"}
            </Button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
