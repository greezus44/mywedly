import { useState, useMemo, useRef } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, FormField, Modal, Toast, ErrorState, Skeleton } from "../../components/ui";
import { Input } from "../../components/ui/Input";
import { UserPlus, Search, Trash2, Upload, Download, Users, Mail, Phone } from "lucide-react";

interface NewGuest {
  name: string;
  email: string;
  phone: string;
  group_name: string;
  side: string;
}

const EMPTY_GUEST: NewGuest = { name: "", email: "", phone: "", group_name: "", side: "" };

function GuestsPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGuest, setNewGuest] = useState<NewGuest>(EMPTY_GUEST);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    mutationFn: async (guest: NewGuest) => {
      const { error } = await supabase.from("event_guests").insert({
        event_id: eventId,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        group_name: guest.group_name,
        side: guest.side,
        token: crypto.randomUUID(),
        rsvp_status: "pending",
        plus_ones: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setShowAddModal(false);
      setNewGuest(EMPTY_GUEST);
      setToastType("success");
      setToast("Guest added successfully");
    },
    onError: (err: Error) => {
      setToastType("error");
      setToast(`Failed to add guest: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToastType("success");
      setToast("Guest removed");
    },
    onError: (err: Error) => {
      setToastType("error");
      setToast(`Failed to remove: ${err.message}`);
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: async (rows: NewGuest[]) => {
      const inserts = rows.map((r) => ({
        event_id: eventId,
        name: r.name,
        email: r.email,
        phone: r.phone,
        group_name: r.group_name,
        side: r.side,
        token: crypto.randomUUID(),
        rsvp_status: "pending",
        plus_ones: 0,
      }));
      const { error } = await supabase.from("event_guests").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setToastType("success");
      setToast("Guests imported successfully");
    },
    onError: (err: Error) => {
      setToastType("error");
      setToast(`Import failed: ${err.message}`);
    },
  });

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    const q = search.toLowerCase().trim();
    if (!q) return guests;
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q) ||
        g.group_name.toLowerCase().includes(q)
    );
  }, [guests, search]);

  const stats = useMemo(() => {
    if (!guests) return { total: 0, attending: 0, declined: 0, pending: 0 };
    return {
      total: guests.length,
      attending: guests.filter((g) => g.rsvp_status === "attending").length,
      declined: guests.filter((g) => g.rsvp_status === "declined").length,
      pending: guests.filter((g) => g.rsvp_status === "pending").length,
    };
  }, [guests]);

  const handleAdd = () => {
    if (!newGuest.name.trim()) {
      setToastType("error");
      setToast("Name is required");
      return;
    }
    addMutation.mutate(newGuest);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const rows: NewGuest[] = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim());
        return {
          name: cols[0] || "",
          email: cols[1] || "",
          phone: cols[2] || "",
          group_name: cols[3] || "",
          side: cols[4] || "",
        };
      }).filter((r) => r.name);
      if (rows.length === 0) {
        setToastType("error");
        setToast("No valid rows found in CSV");
        return;
      }
      importCsvMutation.mutate(rows);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const exportCsv = () => {
    if (!guests || guests.length === 0) return;
    const header = "Name,Email,Phone,Group,Side,RSVP Status,Plus Ones,Dietary,Message\n";
    const rows = guests.map((g) =>
      [
        g.name,
        g.email,
        g.phone,
        g.group_name,
        g.side,
        g.rsvp_status,
        g.plus_ones,
        g.dietary,
        g.message,
      ]
        .map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`)
        .join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.draft_name || event.name || "event"}-guests.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const rsvpBadge = (status: string) => {
    if (status === "attending") return <Badge variant="success">Attending</Badge>;
    if (status === "declined") return <Badge variant="error">Declined</Badge>;
    return <Badge variant="warning">Pending</Badge>;
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading text-2xl text-[var(--color-text)]">Guests</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{stats.total} total guests</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importCsvMutation.isPending}>
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={!guests || guests.length === 0}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-3.5 h-3.5" /> Add Guest
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "var(--color-text)" },
          { label: "Attending", value: stats.attending, color: "#16a34a" },
          { label: "Declined", value: stats.declined, color: "#dc2626" },
          { label: "Pending", value: stats.pending, color: "#d97706" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">{s.label}</p>
            <p className="text-2xl font-heading mt-1" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, or group..."
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => queryClient.invalidateQueries({ queryKey: ["guests", eventId] })} />
        ) : filteredGuests.length === 0 ? (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title={search ? "No guests found" : "No guests yet"}
            description={search ? "Try a different search term" : "Add your first guest or import from CSV"}
            action={!search ? <Button size="sm" onClick={() => setShowAddModal(true)}><UserPlus className="w-3.5 h-3.5" /> Add Guest</Button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
                  <th className="text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)] px-4 py-3 font-medium">Name</th>
                  <th className="text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)] px-4 py-3 font-medium hidden md:table-cell">Contact</th>
                  <th className="text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)] px-4 py-3 font-medium hidden lg:table-cell">Group</th>
                  <th className="text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)] px-4 py-3 font-medium">RSVP</th>
                  <th className="text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)] px-4 py-3 font-medium hidden lg:table-cell">Plus Ones</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((g) => (
                  <tr key={g.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-[var(--color-text)]">{g.name}</span>
                      {g.side && <span className="text-xs text-[var(--color-text-muted)] block">{g.side}</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {g.email && <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1"><Mail className="w-3 h-3" />{g.email}</span>}
                        {g.phone && <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1"><Phone className="w-3 h-3" />{g.phone}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-[var(--color-text-muted)]">{g.group_name || "—"}</span>
                    </td>
                    <td className="px-4 py-3">{rsvpBadge(g.rsvp_status)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-[var(--color-text-muted)]">{g.plus_ones}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(g.id)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
                        style={{ borderRadius: "var(--radius)" }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Guest Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Guest">
        <div className="space-y-4">
          <FormField label="Name" hint="Required">
            <Input
              value={newGuest.name}
              onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
              placeholder="Jane Doe"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email">
              <Input
                type="email"
                value={newGuest.email}
                onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                placeholder="jane@example.com"
              />
            </FormField>
            <FormField label="Phone">
              <Input
                value={newGuest.phone}
                onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Group">
              <Input
                value={newGuest.group_name}
                onChange={(e) => setNewGuest({ ...newGuest, group_name: e.target.value })}
                placeholder="Family"
              />
            </FormField>
            <FormField label="Side">
              <Input
                value={newGuest.side}
                onChange={(e) => setNewGuest({ ...newGuest, side: e.target.value })}
                placeholder="Bride / Groom"
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} loading={addMutation.isPending}>Add Guest</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} type={toastType} onClose={() => setToast(null)} />}
    </div>
  );
}

export default GuestsPage;
