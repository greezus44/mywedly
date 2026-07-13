import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  Mail,
  Phone,
  Copy,
  X,
  UserPlus,
  Download,
} from "lucide-react";
import { supabase, type Wedding, type Guest } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle, Select } from "../../components/ui/Input";
import { FormField } from "../../components/ui/ImageUpload";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { cn } from "../../lib/utils";
import { useLang } from "../../lib/lang-context";

interface GuestFormData {
  full_name: string;
  username: string;
  email: string;
  phone: string;
  group_label: string;
  plus_one_allowed: boolean;
  invite_code: string;
  notes: string;
}

const EMPTY_FORM: GuestFormData = {
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
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 20);
}

export function GuestsPage() {
  const queryClient = useQueryClient();
  const { lang } = useLang();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<GuestFormData>(EMPTY_FORM);

  const { data: wedding, isLoading: weddingLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("created_by", user.user.id)
        .single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: guests = [], isLoading: guestsLoading } = useQuery({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Guest[];
    },
    enabled: !!wedding,
  });

  const groups = useMemo(() => {
    const set = new Set<string>();
    guests.forEach((g) => {
      if (g.group_label) set.add(g.group_label);
    });
    return Array.from(set).sort();
  }, [guests]);

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchesSearch =
        !search ||
        g.full_name.toLowerCase().includes(search.toLowerCase()) ||
        g.username.toLowerCase().includes(search.toLowerCase()) ||
        (g.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (g.invite_code || "").toLowerCase().includes(search.toLowerCase());
      const matchesGroup = !filterGroup || g.group_label === filterGroup;
      return matchesSearch && matchesGroup;
    });
  }, [guests, search, filterGroup]);

  const createMutation = useMutation({
    mutationFn: async (data: GuestFormData) => {
      if (!wedding) throw new Error("No wedding");
      const payload = {
        wedding_id: wedding.id,
        full_name: data.full_name,
        username: data.username || generateUsername(data.full_name),
        email: data.email || null,
        phone: data.phone || null,
        group_label: data.group_label || null,
        plus_one_allowed: data.plus_one_allowed,
        invite_code: data.invite_code || generateInviteCode(),
        notes: data.notes || null,
        rsvp_status: "pending",
      };
      const { error } = await supabase.from("guests").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setToast({ message: "Guest added!", type: "success" });
      setShowForm(false);
      setFormData(EMPTY_FORM);
    },
    onError: () => setToast({ message: "Failed to add guest", type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: GuestFormData }) => {
      const payload = {
        full_name: data.full_name,
        username: data.username,
        email: data.email || null,
        phone: data.phone || null,
        group_label: data.group_label || null,
        plus_one_allowed: data.plus_one_allowed,
        invite_code: data.invite_code,
        notes: data.notes || null,
      };
      const { error } = await supabase.from("guests").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setToast({ message: "Guest updated!", type: "success" });
      setShowForm(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
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
      setToast({ message: "Guest removed", type: "success" });
    },
    onError: () => setToast({ message: "Failed to remove guest", type: "error" }),
  });

  const handleEdit = (guest: Guest) => {
    setEditingId(guest.id);
    setFormData({
      full_name: guest.full_name,
      username: guest.username,
      email: guest.email || "",
      phone: guest.phone || "",
      group_label: guest.group_label || "",
      plus_one_allowed: guest.plus_one_allowed,
      invite_code: guest.invite_code,
      notes: guest.notes || "",
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      ...EMPTY_FORM,
      invite_code: generateInviteCode(),
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.full_name.trim()) {
      setToast({ message: "Full name is required", type: "error" });
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this guest?")) {
      deleteMutation.mutate(id);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setToast({ message: "Invite code copied!", type: "success" });
  };

  const isLoading = weddingLoading || guestsLoading;

  if (isLoading || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading guests...</p>
        </div>
      </AdminLayout>
    );
  }

  const rsvpStats = {
    total: guests.length,
    accepted: guests.filter((g) => g.rsvp_status === "accepted").length,
    declined: guests.filter((g) => g.rsvp_status === "declined").length,
    pending: guests.filter((g) => g.rsvp_status === "pending").length,
  };

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-primary)] mb-2">
                Guests
              </p>
              <h1 className="font-heading text-3xl text-[var(--color-text)]">Guest Manager</h1>
              <p className="font-ui text-sm text-[var(--color-text-muted)] mt-1">
                {guests.length} {guests.length === 1 ? "guest" : "guests"} on the list
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleAdd}>
              <UserPlus size={14} className="mr-1.5" /> Add Guest
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <Card className="p-4 text-center">
              <p className="font-heading text-2xl text-[var(--color-text)]">{rsvpStats.total}</p>
              <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Total</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="font-heading text-2xl text-[var(--color-success)]">{rsvpStats.accepted}</p>
              <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Accepted</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="font-heading text-2xl text-[var(--color-error)]">{rsvpStats.declined}</p>
              <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Declined</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="font-heading text-2xl text-[var(--color-warning)]">{rsvpStats.pending}</p>
              <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Pending</p>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, username, email, or invite code..."
                className="pl-10"
              />
            </div>
            <Select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="w-48"
            >
              <option value="">All Groups</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>

          {/* Guest List */}
          {filteredGuests.length === 0 ? (
            <EmptyState
              icon={<Users size={32} />}
              title={search || filterGroup ? "No guests found" : "No guests yet"}
              description={
                search || filterGroup
                  ? "Try adjusting your search or filters."
                  : "Add guests to your wedding to start sending invitations."
              }
              action={
                !search && !filterGroup ? (
                  <Button variant="primary" size="sm" onClick={handleAdd}>
                    <UserPlus size={14} className="mr-1.5" /> Add Guest
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Card className="overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]/15">
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        Username
                      </th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        Contact
                      </th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        Group
                      </th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        RSVP
                      </th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        Invite Code
                      </th>
                      <th className="text-right px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuests.map((guest) => (
                      <tr
                        key={guest.id}
                        className="border-b border-[var(--color-border)]/10 hover:bg-[var(--color-bg-light)] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-ui text-sm font-medium text-[var(--color-text)]">
                                {guest.full_name}
                              </p>
                              {guest.plus_one_allowed && (
                                <span className="font-ui text-xs text-[var(--color-text-muted)]">
                                  +1 allowed
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-ui text-sm text-[var(--color-text-muted)]">
                            {guest.username}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {guest.email && (
                              <p className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                                <Mail size={11} /> {guest.email}
                              </p>
                            )}
                            {guest.phone && (
                              <p className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                                <Phone size={11} /> {guest.phone}
                              </p>
                            )}
                            {!guest.email && !guest.phone && (
                              <span className="font-ui text-xs text-[var(--color-text-muted)]">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {guest.group_label ? (
                            <Badge>{guest.group_label}</Badge>
                          ) : (
                            <span className="font-ui text-xs text-[var(--color-text-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {guest.rsvp_status === "accepted" && <Badge variant="success">Accepted</Badge>}
                          {guest.rsvp_status === "declined" && <Badge variant="error">Declined</Badge>}
                          {guest.rsvp_status === "pending" && <Badge variant="warning">Pending</Badge>}
                          {guest.rsvp_status === "tentative" && <Badge>Tentative</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => copyInviteCode(guest.invite_code)}
                            className="font-ui text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
                          >
                            {guest.invite_code}
                            <Copy size={11} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(guest)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(guest.id)}
                              className="p-2 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-[var(--color-border)]/10">
                {filteredGuests.map((guest) => (
                  <div key={guest.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-ui text-sm font-medium text-[var(--color-text)]">
                          {guest.full_name}
                        </p>
                        <p className="font-ui text-xs text-[var(--color-text-muted)]">@{guest.username}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(guest)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-[var(--color-text-muted)]"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(guest.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {guest.rsvp_status === "accepted" && <Badge variant="success">Accepted</Badge>}
                      {guest.rsvp_status === "declined" && <Badge variant="error">Declined</Badge>}
                      {guest.rsvp_status === "pending" && <Badge variant="warning">Pending</Badge>}
                      {guest.rsvp_status === "tentative" && <Badge>Tentative</Badge>}
                      {guest.group_label && <Badge>{guest.group_label}</Badge>}
                      <button
                        onClick={() => copyInviteCode(guest.invite_code)}
                        className="font-ui text-xs text-[var(--color-primary)] flex items-center gap-1"
                      >
                        {guest.invite_code} <Copy size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Guest Form Modal */}
      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
          setFormData(EMPTY_FORM);
        }}
        title={editingId ? "Edit Guest" : "Add Guest"}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <FormField label="Full Name" hint="As it should appear on the invitation">
            <Input
              value={formData.full_name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData({
                  ...formData,
                  full_name: name,
                  username: formData.username || generateUsername(name),
                });
              }}
              placeholder="Jane Doe"
            />
          </FormField>

          <FormField label="Username" hint="Used for guest login">
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="jane_doe"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email">
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jane@example.com"
              />
            </FormField>
            <FormField label="Phone">
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+60 12-345 6789"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Group Label" hint="e.g. Family, Friends, Colleagues">
              <Input
                value={formData.group_label}
                onChange={(e) => setFormData({ ...formData, group_label: e.target.value })}
                placeholder="Family"
              />
            </FormField>
            <FormField label="Invite Code" hint="Unique code for this guest">
              <div className="flex gap-2">
                <Input
                  value={formData.invite_code}
                  onChange={(e) => setFormData({ ...formData, invite_code: e.target.value })}
                  placeholder="ABC12345"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, invite_code: generateInviteCode() })}
                  className="flex-shrink-0"
                >
                  <Download size={14} />
                </Button>
              </div>
            </FormField>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)]/15">
            <div>
              <p className="font-ui text-sm text-[var(--color-text)]">Plus One Allowed</p>
              <p className="font-ui text-xs text-[var(--color-text-muted)]">
                Allow this guest to bring a companion
              </p>
            </div>
            <Toggle
              checked={formData.plus_one_allowed}
              onChange={(v) => setFormData({ ...formData, plus_one_allowed: v })}
            />
          </div>

          <FormField label="Notes" hint="Internal notes about this guest">
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Dietary restrictions, seating preferences, etc."
              className="min-h-[80px]"
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData(EMPTY_FORM);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingId
                ? "Update Guest"
                : "Add Guest"}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
