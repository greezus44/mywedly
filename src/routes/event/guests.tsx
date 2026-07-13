import { useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  Search,
  Trash2,
  Upload,
  Mail,
  Phone,
  Users,
  Download,
} from "lucide-react";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, FormField, Skeleton, ErrorState, Toast, Modal } from "../../components/ui";
import { Input, Select } from "../../components/ui/Input";

function GuestsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [newGuest, setNewGuest] = useState({
    name: "",
    email: "",
    phone: "",
    group_name: "",
    side: "",
    plus_ones: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: event } = useQuery<UserEvent>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const { data: guests, isLoading, isError, refetch } = useQuery<EventGuest[]>({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const addMutation = useMutation({
    mutationFn: async (guest: typeof newGuest) => {
      const { data, error } = await supabase
        .from("event_guests")
        .insert({
          event_id: eventId,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          group_name: guest.group_name,
          side: guest.side,
          plus_ones: guest.plus_ones,
          rsvp_status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setAddModalOpen(false);
      setNewGuest({ name: "", email: "", phone: "", group_name: "", side: "", plus_ones: 0 });
      setToast({ message: "Guest added", type: "success" });
    },
    onError: () => setToast({ message: "Failed to add guest", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (guestId: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", guestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setToast({ message: "Guest removed", type: "success" });
    },
    onError: () => setToast({ message: "Failed to remove guest", type: "error" }),
  });

  const bulkInsertMutation = useMutation({
    mutationFn: async (rows: Array<Record<string, string>>) => {
      const records = rows.map((row) => ({
        event_id: eventId,
        name: row.name || row.Name || "",
        email: row.email || row.Email || "",
        phone: row.phone || row.Phone || "",
        group_name: row.group_name || row.group || row.Group || "",
        side: row.side || row.Side || "",
        plus_ones: parseInt(row.plus_ones || row.plus_ones || "0", 10) || 0,
        rsvp_status: "pending",
      }));
      const { data, error } = await supabase.from("event_guests").insert(records).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setToast({ message: `${data?.length || 0} guests imported`, type: "success" });
    },
    onError: () => setToast({ message: "Failed to import guests", type: "error" }),
  });

  const handleCsvImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length === 0) return;
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || "";
        });
        return row;
      });
      bulkInsertMutation.mutate(rows);
    };
    reader.readAsText(file);
  }, [bulkInsertMutation]);

  const handleAddGuest = () => {
    if (!newGuest.name.trim()) {
      setToast({ message: "Name is required", type: "error" });
      return;
    }
    addMutation.mutate(newGuest);
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

  const rsvpBadgeVariant = (status: string): "default" | "success" | "warning" | "error" => {
    switch (status) {
      case "attending": return "success";
      case "declined": return "error";
      default: return "warning";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load guests" onRetry={refetch} />;
  }

  return (
    <div>
      <div className="px-6 lg:px-8 py-6 border-b border-onyx/10 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl text-onyx">Guests</h1>
          <p className="mt-1 text-sm text-onyx/50">
            {guests?.length || 0} {guests?.length === 1 ? "guest" : "guests"} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCsvImport(file);
              e.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            size="md"
            onClick={() => fileInputRef.current?.click()}
            loading={bulkInsertMutation.isPending}
          >
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button onClick={() => setAddModalOpen(true)}>
            <UserPlus className="w-4 h-4" /> Add Guest
          </Button>
        </div>
      </div>

      <div className="p-6 lg:p-8">
        <div className="mb-6 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-onyx/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or group..."
            className="pl-10"
          />
        </div>

        {filteredGuests.length === 0 ? (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title={search ? "No matching guests" : "No guests yet"}
            description={search ? "Try a different search term" : "Add guests manually or import a CSV file"}
            action={!search && <Button onClick={() => setAddModalOpen(true)}><UserPlus className="w-4 h-4" /> Add Guest</Button>}
          />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-onyx/10">
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-onyx/60">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-onyx/60">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-onyx/60">Group</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-onyx/60">Side</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-onyx/60">RSVP</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-onyx/60">+1s</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest) => (
                    <tr key={guest.id} className="border-b border-onyx/5 hover:bg-cream/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-onyx">{guest.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {guest.email && (
                            <p className="text-xs text-onyx/60 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {guest.email}
                            </p>
                          )}
                          {guest.phone && (
                            <p className="text-xs text-onyx/60 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {guest.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-onyx/70">{guest.group_name || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-onyx/70">{guest.side || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={rsvpBadgeVariant(guest.rsvp_status)}>
                          {guest.rsvp_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-onyx/70">{guest.plus_ones}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteMutation.mutate(guest.id)}
                          className="p-1.5 text-onyx/30 hover:text-red-600 transition-colors"
                          title="Delete guest"
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
      </div>

      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Guest">
        <div className="space-y-4">
          <FormField label="Name">
            <Input
              value={newGuest.name}
              onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
              placeholder="Jane Doe"
            />
          </FormField>
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
              placeholder="+1 555-0100"
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
                <option value="bride">Bride</option>
                <option value="groom">Groom</option>
                <option value="both">Both</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Plus Ones">
            <Input
              type="number"
              min={0}
              value={newGuest.plus_ones}
              onChange={(e) => setNewGuest({ ...newGuest, plus_ones: parseInt(e.target.value, 10) || 0 })}
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddGuest} loading={addMutation.isPending}>Add Guest</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default GuestsPage;
