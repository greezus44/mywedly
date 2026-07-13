import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Rsvp, type RsvpStatus, type WeddingEvent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Badge, EmptyState, Toast, Modal } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { formatDate, formatTime } from "../../lib/utils";
import { Search, Check, X, Clock, Mail, Utensils, Music, User, Calendar, Download, Pencil } from "lucide-react";

const STATUS_CONFIG: Record<RsvpStatus, { label: string; variant: "success" | "error" | "warning" | "default"; icon: typeof Check }> = {
  accepted: { label: "Accepted", variant: "success", icon: Check },
  declined: { label: "Declined", variant: "error", icon: X },
  pending: { label: "Pending", variant: "warning", icon: Clock },
  tentative: { label: "Tentative", variant: "default", icon: Clock },
};

export function RsvpsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [editingRsvp, setEditingRsvp] = useState<Rsvp | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading: weddingLoading, error: weddingError } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const { data: rsvps = [], isLoading: rsvpsLoading } = useQuery({
    queryKey: ["rsvps", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase
        .from("rsvps")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Rsvp[];
    },
    enabled: !!wedding,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Rsvp> }) => {
      const { error } = await supabase.from("rsvps").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps"] });
      setToast({ message: "RSVP updated", type: "success" });
      setIsModalOpen(false);
    },
    onError: (err) => setToast({ message: err.message || "Failed to update RSVP", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rsvps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps"] });
      setToast({ message: "RSVP deleted", type: "success" });
    },
    onError: (err) => setToast({ message: err.message || "Failed to delete RSVP", type: "error" }),
  });

  const filteredRsvps = useMemo(() => {
    return rsvps.filter((r) => {
      const matchesSearch =
        !search ||
        (r.guest_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.guest_email || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesEvent = eventFilter === "all" || r.event_id === eventFilter;
      return matchesSearch && matchesStatus && matchesEvent;
    });
  }, [rsvps, search, statusFilter, eventFilter]);

  const stats = useMemo(() => ({
    total: rsvps.length,
    accepted: rsvps.filter((r) => r.status === "accepted").length,
    declined: rsvps.filter((r) => r.status === "declined").length,
    pending: rsvps.filter((r) => r.status === "pending").length,
    tentative: rsvps.filter((r) => r.status === "tentative").length,
  }), [rsvps]);

  const handleEdit = (rsvp: Rsvp) => {
    setEditingRsvp(rsvp);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this RSVP? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Guest Name", "Email", "Status", "Event", "Meal Choice", "Dietary Restrictions", "Plus One", "Song Request", "Message", "Submitted At"].join(","),
      ...filteredRsvps.map((r) => {
        const event = events.find((e) => e.id === r.event_id);
        return [
          r.guest_name || "", r.guest_email || "", r.status, event?.name || "",
          r.meal_choice || "", r.dietary_restrictions || "", r.plus_one_name || "",
          r.song_request || "", r.message || "", formatDate(r.created_at),
        ].map((v) => `"${v}"`).join(",");
      }),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rsvps.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (weddingLoading || rsvpsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="font-ui text-sm text-gray-400">Loading RSVPs...</div>
        </div>
      </AdminLayout>
    );
  }

  if (weddingError || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="font-heading text-2xl text-[var(--color-text)]">RSVPs</h1>
              <p className="font-ui text-sm text-[var(--color-text-muted)]">{stats.total} total responses</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredRsvps.length === 0}>
              <Download size={14} className="mr-1.5" />
              Export CSV
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {([
              { key: "accepted", label: "Accepted", value: stats.accepted, variant: "success" as const, icon: Check },
              { key: "declined", label: "Declined", value: stats.declined, variant: "error" as const, icon: X },
              { key: "pending", label: "Pending", value: stats.pending, variant: "warning" as const, icon: Clock },
              { key: "tentative", label: "Tentative", value: stats.tentative, variant: "default" as const, icon: Clock },
            ]).map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.key} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--color-primary)]/8 rounded-lg">
                      <Icon size={16} className={`text-[var(--color-${stat.variant === "default" ? "primary" : stat.variant})]`} />
                    </div>
                    <div>
                      <div className="font-heading text-xl text-[var(--color-text)]">{stat.value}</div>
                      <div className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">{stat.label}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
              <option value="all">All Status</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="pending">Pending</option>
              <option value="tentative">Tentative</option>
            </Select>
            <Select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="w-auto">
              <option value="all">All Events</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </div>

          {/* RSVP List */}
          {filteredRsvps.length === 0 ? (
            <Card className="p-0">
              <EmptyState
                icon={<Calendar size={32} />}
                title={search || statusFilter !== "all" || eventFilter !== "all" ? "No RSVPs found" : "No RSVPs yet"}
                description={search || statusFilter !== "all" || eventFilter !== "all" ? "Try adjusting your filters" : "Guest RSVP responses will appear here once submitted."}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRsvps.map((rsvp) => {
                const config = STATUS_CONFIG[rsvp.status];
                const StatusIcon = config.icon;
                const event = events.find((e) => e.id === rsvp.event_id);
                return (
                  <Card key={rsvp.id} className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-[var(--color-primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-heading text-base text-[var(--color-text)] truncate">
                              {rsvp.guest_name || "Unknown Guest"}
                            </h3>
                            <Badge variant={config.variant}>
                              <StatusIcon size={10} className="mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            {rsvp.guest_email && (
                              <span className="flex items-center gap-1 font-ui text-xs text-[var(--color-text-muted)]">
                                <Mail size={12} /> {rsvp.guest_email}
                              </span>
                            )}
                            {event && (
                              <span className="flex items-center gap-1 font-ui text-xs text-[var(--color-text-muted)]">
                                <Calendar size={12} /> {event.name}
                              </span>
                            )}
                            <span className="font-ui text-xs text-[var(--color-text-muted)]">
                              {formatDate(rsvp.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleEdit(rsvp)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Pencil size={14} className="text-gray-500" />
                        </button>
                        <button onClick={() => handleDelete(rsvp.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                          <X size={14} className="text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Details */}
                    {(rsvp.meal_choice || rsvp.dietary_restrictions || rsvp.plus_one_name || rsvp.song_request || rsvp.message) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                        {rsvp.meal_choice && (
                          <div className="flex items-start gap-2">
                            <Utensils size={14} className="text-[var(--color-text-muted)] mt-0.5" />
                            <div>
                              <span className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Meal: </span>
                              <span className="font-ui text-xs text-[var(--color-text)]">{rsvp.meal_choice}</span>
                            </div>
                          </div>
                        )}
                        {rsvp.dietary_restrictions && (
                          <div className="flex items-start gap-2">
                            <Utensils size={14} className="text-[var(--color-text-muted)] mt-0.5" />
                            <div>
                              <span className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Dietary: </span>
                              <span className="font-ui text-xs text-[var(--color-text)]">{rsvp.dietary_restrictions}</span>
                            </div>
                          </div>
                        )}
                        {rsvp.plus_one_name && (
                          <div className="flex items-start gap-2">
                            <User size={14} className="text-[var(--color-text-muted)] mt-0.5" />
                            <div>
                              <span className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Plus One: </span>
                              <span className="font-ui text-xs text-[var(--color-text)]">{rsvp.plus_one_name}</span>
                            </div>
                          </div>
                        )}
                        {rsvp.song_request && (
                          <div className="flex items-start gap-2">
                            <Music size={14} className="text-[var(--color-text-muted)] mt-0.5" />
                            <div>
                              <span className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Song: </span>
                              <span className="font-ui text-xs text-[var(--color-text)]">{rsvp.song_request}</span>
                            </div>
                          </div>
                        )}
                        {rsvp.message && (
                          <div className="md:col-span-2">
                            <span className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Message: </span>
                            <p className="font-body text-sm text-[var(--color-text)] mt-1 italic">"{rsvp.message}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && editingRsvp && (
        <RsvpModal
          rsvp={editingRsvp}
          events={events}
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => updateMutation.mutate({ id: editingRsvp.id, data })}
          isSaving={updateMutation.isPending}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}

function RsvpModal({
  rsvp,
  events,
  onClose,
  onSave,
  isSaving,
}: {
  rsvp: Rsvp;
  events: WeddingEvent[];
  onClose: () => void;
  onSave: (data: Partial<Rsvp>) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<Partial<Rsvp>>({
    status: rsvp.status,
    meal_choice: rsvp.meal_choice,
    dietary_restrictions: rsvp.dietary_restrictions,
    plus_one_name: rsvp.plus_one_name,
    song_request: rsvp.song_request,
    message: rsvp.message,
    event_id: rsvp.event_id,
  });

  const update = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal open={true} onClose={onClose} title="Edit RSVP" maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="p-3 bg-[var(--color-bg-light)] rounded-lg">
          <p className="font-ui text-sm text-[var(--color-text)] font-medium">{rsvp.guest_name || "Unknown Guest"}</p>
          {rsvp.guest_email && <p className="font-ui text-xs text-[var(--color-text-muted)]">{rsvp.guest_email}</p>}
        </div>

        <FormField label="Status">
          <Select value={form.status} onChange={(e) => update("status", e.target.value as RsvpStatus)}>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="tentative">Tentative</option>
          </Select>
        </FormField>

        <FormField label="Event">
          <Select value={form.event_id || ""} onChange={(e) => update("event_id", e.target.value || null)}>
            <option value="">No specific event</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
        </FormField>

        <FormField label="Meal Choice">
          <Input value={form.meal_choice || ""} onChange={(e) => update("meal_choice", e.target.value || null)} placeholder="Chicken, Beef, Vegetarian" />
        </FormField>

        <FormField label="Dietary Restrictions">
          <Input value={form.dietary_restrictions || ""} onChange={(e) => update("dietary_restrictions", e.target.value || null)} placeholder="Allergies, preferences" />
        </FormField>

        <FormField label="Plus One Name">
          <Input value={form.plus_one_name || ""} onChange={(e) => update("plus_one_name", e.target.value || null)} placeholder="Plus one name" />
        </FormField>

        <FormField label="Song Request">
          <Input value={form.song_request || ""} onChange={(e) => update("song_request", e.target.value || null)} placeholder="Song request" />
        </FormField>

        <FormField label="Message">
          <Input value={form.message || ""} onChange={(e) => update("message", e.target.value || null)} placeholder="Guest message" />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={() => onSave(form)} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
