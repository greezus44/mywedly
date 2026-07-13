import { useState, useMemo, useRef } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import { Card, Badge, EmptyState, ErrorState, Skeleton, Toast, Toggle, FormField, Modal } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Users, Plus, Search, ArrowUpDown, Download, Upload, Trash2, Pencil, Mail, Phone } from "lucide-react";

type SortField = "name" | "table_number" | "group_name" | "rsvp_status" | "created_at" | "plus_ones";
type SortDir = "asc" | "desc";

interface GuestInput {
  name: string;
  email: string;
  phone: string;
  table_number: string;
  plus_ones: number;
  group_name: string;
}

const emptyGuest: GuestInput = { name: "", email: "", phone: "", table_number: "", plus_ones: 0, group_name: "" };

function toCsv(guests: EventGuest[]): string {
  const headers = ["Name", "Email", "Phone", "Table", "Plus Ones", "Group", "RSVP Status", "Created At"];
  const rows = guests.map((g) => [
    g.name, g.email, g.phone, g.table_number || "", String(g.plus_ones), g.group_name, g.rsvp_status, new Date(g.created_at).toISOString(),
  ]);
  return [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): GuestInput[] {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const result: GuestInput[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((m) => m.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"')) || [];
    if (cells.length >= 1) {
      result.push({
        name: cells[0] || "",
        email: cells[1] || "",
        phone: cells[2] || "",
        table_number: cells[3] || "",
        plus_ones: parseInt(cells[4] || "0", 10) || 0,
        group_name: cells[5] || "",
      });
    }
  }
  return result;
}

export default function GuestsPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventGuest | null>(null);
  const [formData, setFormData] = useState<GuestInput>(emptyGuest);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: guests, isLoading, isError, refetch } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventGuest[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation<void, Error, GuestInput>({
    mutationFn: async (input: GuestInput) => {
      if (!eventId) throw new Error("No event ID");
      const { error } = await supabase.from("event_guests").insert({ ...input, event_id: eventId, rsvp_status: "pending", token: crypto.randomUUID() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setModalOpen(false);
      setFormData(emptyGuest);
      setToast({ message: "Guest added", type: "success" });
    },
    onError: (err) => setToast({ message: err.message, type: "error" }),
  });

  const updateMutation = useMutation<void, Error, { id: string; data: Partial<GuestInput> }>({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from("event_guests").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setModalOpen(false);
      setEditing(null);
      setFormData(emptyGuest);
      setToast({ message: "Guest updated", type: "success" });
    },
    onError: (err) => setToast({ message: err.message, type: "error" }),
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setDeleteId(null);
      setToast({ message: "Guest deleted", type: "success" });
    },
    onError: (err) => setToast({ message: err.message, type: "error" }),
  });

  const bulkImportMutation = useMutation<void, Error, GuestInput[]>({
    mutationFn: async (inputs: GuestInput[]) => {
      if (!eventId) throw new Error("No event ID");
      const rows = inputs.map((input) => ({ ...input, event_id: eventId, rsvp_status: "pending", token: crypto.randomUUID() }));
      const { error } = await supabase.from("event_guests").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setImportOpen(false);
      setImportText("");
      setToast({ message: "Guests imported", type: "success" });
    },
    onError: (err) => setToast({ message: err.message, type: "error" }),
  });

  const filtered = useMemo(() => {
    if (!guests) return [];
    const sorted = [...guests].sort((a, b) => {
      let av: string | number = a[sortField] || "";
      let bv: string | number = b[sortField] || "";
      if (sortField === "plus_ones" || sortField === "created_at") {
        av = sortField === "created_at" ? new Date(a.created_at).getTime() : a.plus_ones;
        bv = sortField === "created_at" ? new Date(b.created_at).getTime() : b.plus_ones;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.group_name.toLowerCase().includes(q) ||
      (g.table_number || "").toLowerCase().includes(q)
    );
  }, [guests, search, sortField, sortDir]);

  const summary = useMemo(() => {
    if (!guests) return { total: 0, attending: 0, declined: 0, pending: 0 };
    return {
      total: guests.length,
      attending: guests.filter((g) => g.rsvp_status === "attending").length,
      declined: guests.filter((g) => g.rsvp_status === "declined").length,
      pending: guests.filter((g) => g.rsvp_status === "pending").length,
    };
  }, [guests]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const openAdd = () => {
    setEditing(null);
    setFormData(emptyGuest);
    setModalOpen(true);
  };

  const openEdit = (guest: EventGuest) => {
    setEditing(guest);
    setFormData({ name: guest.name, email: guest.email, phone: guest.phone, table_number: guest.table_number || "", plus_ones: guest.plus_ones, group_name: guest.group_name });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setToast({ message: "Name is required", type: "error" });
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleExport = () => {
    if (!guests || guests.length === 0) {
      setToast({ message: "No guests to export", type: "error" });
      return;
    }
    downloadCsv(`guests-${event?.draft_name || event?.name || "event"}.csv`, toCsv(guests));
  };

  const handleFileImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setImportText(text);
      setImportOpen(true);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = () => {
    const parsed = parseCsv(importText);
    if (parsed.length === 0) {
      setToast({ message: "No valid rows found", type: "error" });
      return;
    }
    bulkImportMutation.mutate(parsed);
  };

  if (!event) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const rsvpBadge = (status: string) => {
    const variant = status === "attending" ? "success" : status === "declined" ? "error" : "warning";
    return <Badge variant={variant as "success" | "error" | "warning"}>{status}</Badge>;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Guests</h1>
          <p className="text-sm text-slate-500">Manage your event guest list</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}><Download className="w-4 h-4" /> Export</Button>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" /> Import</Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileImport(f); e.target.value = ""; }} />
          <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Guest</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1"><Users className="w-4 h-4" /><span className="text-xs font-medium">Total</span></div>
          <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1"><span className="text-xs font-medium">Attending</span></div>
          <p className="text-2xl font-bold text-green-600">{summary.attending}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1"><span className="text-xs font-medium">Declined</span></div>
          <p className="text-2xl font-bold text-red-600">{summary.declined}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-1"><span className="text-xs font-medium">Pending</span></div>
          <p className="text-2xl font-bold text-amber-600">{summary.pending}</p>
        </Card>
      </div>

      <Card className="p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, group, or table..." className="pl-10" />
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load guests" onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users className="w-12 h-12" />} title={search ? "No matching guests" : "No guests yet"} description={search ? "Try a different search" : "Add your first guest to get started"} action={!search && <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Guest</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700" onClick={() => toggleSort("name")}>
                    <span className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700" onClick={() => toggleSort("table_number")}>
                    <span className="flex items-center gap-1">Table <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Plus Ones</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700" onClick={() => toggleSort("group_name")}>
                    <span className="flex items-center gap-1">Group <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700" onClick={() => toggleSort("rsvp_status")}>
                    <span className="flex items-center gap-1">RSVP <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{g.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        {g.email && <span className="flex items-center gap-1 text-xs"><Mail className="w-3 h-3" />{g.email}</span>}
                        {g.phone && <span className="flex items-center gap-1 text-xs"><Phone className="w-3 h-3" />{g.phone}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{g.table_number || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{g.plus_ones}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{g.group_name || "—"}</td>
                    <td className="px-4 py-3">{rsvpBadge(g.rsvp_status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(g)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(g.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
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
          <FormField label="Name">
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email">
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
            </FormField>
            <FormField label="Phone">
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Table Number">
              <Input value={formData.table_number} onChange={(e) => setFormData({ ...formData, table_number: e.target.value })} placeholder="Table 1" />
            </FormField>
            <FormField label="Plus Ones">
              <Input type="number" min={0} value={formData.plus_ones} onChange={(e) => setFormData({ ...formData, plus_ones: Number(e.target.value) })} />
            </FormField>
          </div>
          <FormField label="Group Name">
            <Input value={formData.group_name} onChange={(e) => setFormData({ ...formData, group_name: e.target.value })} placeholder="Family, Friends, etc." />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>{editing ? "Save" : "Add"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Guest">
        <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this guest? This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteId && deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}>Delete</Button>
        </div>
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Guests from CSV">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Review the CSV data below. Columns: Name, Email, Phone, Table, Plus Ones, Group.</p>
          <Textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="min-h-[200px] font-mono text-xs" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkImport} loading={bulkImportMutation.isPending}>Import</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
