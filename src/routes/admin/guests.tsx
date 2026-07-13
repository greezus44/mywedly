import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Select, Toggle } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { formatDate } from "../../lib/utils";
import { Plus, Pencil, Trash2, Search, Users, Mail, Phone, Download, Save } from "lucide-react";

const emptyGuest = (weddingId: string): Omit<Guest, "id" | "created_at"> => ({
  wedding_id: weddingId,
  full_name: "",
  email: null,
  phone: null,
  group_label: null,
  tag: null,
  plus_one_allowed: false,
  address: null,
  notes: null,
  invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
  group_id: null,
  username: "",
  first_name: null,
  last_name: null,
  rsvp_status: "pending",
  dietary_requirements: null,
});

export function GuestsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading: weddingLoading, error: weddingError } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
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

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Guest, "id" | "created_at">) => {
      const { error } = await supabase.from("guests").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setToast({ message: "Guest added", type: "success" });
      setIsModalOpen(false);
    },
    onError: (err) => setToast({ message: err.message || "Failed to add guest", type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Guest> }) => {
      const { error } = await supabase.from("guests").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setToast({ message: "Guest updated", type: "success" });
      setIsModalOpen(false);
    },
    onError: (err) => setToast({ message: err.message || "Failed to update guest", type: "error" }),
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
    onError: (err) => setToast({ message: err.message || "Failed to delete guest", type: "error" }),
  });

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchesSearch =
        !search ||
        g.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (g.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (g.invite_code || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || g.rsvp_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [guests, search, statusFilter]);

  const stats = useMemo(() => ({
    total: guests.length,
    accepted: guests.filter((g) => g.rsvp_status === "accepted").length,
    pending: guests.filter((g) => g.rsvp_status === "pending").length,
    declined: guests.filter((g) => g.rsvp_status === "declined").length,
  }), [guests]);

  const handleAdd = () => {
    if (!wedding) return;
    setEditingGuest(null);
    setIsModalOpen(true);
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this guest? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Full Name", "Email", "Phone", "Invite Code", "RSVP Status", "Group", "Plus One"].join(","),
      ...filteredGuests.map((g) =>
        [g.full_name, g.email || "", g.phone || "", g.invite_code, g.rsvp_status, g.group_label || "", g.plus_one_allowed ? "Yes" : "No"]
          .map((v) => `"${v}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guests.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (weddingLoading || guestsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="font-ui text-sm text-gray-400">Loading guests...</div>
        </div>
      </AdminLayout>
    );
  }

  if (weddingError || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="font-heading text-2xl text-[var(--color-text)]">Guests</h1>
              <p className="font-ui text-sm text-[var(--color-text-muted)]">{stats.total} total · {stats.accepted} accepted · {stats.pending} pending</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredGuests.length === 0}>
                <Download size={14} className="mr-1.5" />
                Export
              </Button>
              <Button variant="primary" size="sm" onClick={handleAdd}>
                <Plus size={14} className="mr-1.5" />
                Add Guest
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or invite code..."
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="tentative">Tentative</option>
            </Select>
          </div>

          {/* Guest list */}
          {filteredGuests.length === 0 ? (
            <Card className="p-0">
              <EmptyState
                icon={<Users size={32} />}
                title={search || statusFilter !== "all" ? "No guests found" : "No guests yet"}
                description={search || statusFilter !== "all" ? "Try adjusting your filters" : "Add your first guest to start managing your guest list."}
                action={!search && statusFilter === "all" ? <Button variant="primary" size="sm" onClick={handleAdd}><Plus size={14} className="mr-1.5" />Add Guest</Button> : undefined}
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredGuests.map((guest) => (
                <Card key={guest.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-heading text-sm text-[var(--color-primary)]">
                          {guest.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-heading text-base text-[var(--color-text)] truncate">{guest.full_name}</h3>
                          <Badge variant={
                            guest.rsvp_status === "accepted" ? "success" :
                            guest.rsvp_status === "declined" ? "error" :
                            guest.rsvp_status === "tentative" ? "warning" : "default"
                          }>
                            {guest.rsvp_status}
                          </Badge>
                          {guest.plus_one_allowed && <Badge variant="default">+1</Badge>}
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          {guest.email && (
                            <span className="flex items-center gap-1 font-ui text-xs text-[var(--color-text-muted)]">
                              <Mail size={12} /> {guest.email}
                            </span>
                          )}
                          {guest.phone && (
                            <span className="flex items-center gap-1 font-ui text-xs text-[var(--color-text-muted)]">
                              <Phone size={12} /> {guest.phone}
                            </span>
                          )}
                          <span className="font-ui text-xs text-[var(--color-text-muted)]">
                            Code: {guest.invite_code}
                          </span>
                          {guest.group_label && (
                            <span className="font-ui text-xs text-[var(--color-text-muted)]">
                              Group: {guest.group_label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleEdit(guest)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Pencil size={14} className="text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete(guest.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <GuestModal
          guest={editingGuest}
          weddingId={wedding.id}
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => {
            if (editingGuest) {
              updateMutation.mutate({ id: editingGuest.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}

function GuestModal({
  guest,
  weddingId,
  onClose,
  onSave,
  isSaving,
}: {
  guest: Guest | null;
  weddingId: string;
  onClose: () => void;
  onSave: (data: Omit<Guest, "id" | "created_at">) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<Omit<Guest, "id" | "created_at">>(
    guest ? { ...guest } : emptyGuest(weddingId)
  );

  const update = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.full_name.trim()) return;
    const nameParts = form.full_name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;
    onSave({
      ...form,
      first_name: firstName,
      last_name: lastName,
      username: form.username || firstName.toLowerCase() + Math.floor(Math.random() * 1000),
    });
  };

  return (
    <Modal open={true} onClose={onClose} title={guest ? "Edit Guest" : "Add Guest"} maxWidth="max-w-xl">
      <div className="space-y-4">
        <FormField label="Full Name">
          <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Jane Doe" />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Email">
            <Input type="email" value={form.email || ""} onChange={(e) => update("email", e.target.value || null)} placeholder="jane@example.com" />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone || ""} onChange={(e) => update("phone", e.target.value || null)} placeholder="+60 12 345 6789" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Group Label">
            <Input value={form.group_label || ""} onChange={(e) => update("group_label", e.target.value || null)} placeholder="Family" />
          </FormField>
          <FormField label="Tag">
            <Input value={form.tag || ""} onChange={(e) => update("tag", e.target.value || null)} placeholder="VIP" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Invite Code">
            <Input value={form.invite_code} onChange={(e) => update("invite_code", e.target.value)} placeholder="ABC123" />
          </FormField>
          <FormField label="RSVP Status">
            <Select value={form.rsvp_status} onChange={(e) => update("rsvp_status", e.target.value)}>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="tentative">Tentative</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Address">
          <Textarea value={form.address || ""} onChange={(e) => update("address", e.target.value || null)} placeholder="Mailing address" rows={2} />
        </FormField>

        <FormField label="Dietary Requirements">
          <Input value={form.dietary_requirements || ""} onChange={(e) => update("dietary_requirements", e.target.value || null)} placeholder="Vegetarian, allergies, etc." />
        </FormField>

        <FormField label="Notes">
          <Textarea value={form.notes || ""} onChange={(e) => update("notes", e.target.value || null)} placeholder="Internal notes about this guest" rows={2} />
        </FormField>

        <div className="flex items-center justify-between p-3 bg-[var(--color-bg-light)] rounded-lg">
          <div>
            <p className="font-ui text-sm text-[var(--color-text)] font-medium">Plus One Allowed</p>
            <p className="font-ui text-xs text-[var(--color-text-muted)]">Allow this guest to bring a plus one</p>
          </div>
          <Toggle checked={form.plus_one_allowed} onChange={(v) => update("plus_one_allowed", v)} />
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isSaving || !form.full_name.trim()}>
            <Save size={14} className="mr-1.5" />
            {isSaving ? "Saving..." : guest ? "Update Guest" : "Add Guest"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
