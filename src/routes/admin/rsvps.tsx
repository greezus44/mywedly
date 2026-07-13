import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Rsvp, type RsvpStatus, type WeddingEvent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { formatDate, formatTime, cn } from "../../lib/utils";
import { Search, RefreshCw, CheckCircle, XCircle, Clock, HelpCircle, Calendar, Mail } from "lucide-react";

const STATUS_OPTIONS: { value: RsvpStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "tentative", label: "Tentative" },
];

const STATUS_META: Record<RsvpStatus, { icon: typeof CheckCircle; variant: "default" | "success" | "warning" | "error" }> = {
  pending: { icon: Clock, variant: "warning" },
  accepted: { icon: CheckCircle, variant: "success" },
  declined: { icon: XCircle, variant: "error" },
  tentative: { icon: HelpCircle, variant: "default" },
};

export function RsvpsPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RsvpStatus | "all">("all");
  const [eventFilter, setEventFilter] = useState<string>("all");

  const weddingQuery = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const wedding = weddingQuery.data;

  const eventsQuery = useQuery({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const events = eventsQuery.data || [];

  const rsvpsQuery = useQuery({
    queryKey: ["rsvps", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase
        .from("rsvps")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Rsvp[];
    },
    enabled: !!wedding,
  });

  const rsvps = rsvpsQuery.data || [];

  const eventMap = new Map(events.map((e) => [e.id, e]));

  const filteredRsvps = rsvps.filter((r) => {
    const matchesSearch = !search ||
      (r.guest_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.guest_email || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesEvent = eventFilter === "all" || r.event_id === eventFilter;
    return matchesSearch && matchesStatus && matchesEvent;
  });

  const statusCounts = {
    total: rsvps.length,
    pending: rsvps.filter((r) => r.status === "pending").length,
    accepted: rsvps.filter((r) => r.status === "accepted").length,
    declined: rsvps.filter((r) => r.status === "declined").length,
    tentative: rsvps.filter((r) => r.status === "tentative").length,
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RsvpStatus }) => {
      const { data, error } = await supabase
        .from("rsvps")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Rsvp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps"] });
      setToast({ message: "RSVP status updated", type: "success" });
    },
    onError: () => setToast({ message: "Failed to update RSVP", type: "error" }),
  });

  if (weddingQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-20">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary)]" />
        </div>
      </AdminLayout>
    );
  }

  if (weddingQuery.isError || !wedding) {
    return (
      <AdminLayout>
        <div className="p-8">
          <EmptyState title="Unable to load RSVPs" description="Please try again later." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--color-bg)]">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-heading text-2xl text-[var(--color-text)] mb-1">RSVPs</h1>
            <p className="font-ui text-sm text-[var(--color-text-muted)]">{rsvps.length} total RSVP{rsvps.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <Card className="p-4">
              <div className="font-heading text-2xl text-[var(--color-text)] mb-1">{statusCounts.total}</div>
              <div className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Total</div>
            </Card>
            <Card className="p-4">
              <div className="font-heading text-2xl text-[var(--color-warning)] mb-1">{statusCounts.pending}</div>
              <div className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Pending</div>
            </Card>
            <Card className="p-4">
              <div className="font-heading text-2xl text-[var(--color-success)] mb-1">{statusCounts.accepted}</div>
              <div className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Accepted</div>
            </Card>
            <Card className="p-4">
              <div className="font-heading text-2xl text-[var(--color-error)] mb-1">{statusCounts.declined}</div>
              <div className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Declined</div>
            </Card>
            <Card className="p-4">
              <div className="font-heading text-2xl text-[var(--color-primary)] mb-1">{statusCounts.tentative}</div>
              <div className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Tentative</div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)]/30 text-[var(--color-text)] font-ui text-sm rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RsvpStatus | "all")}
              className="w-auto min-w-[140px]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-auto min-w-[140px]"
            >
              <option value="all">All Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </Select>
          </div>

          {/* RSVP Table */}
          {rsvpsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw size={20} className="animate-spin text-[var(--color-primary)]" />
            </div>
          ) : filteredRsvps.length === 0 ? (
            <Card className="p-8">
              <EmptyState
                icon={<Mail size={32} />}
                title={search || statusFilter !== "all" || eventFilter !== "all" ? "No RSVPs found" : "No RSVPs yet"}
                description={search || statusFilter !== "all" || eventFilter !== "all" ? "Try different filters." : "RSVPs from guests will appear here."}
              />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]/15 bg-[var(--color-bg)]/50">
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Guest</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)] hidden md:table-cell">Event</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)] hidden lg:table-cell">Date</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Status</th>
                      <th className="text-right px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRsvps.map((rsvp) => {
                      const event = rsvp.event_id ? eventMap.get(rsvp.event_id) : null;
                      const StatusIcon = STATUS_META[rsvp.status].icon;
                      return (
                        <tr key={rsvp.id} className="border-b border-[var(--color-border)]/10 last:border-0 hover:bg-[var(--color-bg)]/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-ui text-sm text-[var(--color-text)]">{rsvp.guest_name || "Unknown Guest"}</div>
                            {rsvp.guest_email && (
                              <div className="font-ui text-xs text-[var(--color-text-muted)]">{rsvp.guest_email}</div>
                            )}
                            {rsvp.plus_one_name && (
                              <div className="font-ui text-xs text-[var(--color-primary)] mt-0.5">+1: {rsvp.plus_one_name}</div>
                            )}
                            {rsvp.message && (
                              <div className="font-ui text-xs text-[var(--color-text-muted)] mt-1 italic max-w-xs truncate">"{rsvp.message}"</div>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {event ? (
                              <div>
                                <div className="font-ui text-sm text-[var(--color-text)]">{event.name}</div>
                                {event.starts_at && (
                                  <div className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                                    <Calendar size={10} /> {formatDate(event.starts_at)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="font-ui text-xs text-[var(--color-text-muted)]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="font-ui text-xs text-[var(--color-text-muted)]">
                              {formatDate(rsvp.created_at)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={STATUS_META[rsvp.status].variant}>
                              <StatusIcon size={12} className="mr-1" />
                              {rsvp.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Select
                              value={rsvp.status}
                              onChange={(e) => updateStatusMutation.mutate({ id: rsvp.id, status: e.target.value as RsvpStatus })}
                              className="w-auto min-w-[130px] text-xs py-2"
                            >
                              <option value="pending">Pending</option>
                              <option value="accepted">Accepted</option>
                              <option value="declined">Declined</option>
                              <option value="tentative">Tentative</option>
                            </Select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
