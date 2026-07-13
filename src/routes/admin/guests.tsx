import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Guest, GuestGroup, GuestGroupMember } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState, SectionTitle } from "@/components/ui";
import { generateUsername, downloadCsv, parseCsv } from "@/lib/utils";
import {
  Plus, Search, Pencil, Trash2, Download, Upload,
  Wand2, Mail, Phone, AlertCircle, Check,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type GuestWithGroups = Guest & { groups: GuestGroup[] };

type GuestForm = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  plus_one_allowed: boolean;
  notes: string;
};

const EMPTY_FORM: GuestForm = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  plus_one_allowed: false,
  notes: "",
};

const RSVP_META: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  accepted: { label: "Attending", variant: "success" },
  declined: { label: "Declined", variant: "danger" },
  tentative: { label: "Tentative", variant: "warning" },
  pending: { label: "Pending", variant: "default" },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function AdminGuests() {
  const { wedding } = useHostWedding();

  const [guests, setGuests] = useState<GuestWithGroups[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [form, setForm] = useState<GuestForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<GuestForm[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<string | null>(null);

  /* ---------------- fetch ---------------- */

  const fetchGuests = useCallback(async () => {
    if (!wedding) return;
    setLoading(true);

    const [
      { data: guestRows, error: guestErr },
      { data: memberRows, error: memberErr },
      { data: groupRows, error: groupErr },
    ] = await Promise.all([
      supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false }),
      supabase.from("guest_group_members").select("guest_id, group_id, created_at").in(
        "group_id",
        (await supabase.from("guest_groups").select("id").eq("wedding_id", wedding.id)).data?.map((g) => g.id) ?? [],
      ),
      supabase.from("guest_groups").select("*").eq("wedding_id", wedding.id),
    ]);

    if (guestErr || memberErr || groupErr) {
      console.error("Fetch error", { guestErr, memberErr, groupErr });
      setLoading(false);
      return;
    }

    const groupMap = new Map<string, GuestGroup>();
    (groupRows as GuestGroup[] | null)?.forEach((g) => groupMap.set(g.id, g));

    const byGuest = new Map<string, GuestGroup[]>();
    (memberRows as GuestGroupMember[] | null)?.forEach((m) => {
      const g = groupMap.get(m.group_id);
      if (g) {
        const arr = byGuest.get(m.guest_id) ?? [];
        arr.push(g);
        byGuest.set(m.guest_id, arr);
      }
    });

    setGuests(
      (guestRows as Guest[] | null ?? []).map((g) => ({
        ...g,
        groups: byGuest.get(g.id) ?? [],
      })),
    );
    setLoading(false);
  }, [wedding]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  /* ---------------- toast ---------------- */

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  /* ---------------- search / filter ---------------- */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter((g) => {
      const name = `${g.first_name ?? ""} ${g.last_name ?? ""}`.trim().toLowerCase();
      return (
        name.includes(q) ||
        (g.email ?? "").toLowerCase().includes(q) ||
        (g.username ?? "").toLowerCase().includes(q)
      );
    });
  }, [guests, search]);

  /* ---------------- add / edit ---------------- */

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (guest: Guest) => {
    setEditing(guest);
    setForm({
      first_name: guest.first_name ?? "",
      last_name: guest.last_name ?? "",
      username: guest.username ?? "",
      email: guest.email ?? "",
      phone: guest.phone ?? "",
      plus_one_allowed: guest.plus_one_allowed ?? false,
      notes: guest.notes ?? "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleAutoUsername = () => {
    const name = `${form.first_name} ${form.last_name}`.trim();
    if (!name) {
      setFormError("Enter a name first to generate a username.");
      return;
    }
    setForm((f) => ({ ...f, username: generateUsername(name) }));
    setFormError(null);
  };

  const saveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wedding) return;

    const first = form.first_name.trim();
    const last = form.last_name.trim();
    if (!first && !last) {
      setFormError("At least a first or last name is required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const full_name = `${first} ${last}`.trim();
    const payload = {
      wedding_id: wedding.id,
      first_name: first || null,
      last_name: last || null,
      full_name,
      username: form.username.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      plus_one_allowed: form.plus_one_allowed,
      notes: form.notes.trim() || null,
    };

    if (editing) {
      const { error } = await supabase.from("guests").update(payload).eq("id", editing.id);
      setSaving(false);
      if (error) {
        setFormError(error.message);
        return;
      }
      showToast("Guest updated");
      setModalOpen(false);
      fetchGuests();
    } else {
      const { error } = await supabase.from("guests").insert(payload);
      setSaving(false);
      if (error) {
        setFormError(error.message);
        return;
      }
      showToast("Guest added");
      setModalOpen(false);
      fetchGuests();
    }
  };

  /* ---------------- delete ---------------- */

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error: mErr } = await supabase
      .from("guest_group_members")
      .delete()
      .eq("guest_id", deleteTarget.id);
    if (mErr) {
      console.error("Delete memberships error", mErr);
    }
    const { error } = await supabase.from("guests").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      console.error("Delete guest error", error);
      showToast("Failed to delete guest");
      return;
    }
    showToast("Guest deleted");
    setDeleteTarget(null);
    fetchGuests();
  };

  /* ---------------- CSV export ---------------- */

  const exportCsv = () => {
    if (guests.length === 0) {
      showToast("No guests to export");
      return;
    }
    const rows = guests.map((g) => ({
      first_name: g.first_name ?? "",
      last_name: g.last_name ?? "",
      username: g.username ?? "",
      email: g.email ?? "",
      phone: g.phone ?? "",
      rsvp_status: g.rsvp_status ?? "",
      plus_one_allowed: g.plus_one_allowed ? "yes" : "no",
      notes: g.notes ?? "",
    }));
    downloadCsv("guests.csv", rows);
  };

  /* ---------------- CSV import ---------------- */

  const openImport = () => {
    setImportText("");
    setImportPreview(null);
    setImportError(null);
    setImportOpen(true);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setImportText(text);
      previewImport(text);
    };
    reader.readAsText(file);
  };

  const previewImport = (text: string) => {
    setImportError(null);
    const rows = parseCsv(text);
    if (rows.length === 0) {
      setImportPreview(null);
      setImportError("No rows found. Ensure the CSV has a header row and at least one data row.");
      return;
    }
    const parsed: GuestForm[] = rows.map((r) => ({
      first_name: (r.first_name ?? "").trim(),
      last_name: (r.last_name ?? "").trim(),
      username: (r.username ?? "").trim(),
      email: (r.email ?? "").trim(),
      phone: (r.phone ?? "").trim(),
      plus_one_allowed: false,
      notes: "",
    }));
    const valid = parsed.filter((p) => p.first_name || p.last_name);
    if (valid.length === 0) {
      setImportPreview(null);
      setImportError("No valid rows — each row needs at least a first_name or last_name.");
      return;
    }
    setImportPreview(valid);
  };

  const runImport = async () => {
    if (!wedding || !importPreview || importPreview.length === 0) return;
    setImporting(true);
    setImportError(null);

    const rows = importPreview.map((p) => {
      const first = p.first_name.trim();
      const last = p.last_name.trim();
      return {
        wedding_id: wedding.id,
        first_name: first || null,
        last_name: last || null,
        full_name: `${first} ${last}`.trim(),
        username: p.username || null,
        email: p.email || null,
        phone: p.phone || null,
        plus_one_allowed: false,
        notes: null,
      };
    });

    const { error } = await supabase.from("guests").insert(rows);
    setImporting(false);
    if (error) {
      setImportError(error.message);
      return;
    }
    showToast(`${rows.length} guest${rows.length === 1 ? "" : "s"} imported`);
    setImportOpen(false);
    fetchGuests();
  };

  /* ---------------- render ---------------- */

  return (
    <div className="animate-fade-in">
      <SectionTitle
        title="Guests"
        subtitle="Manage your guest list, import via CSV, and track RSVPs."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={openImport}>
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4" />
              Add Guest
            </Button>
          </div>
        }
      />

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sepia/50" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or username…"
          className="pl-9"
        />
      </div>

      {/* Hidden file input for CSV import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFile}
      />

      {/* Guest table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sepia text-sm">Loading guests…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? "No matching guests" : "No guests yet"}
            description={search ? "Try a different search term." : "Add guests one by one or import a CSV to get started."}
            action={
              !search && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={openImport}>
                    <Upload className="w-4 h-4" />
                    Import CSV
                  </Button>
                  <Button size="sm" onClick={openAdd}>
                    <Plus className="w-4 h-4" />
                    Add Guest
                  </Button>
                </div>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand bg-mist/50">
                  <th className="text-left font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">Name</th>
                  <th className="text-left font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">Username</th>
                  <th className="text-left font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">Email</th>
                  <th className="text-left font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">Phone</th>
                  <th className="text-left font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">RSVP</th>
                  <th className="text-left font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">Groups</th>
                  <th className="text-right font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((guest) => {
                  const rsvp = RSVP_META[guest.rsvp_status ?? "pending"] ?? RSVP_META.pending;
                  return (
                    <tr key={guest.id} className="border-b border-sand/60 last:border-0 hover:bg-mist/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-onyx">{guest.full_name}</div>
                        {guest.plus_one_allowed && (
                          <span className="text-xs text-sepia/60">+1 allowed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sepia">
                        {guest.username ? (
                          <span className="font-mono text-xs">{guest.username}</span>
                        ) : (
                          <span className="text-sepia/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sepia">
                        {guest.email ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-sepia/50" />
                            {guest.email}
                          </span>
                        ) : (
                          <span className="text-sepia/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sepia">
                        {guest.phone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-sepia/50" />
                            {guest.phone}
                          </span>
                        ) : (
                          <span className="text-sepia/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={rsvp.variant}>{rsvp.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {guest.groups.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {guest.groups.map((g) => (
                              <Badge key={g.id} variant="info">{g.name}</Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sepia/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(guest)}
                            className="p-1.5 rounded-md text-sepia hover:bg-sepia/10 hover:text-onyx transition-colors"
                            title="Edit guest"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(guest)}
                            className="p-1.5 rounded-md text-sepia hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete guest"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Count footer */}
      {!loading && guests.length > 0 && (
        <p className="mt-3 text-xs text-sepia/60">
          {filtered.length} of {guests.length} guest{guests.length === 1 ? "" : "s"}
          {search && " shown"}
        </p>
      )}

      {/* ---------------- Add / Edit Modal ---------------- */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Guest" : "Add Guest"}
      >
        <form onSubmit={saveGuest} className="space-y-4">
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
            <div className="flex gap-2">
              <Input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="janedoe1234"
                className="font-mono"
              />
              <Button type="button" variant="outline" size="md" onClick={handleAutoUsername} className="shrink-0">
                <Wand2 className="w-4 h-4" />
                Auto
              </Button>
            </div>
            <p className="text-xs text-sepia/50 mt-1">Used by guests to sign in. Click Auto to generate from name.</p>
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

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.plus_one_allowed}
              onChange={(e) => setForm((f) => ({ ...f, plus_one_allowed: e.target.checked }))}
              className="w-4 h-4 rounded border-sand text-onyx focus:ring-sepia"
            />
            <span className="text-sm text-onyx">Plus-one allowed</span>
          </label>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Dietary needs, seating preferences, relationship…"
              rows={3}
            />
          </div>

          {formError && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-md p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Guest"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ---------------- Delete Confirm Modal ---------------- */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete Guest"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm text-onyx pt-1">
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget?.full_name}</span>? This will also remove them from any
              groups. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Guest"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---------------- Import Modal ---------------- */}
      <Modal
        open={importOpen}
        onClose={() => !importing && setImportOpen(false)}
        title="Import Guests from CSV"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="bg-mist/60 rounded-md p-4 text-sm text-sepia">
            <p className="font-medium text-onyx mb-1">CSV format</p>
            <p className="mb-2">First row must be a header with column names. Supported columns:</p>
            <code className="block bg-card border border-sand rounded px-3 py-2 text-xs font-mono text-onyx">
              first_name, last_name, username, email, phone
            </code>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Choose CSV File
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setImportText("");
                setImportPreview(null);
                setImportError(null);
              }}
            >
              Clear
            </Button>
          </div>

          <div>
            <Label>Or paste CSV content</Label>
            <Textarea
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                if (e.target.value.trim()) previewImport(e.target.value);
                else setImportPreview(null);
              }}
              placeholder={"first_name,last_name,username,email,phone\nJohn,Smith,johnsmith123,john@example.com,+1 555 000 0001"}
              rows={5}
              className="font-mono text-xs"
            />
          </div>

          {importError && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-md p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{importError}</span>
            </div>
          )}

          {importPreview && importPreview.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-onyx">
                  {importPreview.length} guest{importPreview.length === 1 ? "" : "s"} ready to import
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-sand rounded-md">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-mist/80 backdrop-blur">
                    <tr>
                      <th className="text-left font-medium text-sepia px-3 py-2">First</th>
                      <th className="text-left font-medium text-sepia px-3 py-2">Last</th>
                      <th className="text-left font-medium text-sepia px-3 py-2">Username</th>
                      <th className="text-left font-medium text-sepia px-3 py-2">Email</th>
                      <th className="text-left font-medium text-sepia px-3 py-2">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.slice(0, 50).map((p, i) => (
                      <tr key={i} className="border-t border-sand/60">
                        <td className="px-3 py-2 text-onyx">{p.first_name || "—"}</td>
                        <td className="px-3 py-2 text-onyx">{p.last_name || "—"}</td>
                        <td className="px-3 py-2 text-sepia font-mono">{p.username || "—"}</td>
                        <td className="px-3 py-2 text-sepia">{p.email || "—"}</td>
                        <td className="px-3 py-2 text-sepia">{p.phone || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importPreview.length > 50 && (
                  <p className="text-xs text-sepia/60 px-3 py-2 border-t border-sand/60">
                    …and {importPreview.length - 50} more
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setImportOpen(false)} disabled={importing}>
              Cancel
            </Button>
            <Button
              onClick={runImport}
              disabled={importing || !importPreview || importPreview.length === 0}
            >
              {importing ? "Importing…" : `Import ${importPreview?.length ?? 0} Guest${importPreview?.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---------------- Toast ---------------- */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="flex items-center gap-2 bg-onyx text-parchment px-4 py-2.5 rounded-md shadow-lg text-sm">
            <Check className="w-4 h-4" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
