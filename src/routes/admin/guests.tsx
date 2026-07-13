import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Users, UserPlus, Copy } from "lucide-react";
import { supabase, type Wedding, type Guest } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { cn } from "../../lib/utils";

interface GuestForm {
  full_name: string;
  username: string;
  email: string;
  phone: string;
  group_label: string;
  plus_one_allowed: boolean;
  invite_code: string;
  notes: string;
}

const EMPTY_FORM: GuestForm = {
  full_name: "",
  username: "",
  email: "",
  phone: "",
  group_label: "",
  plus_one_allowed: false,
  invite_code: "",
  notes: "",
};

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function generateUsername(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) + Math.floor(Math.random() * 1000);
}

export function GuestsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [form, setForm] = useState<GuestForm>(EMPTY_FORM);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading: wLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: guests, isLoading: gLoading } = useQuery({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  const createMutation = useMutation({
    mutationFn: async (newGuest: Omit<Guest, "id" | "wedding_id" | "created_at" | "rsvp_status" | "first_name" | "last_name" | "address" | "tag" | "group_id" | "dietary_requirements">) => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("guests").insert({ ...newGuest, wedding_id: wedding.id, rsvp_status: "pending" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", wedding?.id] });
      setModalOpen(false);
      setToast({ message: "Guest added", type: "success" });
    },
    onError: () => setToast({ message: "Failed to add guest", type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Guest> }) => {
      const { error } = await supabase.from("guests").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", wedding?.id] });
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
      queryClient.invalidateQueries({ queryKey: ["guests", wedding?.id] });
      setToast({ message: "Guest removed", type: "success" });
    },
    onError: () => setToast({ message: "Failed to remove guest", type: "error" }),
  });

  const filteredGuests = (guests || []).filter((g) => {
    const q = search.toLowerCase();
    return (
      g.full_name.toLowerCase().includes(q) ||
      g.username.toLowerCase().includes(q) ||
      (g.email || "").toLowerCase().includes(q) ||
      (g.group_label || "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditingGuest(null);
    setForm(EMPTY_FORM);
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
      notes: guest.notes || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      full_name: form.full_name,
      username: form.username,
      email: form.email || null,
      phone: form.phone || null,
      group_label: form.group_label || null,
      plus_one_allowed: form.plus_one_allowed,
      invite_code: form.invite_code,
      notes: form.notes || null,
    };
    if (editingGuest) {
      updateMutation.mutate({ id: editingGuest.id, updates: payload });
    } else {
      createMutation.mutate(payload as Omit<Guest, "id" | "wedding_id" | "created_at" | "rsvp_status" | "first_name" | "last_name" | "address" | "tag" | "group_id" | "dietary_requirements">);
    }
  };

  const update = (key: keyof GuestForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setToast({ message: "Invite code copied", type: "success" });
  };

  if (wLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Wedding not found</p>
        </div>
      </AdminLayout>
    );
  }

  const loading = wLoading || gLoading;

  const rsvpBadgeVariant = (status: string): "default" | "success" | "warning" | "error" => {
    switch (status) {
      case "accepted": return "success";
      case "declined": return "error";
      case "pending": return "warning";
      default: return "default";
    }
  };

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="font-heading text-3xl text-[var(--color-text)] mb-1">Guests</h1>
              <p className="font-ui text-sm text-[var(--color-text-muted)]">
                {guests?.length || 0} total guests
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <UserPlus size={14} className="mr-1.5" />
              Add Guest
            </Button>
          </div>

          <div className="mb-6 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username, email, or group..."
              className="pl-11"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-5 w-40 bg-gray-100 rounded mb-2" />
                  <div className="h-4 w-60 bg-gray-100 rounded" />
                </Card>
              ))}
            </div>
          ) : filteredGuests.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]/15 bg-[var(--color-bg)]/50">
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">Name</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] hidden md:table-cell">Username</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] hidden lg:table-cell">Group</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] hidden lg:table-cell">RSVP</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] hidden xl:table-cell">Invite Code</th>
                      <th className="text-right px-4 py-3 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuests.map((guest) => (
                      <tr key={guest.id} className="border-b border-[var(--color-border)]/10 last:border-0 hover:bg-[var(--color-bg)]/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-ui text-sm text-[var(--color-text)]">{guest.full_name}</p>
                              {guest.email && <p className="font-ui text-xs text-[var(--color-text-muted)]">{guest.email}</p>}
                            </div>
                            {guest.plus_one_allowed && <Badge variant="default">+1</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="font-ui text-sm text-[var(--color-text-muted)]">@{guest.username}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {guest.group_label ? (
                            <Badge variant="default">{guest.group_label}</Badge>
                          ) : (
                            <span className="font-ui text-xs text-[var(--color-text-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <Badge variant={rsvpBadgeVariant(guest.rsvp_status)}>
                            {guest.rsvp_status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <button
                            onClick={() => copyInviteCode(guest.invite_code)}
                            className="inline-flex items-center gap-1.5 font-ui text-xs text-[var(--color-primary)] hover:underline"
                          >
                            {guest.invite_code}
                            <Copy size={11} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(guest)}
                              className="p-2 hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                            >
                              <Pencil size={14} className="text-[var(--color-primary)]" />
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate(guest.id)}
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
          ) : search ? (
            <EmptyState
              icon={<Search size={32} />}
              title="No guests found"
              description={`No guests match "${search}"`}
            />
          ) : (
            <EmptyState
              icon={<Users size={32} />}
              title="No guests yet"
              description="Add your first guest to start managing your invitation list"
              action={
                <Button variant="primary" size="sm" onClick={openCreate}>
                  <UserPlus size={14} className="mr-1.5" />
                  Add Guest
                </Button>
              }
            />
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingGuest ? "Edit Guest" : "Add Guest"} maxWidth="max-w-lg">
        <div className="space-y-4">
          <FormField label="Full Name">
            <Input
              value={form.full_name}
              onChange={(e) => {
                update("full_name", e.target.value);
                if (!editingGuest && !form.username) {
                  update("username", generateUsername(e.target.value));
                }
              }}
              placeholder="John Doe"
            />
          </FormField>

          <FormField label="Username" hint="Used by guests to sign in">
            <Input
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              placeholder="johndoe123"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email">
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com" />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+60 12 345 6789" />
            </FormField>
          </div>

          <FormField label="Group Label" hint="e.g. Family, Friends, Colleagues">
            <Input value={form.group_label} onChange={(e) => update("group_label", e.target.value)} placeholder="Family" />
          </FormField>

          <FormField label="Invite Code" hint="Unique code for this guest">
            <div className="flex gap-2">
              <Input value={form.invite_code} onChange={(e) => update("invite_code", e.target.value)} placeholder="ABC12345" />
              <Button
                variant="ghost"
                size="md"
                onClick={() => update("invite_code", generateInviteCode())}
                type="button"
              >
                Generate
              </Button>
            </div>
          </FormField>

          <div className="flex items-center justify-between py-2 border-t border-[var(--color-border)]/15">
            <div>
              <Label>Plus One Allowed</Label>
              <p className="font-ui text-xs text-[var(--color-text-muted)]">Allow this guest to bring a plus one</p>
            </div>
            <Toggle checked={form.plus_one_allowed} onChange={(v) => update("plus_one_allowed", v)} />
          </div>

          <FormField label="Notes" hint="Internal notes about this guest">
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Dietary restrictions, seating preferences..." />
          </FormField>

          <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]/15">
            <Button variant="ghost" size="md" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || !form.full_name || !form.username}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingGuest ? "Save Changes" : "Add Guest"}
            </Button>
          </div>
        </div>
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
