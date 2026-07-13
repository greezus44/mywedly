import { useState, useMemo, useRef } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Badge, Modal, FormField, Toast, Skeleton, ErrorState, EmptyState } from "../../components/ui/index";
import { cn, formatDate, formatTime } from "../../lib/utils";
import { Plus, Search, Pencil, Trash2, Download, Upload, Users, UserPlus, Check, X, Clock } from "lucide-react";

type SortKey = "name" | "table_number" | "group_name";

export default function GuestsPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventGuest | null>(null);
  const [form, setForm] = useState({ name: "", table_number: "", plus_ones: 0, group_name: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importData, setImportData] = useState<Partial<EventGuest>[]>([]);
  const [importStep, setImportStep] = useState<"upload" | "preview">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  };

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

  const createMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) return;
      const { error } = await supabase.from("event_guests").insert({
        event_id: eventId,
        name: form.name,
        table_number: form.table_number || null,
        plus_ones: Number(form.plus_ones) || 0,
        group_name: form.group_name || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setModalOpen(false);
      showToast("Guest added");
    },
    onError: () => showToast("Failed to add guest", "error"),
  });

  const updateMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase
        .from("event_guests")
        .update({
          name: form.name,
          table_number: form.table_number || null,
          plus_ones: Number(form.plus_ones) || 0,
          group_name: form.group_name || null,
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setModalOpen(false);
      showToast("Guest updated");
    },
    onError: () => showToast("Failed to update guest", "error"),
  });

  const deleteMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!deleteId) return;
      const { error } = await supabase.from("event_guests").delete().eq("id", deleteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setDeleteId(null);
      showToast("Guest deleted");
    },
    onError: () => showToast("Failed to delete guest", "error"),
  });

  const bulkImportMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId || importData.length === 0) return;
      const rows = importData.map((g) => ({
        event_id: eventId,
        name: g.name || "",
        table_number: g.table_number || null,
        plus_ones: Number(g.plus_ones) || 0,
        group_name: g.group_name || null,
      }));
      const { error } = await supabase.from("event_guests").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setImportOpen(false);
      setImportData([]);
      setImportStep("upload");
      showToast(`${importData.length} guests imported`);
    },
    onError: () => showToast("Failed to import guests", "error"),
  });

  const filtered = useMemo(() => {
    if (!guests) return [];
    let result = guests;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name?.toLowerCase().includes(q) ||
          g.table_number?.toLowerCase().includes(q) ||
          g.group_name?.toLowerCase().includes(q)
      );
    }
    const sorted = [...result].sort((a, b) => {
      const av = (a[sortKey] || "").toString().toLowerCase();
      const bv = (b[sortKey] || "").toString().toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [guests, search, sortKey, sortDir]);

  const summary = useMemo(() => {
    if (!guests) return { total: 0, plusOnes: 0, attending: 0, declined: 0, pending: 0 };
    return {
      total: guests.length,
      plusOnes: guests.reduce((sum, g) => sum + (g.plus_ones || 0), 0),
      attending: guests.filter((g) => g.rsvp_status === "attending").length,
      declined: guests.filter((g) => g.rsvp_status === "declined").length,
      pending: guests.filter((g) => !g.rsvp_status || g.rsvp_status === "pending").length,
    };
  }, [guests]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", table_number: "", plus_ones: 0, group_name: "" });
    setModalOpen(true);
  };

  const openEdit = (g: EventGuest) => {
    setEditing(g);
    setForm({
      name: g.name || "",
      table_number: g.table_number || "",
      plus_ones: g.plus_ones || 0,
      group_name: g.group_name || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      showToast("Name is required", "error");
      return;
    }
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const exportCsv = () => {
    if (!guests || guests.length === 0) {
      showToast("No guests to export", "error");
      return;
    }
    const headers = ["Name", "Table Number", "Plus Ones", "Group", "RSVP Status", "Dietary", "Message", "Created At"];
    const rows = guests.map((g) => [
      g.name || "",
      g.table_number || "",
      g.plus_ones || 0,
      g.group_name || "",
      g.rsvp_status || "pending",
      g.dietary || "",
      g.message || "",
      g.created_at || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `guests-${eventId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("CSV exported");
  };

  const parseCsv = (text: string): Partial<EventGuest>[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) return [];
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          result.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
      result.push(current);
      return result;
    };
    const headers = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
    const nameIdx = headers.findIndex((h) => h.includes("name"));
    const tableIdx = headers.findIndex((h) => h.includes("table"));
    const plusIdx = headers.findIndex((h) => h.includes("plus"));
    const groupIdx = headers.findIndex((h) => h.includes("group"));
    return lines.slice(1).map((line) => {
      const cols = parseLine(line);
      return {
        name: cols[nameIdx >= 0 ? nameIdx : 0]?.trim() || "",
        table_number: tableIdx >= 0 ? cols[tableIdx]?.trim() || "" : "",
        plus_ones: plusIdx >= 0 ? Number(cols[plusIdx]) || 0 : 0,
        group_name: groupIdx >= 0 ? cols[groupIdx]?.trim() || "" : "",
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || "";
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        showToast("No valid data found in CSV", "error");
        return;
      }
      setImportData(parsed);
      setImportStep("preview");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const csv = "Name,Table Number,Plus Ones,Group\nJohn Doe,Table 1,2,Family\nJane Smith,Table 2,0,Friends";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "guest-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-16">
        <Skeleton className="w-full h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Guests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your guest list</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={exportCsv}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { setImportOpen(true); setImportStep("upload"); setImportData([]); }}>
            <Upload className="w-4 h-4" /> Import
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Guest
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard icon={<Users className="w-4 h-4" />} label="Total Guests" value={summary.total} />
        <SummaryCard icon={<UserPlus className="w-4 h-4" />} label="Plus Ones" value={summary.plusOnes} />
        <SummaryCard icon={<Check className="w-4 h-4" />} label="Attending" value={summary.attending} color="text-green-600" />
        <SummaryCard icon={<X className="w-4 h-4" />} label="Declined" value={summary.declined} color="text-red-600" />
        <SummaryCard icon={<Clock className="w-4 h-4" />} label="Pending" value={summary.pending} color="text-yellow-600" />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guests..."
              className="pl-9"
            />
          </div>
          <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="w-40">
            <option value="name">Sort by Name</option>
            <option value="table_number">Sort by Table</option>
            <option value="group_name">Sort by Group</option>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}>
            {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load guests" onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title={search ? "No guests found" : "No guests yet"}
            description={search ? "Try a different search term" : "Add your first guest to get started"}
            action={!search && <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Guest</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2 cursor-pointer hover:text-gray-900" onClick={() => toggleSort("name")}>
                    Full Name
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2 cursor-pointer hover:text-gray-900" onClick={() => toggleSort("table_number")}>
                    Table Number
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2 cursor-pointer hover:text-gray-900" onClick={() => toggleSort("group_name")}>
                    Group
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Plus Ones</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">RSVP</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{g.name}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{g.table_number || "—"}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{g.group_name || "—"}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{g.plus_ones || 0}</td>
                    <td className="px-3 py-3">
                      {g.rsvp_status === "attending" && <Badge variant="success">Attending</Badge>}
                      {g.rsvp_status === "declined" && <Badge variant="error">Declined</Badge>}
                      {(!g.rsvp_status || g.rsvp_status === "pending") && <Badge variant="warning">Pending</Badge>}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-gray-100">
                          <Pencil className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button onClick={() => setDeleteId(g.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Guest" : "Add Guest"}>
        <div className="space-y-4">
          <FormField label="Full Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Table Number">
              <Input value={form.table_number} onChange={(e) => setForm({ ...form, table_number: e.target.value })} placeholder="Table 1" />
            </FormField>
            <FormField label="Plus Ones">
              <Input type="number" min={0} value={form.plus_ones} onChange={(e) => setForm({ ...form, plus_ones: Number(e.target.value) })} />
            </FormField>
          </div>
          <FormField label="Group">
            <Input value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} placeholder="Family" />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Save Changes" : "Add Guest"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Guest" maxWidth="max-w-sm">
        <p className="text-sm text-gray-600">Are you sure you want to delete this guest? This action cannot be undone.</p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>Delete</Button>
        </div>
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Guests from CSV" maxWidth="max-w-2xl">
        {importStep === "upload" ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload a CSV file with columns: Name, Table Number, Plus Ones, Group. The first row should be headers.
            </p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50/50"
            >
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">Click to select a CSV file</p>
              <p className="text-xs text-gray-400 mt-1">CSV files only</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileUpload} />
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>Download Template</Button>
              <Button variant="secondary" onClick={() => setImportOpen(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">{importData.length} guests ready to import</p>
              <Button variant="ghost" size="sm" onClick={() => { setImportStep("upload"); setImportData([]); }}>Back</Button>
            </div>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Name</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Table</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Plus Ones</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Group</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((g, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-900">{g.name || "—"}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{g.table_number || "—"}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{g.plus_ones || 0}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{g.group_name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setImportOpen(false)}>Cancel</Button>
              <Button onClick={() => bulkImportMutation.mutate()} loading={bulkImportMutation.isPending}>
                Confirm Import
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast} type={toastType} onClose={() => setToast(null)} />}
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-2">{icon}<span className="text-xs font-medium text-gray-500">{label}</span></div>
      <p className={cn("text-2xl font-bold", color || "text-gray-900")}>{value}</p>
    </Card>
  );
}
