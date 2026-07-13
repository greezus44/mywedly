import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus, Pencil, Trash2, Save, X, Search, Download, Upload,
  Users, Mail, Phone, User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Guest, GuestGroup } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { generateUsername, downloadCsv, parseCsv, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Select, Toggle } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState, SectionTitle, Toast } from "@/components/ui";

type GuestForm = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  plus_one_allowed: boolean;
  notes: string;
  group_id: string;
};

function emptyForm(): GuestForm {
  return {
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    plus_one_allowed: false,
    notes: "",
    group_id: "",
  };
}

function toForm(guest: Guest): GuestForm {
  return {
    first_name: guest.first_name ?? "",
    last_name: guest.last_name ?? "",
    username: guest.username ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    plus_one_allowed: guest.plus_one_allowed,
    notes: guest.notes ?? "",
    group_id: guest.group_id ?? "",
  };
}

function fullName(form: GuestForm): string {
  return [form.first_name, form.last_name].filter(Boolean).join(" ").trim();
}

function rsvpBadgeVariant(status: string | null): "default" | "success" | "warning" | "danger" | "info" {
  if (status === "accepted" || status === "attending") return "success";
  if (status === "declined") return "danger";
  if (status === "tentative") return "warning";
  return "default";
}

export function AdminGuests() {
  const { wedding, loading } = useHostWedding();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<GuestForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);
  const [showImport, setShowImport] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const weddingId = wedding?.id ?? null;

  const fetchGuests = useCallback(async () => {
    if (!weddingId) return;
    setFetching(true);
    const [g, gr] = await Promise.all([
      supabase.from("guests").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
      supabase.from("guest_groups").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
    ]);
    if (g.data) setGuests(g.data as Guest[]);
    if (gr.data) setGroups(gr.data as GuestGroup[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => {
    if (weddingId) fetchGuests();
  }, [weddingId, fetchGuests]);

  // ─── Filtered guests ───
  const filtered = guests.filter((g) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      g.full_name.toLowerCase().includes(q) ||
      (g.email ?? "").toLowerCase().includes(q) ||
      (g.username ?? "").toLowerCase().includes(q) ||
      (g.phone ?? "").toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" ||
      (g.rsvp_status ?? "pending") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ─── CRUD ───
  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setForm(emptyForm());
  };

  const startEdit = (guest: Guest) => {
    setEditingId(guest.id);
    setIsCreating(false);
    setForm(toForm(guest));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setForm(emptyForm());
  };

  const save = async () => {
    if (!weddingId) return;
    const name = fullName(form);
    if (!name.trim()) {
      setToast({ message: "First or last name is required", type: "error" });
      return;
    }
    setSaving(true);
    const username = form.username || generateUsername(name);
    const row = {
      wedding_id: weddingId,
      full_name: name,
      first_name: form.first_name || null,
      last_name: form.last_name || null,
      username,
      email: form.email || null,
      phone: form.phone || null,
      plus_one_allowed: form.plus_one_allowed,
      notes: form.notes || null,
      group_id: form.group_id || null,
    };

    if (isCreating) {
      const { error } = await supabase.from("guests").insert(row);
      setSaving(false);
      if (error) {
        setToast({ message: "Failed to add guest", type: "error" });
      } else {
        setToast({ message: "Guest added", type: "success" });
        cancelEdit();
        await fetchGuests();
      }
    } else if (editingId) {
      const { error } = await supabase.from("guests").update(row).eq("id", editingId);
      setSaving(false);
      if (error) {
        setToast({ message: "Failed to save guest", type: "error" });
      } else {
        setToast({ message: "Guest saved", type: "success" });
        cancelEdit();
        await fetchGuests();
      }
    }
  };

  const deleteGuest = async (guest: Guest) => {
    const { error } = await supabase.from("guests").delete().eq("id", guest.id);
    setDeleteTarget(null);
    if (error) {
      setToast({ message: "Failed to delete guest", type: "error" });
    } else {
      setToast({ message: "Guest deleted", type: "success" });
      if (editingId === guest.id) cancelEdit();
      await fetchGuests();
    }
  };

  // ─── CSV Export ───
  const exportCsv = () => {
    const rows = guests.map((g) => ({
      first_name: g.first_name ?? "",
      last_name: g.last_name ?? "",
      full_name: g.full_name,
      username: g.username ?? "",
      email: g.email ?? "",
      phone: g.phone ?? "",
      rsvp_status: g.rsvp_status ?? "pending",
      plus_one_allowed: g.plus_one_allowed,
      notes: g.notes ?? "",
    }));
    downloadCsv("guests.csv", rows);
    setToast({ message: "CSV exported", type: "success" });
  };

  // ─── CSV Import ───
  const handleImportFile = async (file: File) => {
    if (!weddingId) return;
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      setToast({ message: "No rows found in CSV", type: "error" });
      return;
    }

    const toInsert = rows.map((row) => {
      const firstName = row["first_name"] ?? "";
      const lastName = row["last_name"] ?? "";
      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || row["name"] || row["full_name"] || "Unknown";
      return {
        wedding_id: weddingId,
        full_name: fullName,
        first_name: firstName || null,
        last_name: lastName || null,
        username: row["username"] || generateUsername(fullName),
        email: row["email"] || null,
        phone: row["phone"] || null,
        plus_one_allowed: row["plus_one_allowed"] === "true" || row["plus_one_allowed"] === "1",
        notes: row["notes"] || null,
      };
    });

    const { error } = await supabase.from("guests").insert(toInsert);
    setShowImport(false);
    if (fileRef.current) fileRef.current.value = "";
    if (error) {
      setToast({ message: `Import failed: ${error.message}`, type: "error" });
    } else {
      setToast({ message: `Imported ${toInsert.length} guests`, type: "success" });
      await fetchGuests();
    }
  };

  if (loading || fetching) {
    return <div className="flex items-center justify-center py-24 text-sepia">Loading guests…</div>;
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to manage guests." />;
  }

  const isEditing = isCreating || editingId !== null;

  return (
    <div>
      <SectionTitle
        title="Guests"
        subtitle="Manage your guest list, import in bulk, and track RSVPs."
        action={
          !isEditing && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
                <Upload className="w-4 h-4" /> Import
              </Button>
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={guests.length === 0}>
                <Download className="w-4 h-4" /> Export
              </Button>
              <Button size="sm" onClick={startCreate}>
                <Plus className="w-4 h-4" /> Add Guest
              </Button>
            </div>
          )
        }
      />

      {/* ─── Edit / Create modal ─── */}
      <Modal open={isEditing} onClose={cancelEdit} title={isCreating ? "Add Guest" : "Edit Guest"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              placeholder={form.first_name ? `Auto: ${generateUsername(fullName(form))}` : "Auto-generated from name"}
            />
            <p className="text-xs text-sepia/50 mt-1">Leave blank to auto-generate from the guest's name.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          <div>
            <Toggle
              checked={form.plus_one_allowed}
              onChange={(v) => setForm((f) => ({ ...f, plus_one_allowed: v }))}
              label="Plus-one allowed"
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Internal notes about this guest…"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={cancelEdit} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Import modal ─── */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import Guests from CSV">
        <div className="space-y-4">
          <p className="text-sm text-sepia">
            Upload a CSV file with columns: <code className="text-xs bg-mist px-1.5 py-0.5 rounded">first_name, last_name, email, phone, username, plus_one_allowed, notes</code>.
          </p>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-sand rounded-lg p-8 text-center cursor-pointer hover:border-sepia/40 transition-colors"
          >
            <Upload className="w-8 h-8 text-sepia/40 mx-auto mb-2" />
            <p className="text-sm text-sepia">Click to choose a CSV file</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
            }}
          />
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowImport(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ─── Search & filter ─── */}
      {guests.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sepia/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, username, phone…"
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sm:w-44"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="attending">Attending</option>
            <option value="declined">Declined</option>
            <option value="tentative">Tentative</option>
          </Select>
        </div>
      )}

      {/* ─── Guest table ─── */}
      {filtered.length === 0 && guests.length === 0 ? (
        <EmptyState
          title="No guests yet"
          description="Add guests one by one or import a CSV to get started."
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
                <Upload className="w-4 h-4" /> Import CSV
              </Button>
              <Button size="sm" onClick={startCreate}>
                <Plus className="w-4 h-4" /> Add Guest
              </Button>
            </div>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" description="Try adjusting your search or filter." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sand bg-mist/30">
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia/60 px-4 py-3">Name</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia/60 px-4 py-3">Username</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia/60 px-4 py-3 hidden md:table-cell">Contact</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia/60 px-4 py-3">RSVP</th>
                  <th className="text-right text-xs font-medium uppercase tracking-widest text-sepia/60 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((guest) => (
                  <tr key={guest.id} className="border-b border-sand/50 last:border-0 hover:bg-mist/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-mist flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-sepia/60" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-onyx truncate">{guest.full_name}</p>
                          {guest.plus_one_allowed && (
                            <span className="text-xs text-sepia/50">+1 allowed</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-sepia/70 font-mono">{guest.username ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {guest.email && (
                          <div className="flex items-center gap-1.5 text-xs text-sepia/70">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[180px]">{guest.email}</span>
                          </div>
                        )}
                        {guest.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-sepia/70">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{guest.phone}</span>
                          </div>
                        )}
                        {!guest.email && !guest.phone && <span className="text-xs text-sepia/40">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={rsvpBadgeVariant(guest.rsvp_status)}>
                        {guest.rsvp_status ?? "pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(guest)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(guest)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-sand bg-mist/20 text-xs text-sepia/60">
            Showing {filtered.length} of {guests.length} guests
          </div>
        </Card>
      )}

      {/* ─── Delete confirm ─── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Guest">
        <p className="text-sm text-sepia mb-6">
          Are you sure you want to delete{" "}
          <span className="font-medium text-onyx">{deleteTarget?.full_name}</span>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteTarget && deleteGuest(deleteTarget)}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </Modal>

      {/* ─── Toast ─── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
