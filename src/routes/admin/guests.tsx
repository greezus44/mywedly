import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Search, Edit2, Trash2, Upload, Download, Users, Mail, Phone, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Guest, GuestGroup } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Select, Toggle } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState, SectionTitle, Toast } from "@/components/ui";
import { cn, generateUsername, downloadCsv, parseCsv } from "@/lib/utils";

type GuestForm = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  group_id: string;
  plus_one_allowed: boolean;
  notes: string;
};

const emptyForm: GuestForm = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  group_id: "",
  plus_one_allowed: false,
  notes: "",
};

const rsvpVariant = (status: string | null) => {
  if (status === "accepted") return "success" as const;
  if (status === "declined") return "danger" as const;
  if (status === "tentative") return "warning" as const;
  return "default" as const;
};

export function AdminGuests() {
  const { wedding, loading } = useHostWedding();
  const weddingId = wedding?.id ?? "";

  const [guests, setGuests] = useState<Guest[]>([]);
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [form, setForm] = useState<GuestForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Load guests + groups ───
  const loadAll = useCallback(async () => {
    if (!weddingId) { setFetching(false); return; }
    setFetching(true);
    const [g, gr] = await Promise.all([
      supabase.from("guests").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
      supabase.from("guest_groups").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
    ]);
    if (g.data) setGuests(g.data as Guest[]);
    if (gr.data) setGroups(gr.data as GuestGroup[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => { if (weddingId) loadAll(); }, [weddingId, loadAll]);

  // ─── Derived ───
  const filtered = useMemo(() => {
    return guests.filter((g) => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q ||
        g.full_name.toLowerCase().includes(q) ||
        (g.email ?? "").toLowerCase().includes(q) ||
        (g.username ?? "").toLowerCase().includes(q);
      const matchesRsvp = rsvpFilter === "all" || (g.rsvp_status ?? "pending") === rsvpFilter;
      const matchesGroup = groupFilter === "all" || g.group_id === groupFilter;
      return matchesSearch && matchesRsvp && matchesGroup;
    });
  }, [guests, search, rsvpFilter, groupFilter]);

  const groupName = (groupId: string | null) => groups.find((g) => g.id === groupId)?.name ?? "Ungrouped";

  // ─── Modal helpers ───
  const openAdd = () => {
    setEditingGuest(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setForm({
      first_name: guest.first_name ?? "",
      last_name: guest.last_name ?? "",
      username: guest.username ?? "",
      email: guest.email ?? "",
      phone: guest.phone ?? "",
      group_id: guest.group_id ?? "",
      plus_one_allowed: guest.plus_one_allowed,
      notes: guest.notes ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingGuest(null); setForm(emptyForm); };

  // Auto-generate username from first+last name when both present and username empty
  useEffect(() => {
    if (!modalOpen || editingGuest) return;
    if (!form.username && (form.first_name || form.last_name)) {
      const name = `${form.first_name}${form.last_name}`.trim();
      if (name) setForm((f) => ({ ...f, username: generateUsername(name) }));
    }
  }, [form.first_name, form.last_name, modalOpen, editingGuest, form.username]);

  // ─── Save ───
  const save = async () => {
    if (!weddingId) return;
    if (!form.first_name.trim() && !form.last_name.trim()) {
      showToast("Enter at least a first or last name", "error");
      return;
    }
    setSaving(true);
    const full_name = `${form.first_name} ${form.last_name}`.trim();
    const payload = {
      wedding_id: weddingId,
      full_name,
      first_name: form.first_name.trim() || null,
      last_name: form.last_name.trim() || null,
      username: form.username.trim() || generateUsername(full_name),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      group_id: form.group_id || null,
      plus_one_allowed: form.plus_one_allowed,
      notes: form.notes.trim() || null,
    };
    let error: { message: string } | null = null;
    if (editingGuest) {
      ({ error } = await supabase.from("guests").update(payload).eq("id", editingGuest.id));
    } else {
      ({ error } = await supabase.from("guests").insert(payload));
    }
    setSaving(false);
    if (error) { showToast(`Save failed: ${error.message}`, "error"); return; }
    showToast(editingGuest ? "Guest updated" : "Guest added");
    closeModal();
    await loadAll();
  };

  // ─── Delete ───
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("guests").delete().eq("id", deleteTarget.id);
    if (error) { showToast(`Delete failed: ${error.message}`, "error"); return; }
    showToast("Guest deleted");
    setDeleteTarget(null);
    await loadAll();
  };

  // ─── CSV export ───
  const exportCsv = () => {
    const rows = guests.map((g) => ({
      first_name: g.first_name ?? "",
      last_name: g.last_name ?? "",
      username: g.username ?? "",
      email: g.email ?? "",
      phone: g.phone ?? "",
      group: groupName(g.group_id),
      rsvp_status: g.rsvp_status ?? "pending",
      plus_one_allowed: g.plus_one_allowed ? "yes" : "no",
      notes: g.notes ?? "",
    }));
    downloadCsv("guests.csv", rows);
  };

  // ─── CSV import ───
  const importCsv = async (file: File) => {
    if (!weddingId) return;
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) { showToast("CSV is empty or invalid", "error"); return; }
    const payload = rows.map((row) => {
      const firstName = row.first_name ?? row.firstname ?? "";
      const lastName = row.last_name ?? row.lastname ?? "";
      const fullName = `${firstName} ${lastName}`.trim() || row.name || row.full_name || "";
      return {
        wedding_id: weddingId,
        full_name: fullName,
        first_name: firstName || null,
        last_name: lastName || null,
        username: (row.username ?? "").trim() || generateUsername(fullName),
        email: (row.email ?? "").trim() || null,
        phone: (row.phone ?? "").trim() || null,
        plus_one_allowed: (row.plus_one_allowed ?? "").toLowerCase() === "yes",
        notes: (row.notes ?? "").trim() || null,
      };
    });
    const { error } = await supabase.from("guests").insert(payload);
    if (error) { showToast(`Import failed: ${error.message}`, "error"); return; }
    showToast(`${payload.length} guests imported`);
    await loadAll();
  };

  // ─── Render ───
  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading guests…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to manage guests." />;
  }

  return (
    <div>
      <SectionTitle
        title="Guests"
        subtitle={`${guests.length} total · ${guests.filter((g) => g.rsvp_status === "accepted").length} attending`}
        action={
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ""; }}
            />
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" /> Import
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4" /> Add Guest
            </Button>
          </div>
        }
      />

      {/* ─── Filters ─── */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sepia/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or username…"
              className="pl-9"
            />
          </div>
          <Select
            value={rsvpFilter}
            onChange={(e) => setRsvpFilter(e.target.value)}
            className="sm:w-40"
          >
            <option value="all">All RSVP</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="tentative">Tentative</option>
          </Select>
          <Select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="sm:w-40"
          >
            <option value="all">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      {/* ─── Table ─── */}
      {filtered.length === 0 ? (
        <EmptyState
          title={guests.length === 0 ? "No guests yet" : "No matches"}
          description={guests.length === 0 ? "Add your first guest or import a CSV." : "Try adjusting your search or filters."}
          action={guests.length === 0 ? <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Guest</Button> : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sand bg-mist/50">
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia px-4 py-3">Name</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia px-4 py-3">Username</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia px-4 py-3 hidden lg:table-cell">Phone</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia px-4 py-3">RSVP</th>
                  <th className="text-right text-xs font-medium uppercase tracking-widest text-sepia px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((guest) => (
                  <tr key={guest.id} className="border-b border-sand last:border-0 hover:bg-mist/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-mist flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-sepia/60" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-onyx truncate">{guest.full_name}</p>
                          <p className="text-xs text-sepia/60 truncate">{groupName(guest.group_id)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-sepia bg-mist px-2 py-0.5 rounded">{guest.username ?? "—"}</code>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {guest.email ? (
                        <span className="text-sm text-sepia flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-sepia/40" />
                          <span className="truncate max-w-[200px]">{guest.email}</span>
                        </span>
                      ) : <span className="text-sepia/40 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {guest.phone ? (
                        <span className="text-sm text-sepia flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-sepia/40" />
                          {guest.phone}
                        </span>
                      ) : <span className="text-sepia/40 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={rsvpVariant(guest.rsvp_status)} className="capitalize">
                        {guest.rsvp_status ?? "pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(guest)}
                          className="p-1.5 rounded-lg text-sepia hover:bg-mist hover:text-onyx transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(guest)}
                          className="p-1.5 rounded-lg text-sepia/50 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* ─── Add/Edit modal ─── */}
      <Modal open={modalOpen} onClose={closeModal} title={editingGuest ? "Edit Guest" : "Add Guest"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name</Label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                placeholder="Jane"
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                placeholder="Doe"
              />
            </div>
          </div>
          <div>
            <Label>Username</Label>
            <Input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="Auto-generated from name"
            />
            <p className="text-xs text-sepia/60 mt-1.5">Used for guest sign-in. Auto-generated if left blank.</p>
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="jane@example.com"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+1 555 000 0000"
            />
          </div>
          <div>
            <Label>Group</Label>
            <Select
              value={form.group_id}
              onChange={(e) => setForm((f) => ({ ...f, group_id: e.target.value }))}
            >
              <option value="">No group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-sand">
            <div>
              <Label>Plus One Allowed</Label>
              <p className="text-xs text-sepia/60 -mt-1">Allow this guest to bring a guest.</p>
            </div>
            <Toggle
              checked={form.plus_one_allowed}
              onChange={(v) => setForm((f) => ({ ...f, plus_one_allowed: v }))}
              label={form.plus_one_allowed ? "Yes" : "No"}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Dietary needs, seating preferences, etc."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : editingGuest ? "Save Changes" : "Add Guest"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Delete confirm ─── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Guest">
        <div className="space-y-4">
          <p className="text-sm text-sepia">
            Are you sure you want to delete{" "}
            <span className="font-medium text-onyx">{deleteTarget?.full_name}</span>?
            This will also remove their RSVPs. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminGuests;
