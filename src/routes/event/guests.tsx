import { useState, useRef, useMemo, useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, Modal, FormField, Toast, Skeleton, ErrorState, EmptyState } from "../../components/ui";
import { Search, Plus, Download, Upload, Trash2, Edit2, ArrowUpDown, Users, Check, X, Clock } from "lucide-react";

type SortKey = "name" | "table_number" | "group_name";

export default function GuestsPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<EventGuest | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: guests, isLoading, isError, refetch } = useQuery<EventGuest[]>({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as EventGuest[];
    },
    enabled: !!eventId,
  });

  type NewGuest = { name: string; table_number: string | null; plus_ones: number; group_name: string };
  const createMutation = useMutation<void, Error, NewGuest>({
    mutationFn: async (newGuest) => {
      if (!eventId) throw new Error("No event ID");
      const { error } = await supabase.from("event_guests").insert({
        ...newGuest,
        event_id: eventId,
        rsvp_status: "pending",
        token: crypto.randomUUID(),
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

  const updateMutation = useMutation<void, Error, { id: string; patch: Partial<EventGuest> }>({
    mutationFn: async ({ id, patch }) => {
      const { error } = await supabase.from("event_guests").update(patch).eq("id", id);
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

  const bulkImportMutation = useMutation<void, Error, Array<{ name: string; table_number: string | null; plus_ones: number; group_name: string }>>({
    mutationFn: async (rows) => {
      if (!eventId) throw new Error("No event ID");
      const payload = rows.map((r) => ({
        ...r,
        event_id: eventId,
        rsvp_status: "pending" as const,
        token: crypto.randomUUID(),
      }));
      const { error } = await supabase.from("event_guests").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setImportOpen(false);
      setToast({ message: "Guests imported", type: "success" });
    },
    onError: () => setToast({ message: "Import failed", type: "error" }),
  });

  const filtered = useMemo(() => {
    if (!guests) return [];
    const q = search.toLowerCase();
    let result = guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.group_name || "").toLowerCase().includes(q) ||
        (g.table_number || "").toLowerCase().includes(q)
    );
    result = [...result].sort((a, b) => {
      const av = (a[sortKey] || "").toString().toLowerCase();
      const bv = (b[sortKey] || "").toString().toLowerCase();
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [guests, search, sortKey, sortDir]);

  const summary = useMemo(() => {
    if (!guests) return { total: 0, attending: 0, declined: 0, pending: 0 };
    return {
      total: guests.length,
      attending: guests.filter((g) => g.rsvp_status === "attending").length,
      declined: guests.filter((g) => g.rsvp_status === "declined").length,
      pending: guests.filter((g) => g.rsvp_status === "pending").length,
    };
  }, [guests]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleExport = () => {
    if (!guests || guests.length === 0) return;
    const headers = ["name", "table_number", "plus_ones", "group_name", "rsvp_status"];
    const rows = guests.map((g) =>
      [g.name, g.table_number || "", g.plus_ones, g.group_name || "", g.rsvp_status].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
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

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) { setToast({ message: "CSV must have a header and at least one row", type: "error" }); return; }
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        return {
          name: values[headers.indexOf("name")] || values[0] || "",
          table_number: values[headers.indexOf("table_number")] || values[1] || null,
          plus_ones: parseInt(values[headers.indexOf("plus_ones")] || values[2] || "0", 10) || 0,
          group_name: values[headers.indexOf("group_name")] || values[3] || "",
        };
      }).filter((r) => r.name);
      setImportPreview(rows);
    };
    reader.readAsText(file);
  };

  const [importPreview, setImportPreview] = useState<Array<{ name: string; table_number: string | null; plus_ones: number; group_name: string }>>([]);

  const openAdd = () => { setEditingGuest(null); setModalOpen(true); };
  const openEdit = (g: EventGuest) => { setEditingGuest(g); setModalOpen(true); };

  if (!event) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Guests</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={!guests || guests.length === 0}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4" /> Import
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Guest
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={<Users className="w-5 h-5" />} label="Total" value={summary.total} color="text-slate-900" bg="bg-slate-50" />
        <SummaryCard icon={<Check className="w-5 h-5" />} label="Attending" value={summary.attending} color="text-green-700" bg="bg-green-50" />
        <SummaryCard icon={<X className="w-5 h-5" />} label="Declined" value={summary.declined} color="text-red-700" bg="bg-red-50" />
        <SummaryCard icon={<Clock className="w-5 h-5" />} label="Pending" value={summary.pending} color="text-amber-700" bg="bg-amber-50" />
      </div>

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, table, or group..."
            className="border-0 focus:ring-0"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load guests" onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users className="w-12 h-12" />} title="No guests found" description="Add your first guest or import a CSV file." action={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Guest</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-slate-900">Name <ArrowUpDown className="w-3 h-3" /></button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    <button onClick={() => toggleSort("table_number")} className="flex items-center gap-1 hover:text-slate-900">Table <ArrowUpDown className="w-3 h-3" /></button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Plus Ones</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    <button onClick={() => toggleSort("group_name")} className="flex items-center gap-1 hover:text-slate-900">Group <ArrowUpDown className="w-3 h-3" /></button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">RSVP</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{g.name}</td>
                    <td className="px-4 py-3 text-slate-600">{g.table_number || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{g.plus_ones}</td>
                    <td className="px-4 py-3 text-slate-600">{g.group_name || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={g.rsvp_status === "attending" ? "success" : g.rsvp_status === "declined" ? "error" : "warning"}>
                        {g.rsvp_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(g)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteMutation.mutate(g.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <GuestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingGuest={editingGuest}
        onSave={(data) => {
          if (editingGuest) updateMutation.mutate({ id: editingGuest.id, patch: data });
          else createMutation.mutate(data);
        }}
        saving={createMutation.isPending || updateMutation.isPending}
      />

      <Modal open={importOpen} onClose={() => { setImportOpen(false); setImportPreview([]); }} title="Import Guests from CSV">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Upload a CSV file with columns: name, table_number, plus_ones, group_name</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ""; }}
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full">
            <Upload className="w-4 h-4" /> Choose CSV File
          </Button>
          {importPreview.length > 0 && (
            <>
              <div className="text-sm font-medium text-slate-700">Preview ({importPreview.length} guests)</div>
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Name</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Table</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Plus Ones</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Group</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((r, i) => (
                      <tr key={i} className="border-t border-slate-50">
                        <td className="px-3 py-2 text-slate-900">{r.name}</td>
                        <td className="px-3 py-2 text-slate-600">{r.table_number || "—"}</td>
                        <td className="px-3 py-2 text-slate-600">{r.plus_ones}</td>
                        <td className="px-3 py-2 text-slate-600">{r.group_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button onClick={() => bulkImportMutation.mutate(importPreview)} loading={bulkImportMutation.isPending} className="w-full">
                Confirm Import
              </Button>
            </>
          )}
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function SummaryCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number; color: string; bg: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg} ${color}`}>{icon}</div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    </Card>
  );
}

function GuestModal({
  open,
  onClose,
  editingGuest,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  editingGuest: EventGuest | null;
  onSave: (data: { name: string; table_number: string | null; plus_ones: number; group_name: string }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [plusOnes, setPlusOnes] = useState(0);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (open) {
      setName(editingGuest?.name || "");
      setTableNumber(editingGuest?.table_number || "");
      setPlusOnes(editingGuest?.plus_ones || 0);
      setGroupName(editingGuest?.group_name || "");
    }
  }, [open, editingGuest]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), table_number: tableNumber.trim() || null, plus_ones: plusOnes, group_name: groupName.trim() });
  };

  return (
    <Modal open={open} onClose={onClose} title={editingGuest ? "Edit Guest" : "Add Guest"}>
      <div className="space-y-4">
        <FormField label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
        </FormField>
        <FormField label="Table Number">
          <Input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="Table 1" />
        </FormField>
        <FormField label="Plus Ones">
          <Input type="number" min={0} value={plusOnes} onChange={(e) => setPlusOnes(parseInt(e.target.value, 10) || 0)} />
        </FormField>
        <FormField label="Group Name">
          <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Groom's Family" />
        </FormField>
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} loading={saving} disabled={!name.trim()} className="flex-1">Save</Button>
        </div>
      </div>
    </Modal>
  );
}


