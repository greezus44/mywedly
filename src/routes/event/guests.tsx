import { useState, useRef } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, Skeleton, ErrorState, Modal, Toast } from "../../components/ui";
import { Input, Select } from "../../components/ui/Input";
import { Users, Plus, Trash2, Search, Upload, Download, Mail } from "lucide-react";
import { cn } from "../../lib/utils";

interface OutletContext { event: UserEvent; }

export default function GuestsPage() {
  const { event } = useOutletContext<OutletContext>();
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [newGuest, setNewGuest] = useState({
    name: "",
    email: "",
    phone: "",
    group_name: "",
    side: "Bride",
  });

  const { data: guests, isLoading, error } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const token = crypto.randomUUID();
      const { error } = await supabase.from("event_guests").insert({
        event_id: eventId,
        name: newGuest.name,
        email: newGuest.email,
        phone: newGuest.phone,
        group_name: newGuest.group_name,
        side: newGuest.side,
        token,
        rsvp_status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setShowAdd(false);
      setNewGuest({ name: "", email: "", phone: "", group_name: "", side: "Bride" });
      setToast({ msg: "Guest added", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to add guest: ${err.message}`, type: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setDeleteId(null);
      setToast({ msg: "Guest deleted", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to delete: ${err.message}`, type: "error" });
      setDeleteId(null);
    },
  });

  const importMutation = useMutation({
    mutationFn: async (rows: { name: string; email: string; phone: string; group_name: string; side: string }[]) => {
      const toInsert = rows.map((r) => ({
        event_id: eventId,
        name: r.name,
        email: r.email || "",
        phone: r.phone || "",
        group_name: r.group_name || "",
        side: r.side || "Bride",
        token: crypto.randomUUID(),
        rsvp_status: "pending",
      }));
      const { error } = await supabase.from("event_guests").insert(toInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setShowImport(false);
      setToast({ msg: "Guests imported", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Import failed: ${err.message}`, type: "error" });
    },
  });

  const handleCsvImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        setToast({ msg: "CSV needs a header row and at least one guest", type: "error" });
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ""; });
        return {
          name: row.name || row["name"] || "",
          email: row.email || "",
          phone: row.phone || "",
          group_name: row.group_name || row.group || "",
          side: row.side || "Bride",
        };
      }).filter((r) => r.name);
      if (rows.length === 0) {
        setToast({ msg: "No valid guests found in CSV", type: "error" });
        return;
      }
      importMutation.mutate(rows);
    };
    reader.readAsText(file);
  };

  const filtered = (guests || []).filter((g) => {
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q) || g.group_name.toLowerCase().includes(q);
  });

  const rsvpBadgeVariant = (status: string): "default" | "success" | "warning" | "error" => {
    if (status === "attending") return "success";
    if (status === "declined") return "error";
    return "warning";
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-64" /></div>;
  if (error) return <ErrorState message={error.message} onRetry={() => queryClient.invalidateQueries({ queryKey: ["guests", eventId] })} />;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-heading text-2xl text-gray-900">Guests</h2>
          <p className="text-sm text-gray-500 mt-1">{guests?.length || 0} total guests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Add Guest
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or group..."
          className="pl-10"
        />
      </div>

      {!filtered.length ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title={search ? "No guests found" : "No guests yet"}
          description={search ? "Try a different search term." : "Add guests manually or import a CSV file."}
          action={!search ? <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Guest</Button> : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 px-4 py-3">Name</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 px-4 py-3">Email</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 px-4 py-3">Phone</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 px-4 py-3">Group</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 px-4 py-3">Side</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 px-4 py-3">RSVP</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{g.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{g.email || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{g.phone || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{g.group_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{g.side}</td>
                    <td className="px-4 py-3">
                      <Badge variant={rsvpBadgeVariant(g.rsvp_status)}>{g.rsvp_status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteId(g.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Guest Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Guest">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">Name</label>
            <Input value={newGuest.name} onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">Email</label>
            <Input type="email" value={newGuest.email} onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })} placeholder="jane@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">Phone</label>
            <Input value={newGuest.phone} onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })} placeholder="555-1234" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">Group</label>
            <Input value={newGuest.group_name} onChange={(e) => setNewGuest({ ...newGuest, group_name: e.target.value })} placeholder="Family" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">Side</label>
            <Select value={newGuest.side} onChange={(e) => setNewGuest({ ...newGuest, side: e.target.value })}>
              <option value="Bride">Bride</option>
              <option value="Groom">Groom</option>
              <option value="Both">Both</option>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => addMutation.mutate()} loading={addMutation.isPending} disabled={!newGuest.name}>
              Add Guest
            </Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Import CSV Modal */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import Guests from CSV">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload a CSV file with columns: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">name, email, phone, group_name, side</code>
          </p>
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-gray-400 cursor-pointer p-8 rounded-lg transition-colors"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Click to select a CSV file</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleCsvImport(f);
              e.target.value = "";
            }}
          />
          {importMutation.isPending && <p className="text-sm text-gray-500">Importing...</p>}
          <Button variant="ghost" onClick={() => setShowImport(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Guest">
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to remove this guest?</p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => deleteMutation.mutate(deleteId!)} loading={deleteMutation.isPending}>
            Delete
          </Button>
          <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
