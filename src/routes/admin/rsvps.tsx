import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Check, X, Clock, Calendar, Users, HelpCircle } from "lucide-react";
import { supabase, type Wedding, type Rsvp, type RsvpStatus, type WeddingEvent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { formatDate, cn } from "../../lib/utils";

const STATUS_OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "tentative", label: "Tentative" },
];

function StatusIcon({ status }: { status: RsvpStatus }) {
  switch (status) {
    case "accepted": return <Check size={14} />;
    case "declined": return <X size={14} />;
    case "tentative": return <HelpCircle size={14} />;
    default: return <Clock size={14} />;
  }
}

function statusBadgeVariant(status: RsvpStatus): "default" | "success" | "warning" | "error" {
  switch (status) {
    case "accepted": return "success";
    case "declined": return "error";
    case "tentative": return "warning";
    default: return "default";
  }
}

export function RsvpsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RsvpStatus | "all">("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading: wLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("starts_at", { ascending: true });
      if (error) throw error;
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const { data: rsvps, isLoading: rLoading } = useQuery({
    queryKey: ["rsvps", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase.from("rsvps").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Rsvp[];
    },
    enabled: !!wedding,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RsvpStatus }) => {
      const { error } = await supabase.from("rsvps").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps", wedding?.id] });
      setToast({ message: "RSVP status updated", type: "success" });
    },
    onError: () => setToast({ message: "Failed to update RSVP", type: "error" }),
  });

  const eventMap = new Map((events || []).map((e) => [e.id, e.name]));

  const filteredRsvps = (rsvps || []).filter((r) => {
    const matchesSearch =
      (r.guest_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.guest_email || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.message || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesEvent = eventFilter === "all" || r.event_id === eventFilter;
    return matchesSearch && matchesStatus && matchesEvent;
  });

  const stats = {
    total: rsvps?.length || 0,
    accepted: rsvps?.filter((r) => r.status === "accepted").length || 0,
    declined: rsvps?.filter((r) => r.status === "declined").length || 0,
    pending: rsvps?.filter((r) => r.status === "pending").length || 0,
    tentative: rsvps?.filter((r) => r.status === "tentative").length || 0,
  };

  if (wLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Wedding not found</p>
        </div>
      </AdminLayout>
    );
  }

  const loading = wLoading || rLoading;

  const statCards = [
    { label: "Total RSVPs", value: stats.total, icon: Users, variant: "default" as const },
    { label: "Accepted", value: stats.accepted, icon: Check, variant: "success" as const },
    { label: "Declined", value: stats.declined, icon: X, variant: "error" as const },
    { label: "Pending", value: stats.pending, icon: Clock, variant: "warning" as const },
  ];

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-6">
            <h1 className="font-heading text-3xl text-[var(--color-text)] mb-1">RSVPs</h1>
            <p className="font-ui text-sm text-[var(--color-text-muted)]">Manage guest RSVP responses</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-[var(--color-primary)]/8">
                      <Icon size={16} className="text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <p className="font-heading text-2xl text-[var(--color-text)]">{stat.value}</p>
                      <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">{stat.label}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or message..."
                className="pl-11"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RsvpStatus | "all")}
              className="max-w-[160px]"
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
            <Select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="max-w-[200px]"
            >
              <option value="all">All Events</option>
              {(events || []).map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-5 w-40 bg-gray-100 rounded mb-3" />
                  <div className="h-4 w-60 bg-gray-100 rounded" />
                </Card>
              ))}
            </div>
          ) : filteredRsvps.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]/15 bg-[var(--color-bg)]/50">
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">Guest</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] hidden md:table-cell">Event</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">Status</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] hidden lg:table-cell">Message</th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] hidden xl:table-cell">Date</th>
                      <th className="text-right px-4 py-3 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRsvps.map((rsvp) => (
                      <tr key={rsvp.id} className="border-b border-[var(--color-border)]/10 last:border-0 hover:bg-[var(--color-bg)]/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-ui text-sm font-medium text-[var(--color-text)]">{rsvp.guest_name || "Unknown"}</p>
                          {rsvp.guest_email && <p className="font-ui text-xs text-[var(--color-text-muted)]">{rsvp.guest_email}</p>}
                          {rsvp.plus_one_name && <p className="font-ui text-xs text-[var(--color-text-muted)]">+1: {rsvp.plus_one_name}</p>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="font-ui text-sm text-[var(--color-text-muted)]">
                            {rsvp.event_id ? eventMap.get(rsvp.event_id) || "Unknown event" : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant(rsvp.status)}>
                            <span className="flex items-center gap-1"><StatusIcon status={rsvp.status} /> {rsvp.status}</span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell max-w-xs">
                          {rsvp.message ? (
                            <p className="font-ui text-xs text-[var(--color-text-muted)] truncate">{rsvp.message}</p>
                          ) : (
                            <span className="font-ui text-xs text-[var(--color-text-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className="font-ui text-xs text-[var(--color-text-muted)]">
                            {new Date(rsvp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: rsvp.id, status: "accepted" })}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                rsvp.status === "accepted"
                                  ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                                  : "hover:bg-[var(--color-success)]/10 text-[var(--color-text-muted)] hover:text-[var(--color-success)]"
                              )}
                              title="Mark as accepted"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: rsvp.id, status: "declined" })}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                rsvp.status === "declined"
                                  ? "bg-[var(--color-error)]/15 text-[var(--color-error)]"
                                  : "hover:bg-[var(--color-error)]/10 text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                              )}
                              title="Mark as declined"
                            >
                              <X size={14} />
                            </button>
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: rsvp.id, status: "pending" })}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                rsvp.status === "pending"
                                  ? "bg-[var(--color-warning)]/15 text-[var(--color-warning)]"
                                  : "hover:bg-[var(--color-warning)]/10 text-[var(--color-text-muted)] hover:text-[var(--color-warning)]"
                              )}
                              title="Mark as pending"
                            >
                              <Clock size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : search || statusFilter !== "all" || eventFilter !== "all" ? (
            <EmptyState
              icon={<Search size={32} />}
              title="No RSVPs found"
              description="No RSVPs match your current filters"
            />
          ) : (
            <EmptyState
              icon={<Calendar size={32} />}
              title="No RSVPs yet"
              description="Guest RSVP responses will appear here once they start responding"
            />
          )}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
