import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import { Card, Badge, EmptyState, ErrorState, Skeleton, Toast, Modal } from "../../components/ui";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import {
  Users, Plus, Search, ArrowUpDown, Download, Upload, Trash2, Pencil, X, Loader2,
} from "lucide-react";

type SortKey = "name" | "group_name" | "table_number" | "plus_ones" | "created_at";
type SortDir = "asc" | "desc";

interface GuestInput {
  name: string;
  email: string;
  phone: string;
  group_name: string;
  side: string;
  table_number: string;
  plus_ones: number;
}

const emptyGuest: GuestInput = {
  name: "", email: "", phone: "", group_name: "", side: "", table_number: "", plus_ones: 0,
};

export default function Guests() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestInput>(emptyGuest);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const { data: guests, isLoading, error, refetch } = useQuery<EventGuest[], Error>({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId!)
        .order(sortKey, { ascending: sortDir === "asc" });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
  }, [sortKey, sortDir, eventId, queryClient]);

  const filtered = useMemo(() => {
    if (!guests) return [];
    const q = search.toLowerCase().trim();
    if (!q) return guests;
    return guests.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      g.group_name.toLowerCase().includes(q) ||
      g.table_number?.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q)
    );
  }, [guests, search]);

  const summary = useMemo(() => {
    const total = guests?.length || 0;
    const attending = guests?.filter((g) => g.rsvp_status === "attending").length || 0;
    const declined = guests?.filter((g) => g.rsvp_status === "declined").length || 0;
    const pending = guests?.filter((g) => g.rsvp_status === "pending").length || 0;
    const totalPlusOnes = guests?.reduce((sum, g) => sum + (g.plus_ones || 0), 0) || 0;
    return { total, attending, declined, pending, totalPlusOnes };
  }, [guests]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const openAdd = () => {
    setForm(emptyGuest);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (g: EventGuest) => {
    setForm({
      name: g.name, email: g.email, phone: g.phone, group_name: g.group_name,
      side: g.side, table_number: g.table_number || "", plus_ones: g.plus_ones,
    });
    setEditingId(g.id);
    setModalOpen(true);
  };

  const createMutation = useMutation<void, Error, GuestInput>({
    mutationFn: async (input) => {
      const { error } = await supabase.from("event_guests").insert({
        ...input,
        event_id: eventId!,
        rsvp_status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setModalOpen(false);
      setToast({ message: "Guest added", type: "success" });
    },
    onError: () => setToast({ message: "Failed to add guest", type: "error" }),
  });

  const updateMutation = useMutation<void, Error, { id: string; input: GuestInput }>({
    mutationFn: async ({ id, input }) => {
      const { error } = await supabase.from("event_guests").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setModalOpen(false);
      setToast({ message: "Guest updated", type: "success" });
    },
    onError: () => setToast({ message: "Failed to update guest", type: "error" }),
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setToast({ message: "Guest deleted", type: "success" });
    },
    onError: () => setToast({ message: "Failed to delete guest", type: "error" }),
  });

  const importMutation = useMutation<void, Error, GuestInput[]>({
    mutationFn: async (rows) => {
      const { error } = await supabase.from("event_guests").insert(
        rows.map((r) => ({ ...r, event_id: eventId!, rsvp_status: "pending" }))
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setImportOpen(false);
      setImportText("");
      setToast({ message: "Guests imported", type: "success" });
    },
    onError: () => setToast({ message: "Failed to import guests", type: "error" }),
  });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setToast({ message: "Name is required", type: "error" });
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, input: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleExport = () => {
    if (!guests || guests.length === 0) return;
    const headers = ["name", "email", "phone", "group_name", "side", "table_number", "plus_ones", "rsvp_status"];
    const rows = guests.map((g) =>
      [g.name, g.email, g.phone, g.group_name, g.side, g.table_number || "", g.plus_ones, g.rsvp_status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `guests-${eventId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const lines = importText.trim().split("\n");
    if (lines.length < 2) {
      setToast({ message: "CSV must have a header row and at least one data row", type: "error" });
      return;
    }
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows: GuestInput[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
      rows.push({
        name: row.name || "",
        email: row.email || "",
        phone: row.phone || "",
        group_name: row.group_name || "",
        side: row.side || "",
        table_number: row.table_number || "",
        plus_ones: parseInt(row.plus_ones || "0", 10) || 0,
      });
    }
    const valid = rows.filter((r) => r.name.trim());
    if (valid.length === 0) {
      setToast({ message: "No valid rows found", type: "error" });
      return;
    }
    importMutation.mutate(valid);
  };

  const rsvpBadge = (status: string) => {
    if (status === "attending") return <Badge variant="success">Attending</Badge>;
    if (status === "declined") return <Badge variant="error">Declined</Badge>;
    return <Badge variant="warning">Pending</Badge>;
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Guests</h1>
          <p className="text-sm text-slate-500">Manage your event guest list.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4" /> Import
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={!guests || guests.length === 0}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Guest
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1"><Users className="w-4 h-4" /><span className="text-xs">Total</span></div>
          <div className="text-2xl font-bold text-slate-900">{summary.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-400 mb-1">Attending</div>
          <div className="text-2xl font-bold text-green-600">{summary.attending}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-400 mb-1">Declined</div>
          <div className="text-2xl font-bold text-red-600">{summary.declined}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-400 mb-1">Pending</div>
          <div className="text-2xl font-bold text-amber-600">{summary.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-400 mb-1">Plus Ones</div>
          <div className="text-2xl font-bold text-slate-900">{summary.totalPlusOnes}</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guests..."
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (error as any) ? (
          <ErrorState message={(error as any).message || "Failed to load guests"} onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-10 h-10" />}
            title={search ? "No matching guests" : "No guests yet"}
            description={search ? "Try a different search term." : "Add your first guest to get started."}
            action={!search ? <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Guest</Button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {([
                    { key: "name", label: "Name" },
                    { key: "group_name", label: "Group" },
                    { key: "table_number", label: "Table" },
                    { key: "plus_ones", label: "+1s" },
                  ] as { key: SortKey; label: string }[]).map((col) => (
                    <th key={col.key} className="px-4 py-3 text-left font-medium text-slate-600">
                      <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 hover:text-slate-900">
                        {col.label} <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-medium text-slate-600">RSVP</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{g.name}</td>
                    <td className="px-4 py-3 text-slate-600">{g.group_name || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{g.table_number || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{g.plus_ones}</td>
                    <td className="px-4 py-3">{rsvpBadge(g.rsvp_status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(g)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${g.name}?`)) deleteMutation.mutate(g.id);
                          }}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
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
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Guest" : "Add Guest"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Guest name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Group</label>
              <Input value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} placeholder="Group name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Table Number</label>
              <Input value={form.table_number} onChange={(e) => setForm({ ...form, table_number: e.target.value })} placeholder="Table" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Side</label>
              <Input value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })} placeholder="Bride / Groom / etc" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Plus Ones</label>
              <Input type="number" min={0} value={form.plus_ones} onChange={(e) => setForm({ ...form, plus_ones: parseInt(e.target.value, 10) || 0 })} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Save Changes" : "Add Guest"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Guests (CSV)">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Paste CSV data below. Required columns: name. Optional: email, phone, group_name, side, table_number, plus_ones.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-mono min-h-[160px] resize-y"
            placeholder={'name,email,phone,group_name,side,table_number,plus_ones\nJohn Doe,john@example.com,555-0100,Family,Groom,1,0'}
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} loading={importMutation.isPending}>Import</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
