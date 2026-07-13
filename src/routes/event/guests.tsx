import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Badge,
  EmptyState,
  FormField,
  Modal,
  Toast,
  ErrorState,
  Skeleton,
} from "../../components/ui";
import { Input, Select } from "../../components/ui/Input";
import {
  Users,
  Plus,
  Search,
  Trash2,
  Upload,
  Download,
  UserPlus,
} from "lucide-react";

interface NewGuest {
  name: string;
  email: string;
  phone: string;
  group_name: string;
  side: string;
  plus_ones: number;
}

const emptyGuest: NewGuest = {
  name: "",
  email: "",
  phone: "",
  group_name: "",
  side: "",
  plus_ones: 0,
};

function parseCsv(text: string): NewGuest[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const guests: NewGuest[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < 1 || !cols[0]) continue;
    const get = (key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? cols[idx] || "" : "";
    };
    guests.push({
      name: get("name") || cols[0] || "",
      email: get("email"),
      phone: get("phone"),
      group_name: get("group_name") || get("group"),
      side: get("side"),
      plus_ones: parseInt(get("plus_ones") || "0", 10) || 0,
    });
  }
  return guests;
}

function downloadCsvTemplate() {
  const csv = "name,email,phone,group_name,side,plus_ones\nJohn Doe,john@example.com,555-0100,Family,Groom,0\n";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "guest-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function GuestsPage() {
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGuest, setNewGuest] = useState<NewGuest>(emptyGuest);
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: guests, isLoading, error } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EventGuest[];
    },
    enabled: !!eventId,
  });

  const addGuestMutation = useMutation({
    mutationFn: async (guest: NewGuest) => {
      if (!eventId) return;
      const { error } = await supabase.from("event_guests").insert({
        event_id: eventId,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        group_name: guest.group_name,
        side: guest.side,
        plus_ones: guest.plus_ones,
        rsvp_status: "pending",
        token: crypto.randomUUID(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setShowAddModal(false);
      setNewGuest(emptyGuest);
      setToast("Guest added");
    },
    onError: (err: Error) => {
      setToastError(err.message);
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (guests: NewGuest[]) => {
      if (!eventId || guests.length === 0) return;
      const rows = guests.map((g) => ({
        event_id: eventId,
        name: g.name,
        email: g.email,
        phone: g.phone,
        group_name: g.group_name,
        side: g.side,
        plus_ones: g.plus_ones,
        rsvp_status: "pending",
        token: crypto.randomUUID(),
      }));
      const { error } = await supabase.from("event_guests").insert(rows);
      if (error) throw error;
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setToast(`Imported ${vars.length} guests`);
    },
    onError: (err: Error) => {
      setToastError(err.message);
    },
  });

  const deleteGuestMutation = useMutation({
    mutationFn: async (guestId: string) => {
      const { error } = await supabase
        .from("event_guests")
        .delete()
        .eq("id", guestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setToast("Guest removed");
    },
    onError: (err: Error) => {
      setToastError(err.message);
    },
  });

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        setToastError("No valid guests found in CSV");
        return;
      }
      bulkImportMutation.mutate(parsed);
    };
    reader.onerror = () => setToastError("Failed to read file");
    reader.readAsText(file);
    e.target.value = "";
  };

  const filteredGuests = (guests || []).filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      (g.group_name || "").toLowerCase().includes(q)
    );
  });

  const rsvpVariant = (status: EventGuest["rsvp_status"]) => {
    if (status === "attending") return "success" as const;
    if (status === "declined") return "error" as const;
    return "default" as const;
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-12 w-48 mb-4" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorState message={error.message} onRetry={() => queryClient.invalidateQueries({ queryKey: ["guests", eventId] })} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Guests</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {guests?.length || 0} total guests
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={downloadCsvTemplate}>
            <Download className="w-3.5 h-3.5" /> Template
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            loading={bulkImportMutation.isPending}
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Guest
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileImport}
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or group…"
          className="pl-10"
        />
      </div>

      {/* Table */}
      {filteredGuests.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title={search ? "No matching guests" : "No guests yet"}
            description={search ? "Try a different search term" : "Add guests individually or import from CSV"}
            action={
              !search ? (
                <Button onClick={() => setShowAddModal(true)}>
                  <UserPlus className="w-4 h-4" /> Add Your First Guest
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Group</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Side</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">RSVP</th>
                  <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">+1s</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr
                    key={guest.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-[var(--color-text)] font-medium">{guest.name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">{guest.email || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">{guest.phone || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">{guest.group_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">{guest.side || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={rsvpVariant(guest.rsvp_status)}>
                        {guest.rsvp_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-[var(--color-text-muted)]">{guest.plus_ones}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteGuestMutation.mutate(guest.id)}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
                        style={{ borderRadius: "var(--radius)" }}
                        title="Remove guest"
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
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Guest"
      >
        <div className="space-y-4">
          <FormField label="Name">
            <Input
              value={newGuest.name}
              onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
              placeholder="Full name"
            />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              value={newGuest.email}
              onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
              placeholder="email@example.com"
            />
          </FormField>
          <FormField label="Phone">
            <Input
              value={newGuest.phone}
              onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
              placeholder="555-0100"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Group">
              <Input
                value={newGuest.group_name}
                onChange={(e) => setNewGuest({ ...newGuest, group_name: e.target.value })}
                placeholder="Family"
              />
            </FormField>
            <FormField label="Side">
              <Select
                value={newGuest.side}
                onChange={(e) => setNewGuest({ ...newGuest, side: e.target.value })}
              >
                <option value="">—</option>
                <option value="Groom">Groom</option>
                <option value="Bride">Bride</option>
                <option value="Both">Both</option>
                <option value="Other">Other</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Plus Ones">
            <Input
              type="number"
              min={0}
              max={10}
              value={newGuest.plus_ones}
              onChange={(e) => setNewGuest({ ...newGuest, plus_ones: parseInt(e.target.value, 10) || 0 })}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addGuestMutation.mutate(newGuest)}
              loading={addGuestMutation.isPending}
              disabled={!newGuest.name.trim()}
            >
              Add Guest
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {toastError && <Toast message={toastError} type="error" onClose={() => setToastError(null)} />}
    </div>
  );
}
