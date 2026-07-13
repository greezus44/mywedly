import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  Filter,
} from "lucide-react";
import {
  supabase,
  type Wedding,
  type Rsvp,
  type WeddingEvent,
  type Guest,
  type RsvpStatus,
} from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { formatDate, formatTime, cn } from "../../lib/utils";
import { useLang } from "../../lib/lang-context";

const STATUS_CONFIG: Record<
  RsvpStatus,
  { label: string; variant: "success" | "error" | "warning" | "default"; icon: typeof CheckCircle2 }
> = {
  accepted: { label: "Accepted", variant: "success", icon: CheckCircle2 },
  declined: { label: "Declined", variant: "error", icon: XCircle },
  pending: { label: "Pending", variant: "warning", icon: Clock },
  tentative: { label: "Tentative", variant: "default", icon: HelpCircle },
};

export function RsvpsPage() {
  const queryClient = useQueryClient();
  const { lang } = useLang();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [statusFilter, setStatusFilter] = useState<RsvpStatus | "all">("all");
  const [eventFilter, setEventFilter] = useState<string>("all");

  const { data: wedding, isLoading: weddingLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("created_by", user.user.id)
        .single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const { data: guests = [] } = useQuery({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("wedding_id", wedding.id);
      if (error) throw error;
      return data as Guest[];
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RsvpStatus }) => {
      const { error } = await supabase
        .from("rsvps")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps"] });
      setToast({ message: "RSVP status updated!", type: "success" });
    },
    onError: () => setToast({ message: "Failed to update RSVP", type: "error" }),
  });

  // Build a lookup map for events and guests
  const eventMap = useMemo(() => {
    const map = new Map<string, WeddingEvent>();
    events.forEach((e) => map.set(e.id, e));
    return map;
  }, [events]);

  const guestMap = useMemo(() => {
    const map = new Map<string, Guest>();
    guests.forEach((g) => map.set(g.id, g));
    return map;
  }, [guests]);

  // Enriched RSVPs with event and guest info
  const enrichedRsvps = useMemo(() => {
    return rsvps.map((rsvp) => {
      const event = rsvp.event_id ? eventMap.get(rsvp.event_id) : undefined;
      const guest = guestMap.get(rsvp.guest_id);
      return {
        ...rsvp,
        event,
        guest,
        displayName: rsvp.guest_name || guest?.full_name || "Unknown Guest",
      };
    });
  }, [rsvps, eventMap, guestMap]);

  const filteredRsvps = useMemo(() => {
    return enrichedRsvps.filter((rsvp) => {
      const matchesStatus = statusFilter === "all" || rsvp.status === statusFilter;
      const matchesEvent = eventFilter === "all" || rsvp.event_id === eventFilter;
      return matchesStatus && matchesEvent;
    });
  }, [enrichedRsvps, statusFilter, eventFilter]);

  const stats = useMemo(() => {
    return {
      total: rsvps.length,
      accepted: rsvps.filter((r) => r.status === "accepted").length,
      declined: rsvps.filter((r) => r.status === "declined").length,
      pending: rsvps.filter((r) => r.status === "pending").length,
      tentative: rsvps.filter((r) => r.status === "tentative").length,
    };
  }, [rsvps]);

  const handleStatusChange = (id: string, status: RsvpStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const isLoading = weddingLoading || eventsLoading || rsvpsLoading;

  if (isLoading || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading RSVPs...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-primary)] mb-2">
              RSVPs
            </p>
            <h1 className="font-heading text-3xl text-[var(--color-text)]">RSVP Manager</h1>
            <p className="font-ui text-sm text-[var(--color-text-muted)] mt-1">
              Track and manage guest responses for all events.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <Card className="p-4 text-center">
              <Users size={18} className="mx-auto mb-1 text-[var(--color-primary)]" />
              <p className="font-heading text-2xl text-[var(--color-text)]">{stats.total}</p>
              <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Total
              </p>
            </Card>
            <Card className="p-4 text-center">
              <CheckCircle2 size={18} className="mx-auto mb-1 text-[var(--color-success)]" />
              <p className="font-heading text-2xl text-[var(--color-success)]">{stats.accepted}</p>
              <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Accepted
              </p>
            </Card>
            <Card className="p-4 text-center">
              <XCircle size={18} className="mx-auto mb-1 text-[var(--color-error)]" />
              <p className="font-heading text-2xl text-[var(--color-error)]">{stats.declined}</p>
              <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Declined
              </p>
            </Card>
            <Card className="p-4 text-center">
              <Clock size={18} className="mx-auto mb-1 text-[var(--color-warning)]" />
              <p className="font-heading text-2xl text-[var(--color-warning)]">{stats.pending}</p>
              <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Pending
              </p>
            </Card>
            <Card className="p-4 text-center">
              <HelpCircle size={18} className="mx-auto mb-1 text-[var(--color-text-muted)]" />
              <p className="font-heading text-2xl text-[var(--color-text)]">{stats.tentative}</p>
              <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Tentative
              </p>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <Filter size={16} className="text-[var(--color-text-muted)]" />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RsvpStatus | "all")}
              className="w-40"
            >
              <option value="all">All Statuses</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="pending">Pending</option>
              <option value="tentative">Tentative</option>
            </Select>
            <Select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-48"
            >
              <option value="all">All Events</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
            {(statusFilter !== "all" || eventFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setEventFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* RSVP List */}
          {filteredRsvps.length === 0 ? (
            <EmptyState
              icon={<Calendar size={32} />}
              title={rsvps.length === 0 ? "No RSVPs yet" : "No RSVPs match your filters"}
              description={
                rsvps.length === 0
                  ? "RSVPs will appear here once guests respond to your invitation."
                  : "Try adjusting your filters to see more results."
              }
            />
          ) : (
            <Card className="overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]/15">
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        Guest
                      </th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        Event
                      </th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        Plus One
                      </th>
                      <th className="text-left px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        Submitted
                      </th>
                      <th className="text-right px-4 py-3 font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                        Update Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRsvps.map((rsvp) => {
                      const config = STATUS_CONFIG[rsvp.status];
                      const StatusIcon = config.icon;
                      return (
                        <tr
                          key={rsvp.id}
                          className="border-b border-[var(--color-border)]/10 hover:bg-[var(--color-bg-light)] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p className="font-ui text-sm font-medium text-[var(--color-text)]">
                              {rsvp.displayName}
                            </p>
                            {rsvp.guest_email && (
                              <p className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                                <Mail size={11} /> {rsvp.guest_email}
                              </p>
                            )}
                            {rsvp.message && (
                              <p className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                                <MessageSquare size={11} /> {rsvp.message}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {rsvp.event ? (
                              <div>
                                <p className="font-ui text-sm text-[var(--color-text)]">
                                  {rsvp.event.name}
                                </p>
                                {rsvp.event.starts_at && (
                                  <p className="font-ui text-xs text-[var(--color-text-muted)]">
                                    {formatDate(rsvp.event.starts_at, lang)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="font-ui text-xs text-[var(--color-text-muted)]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={config.variant}>
                              <StatusIcon size={11} className="mr-1" />
                              {config.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {rsvp.plus_one_name ? (
                              <span className="font-ui text-sm text-[var(--color-text)]">
                                {rsvp.plus_one_name}
                              </span>
                            ) : (
                              <span className="font-ui text-xs text-[var(--color-text-muted)]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-ui text-xs text-[var(--color-text-muted)]">
                              {formatDate(rsvp.created_at, lang)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Select
                              value={rsvp.status}
                              onChange={(e) =>
                                handleStatusChange(rsvp.id, e.target.value as RsvpStatus)
                              }
                              className="w-32 ml-auto"
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

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-[var(--color-border)]/10">
                {filteredRsvps.map((rsvp) => {
                  const config = STATUS_CONFIG[rsvp.status];
                  const StatusIcon = config.icon;
                  return (
                    <div key={rsvp.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-ui text-sm font-medium text-[var(--color-text)]">
                            {rsvp.displayName}
                          </p>
                          {rsvp.event && (
                            <p className="font-ui text-xs text-[var(--color-text-muted)]">
                              {rsvp.event.name}
                            </p>
                          )}
                        </div>
                        <Badge variant={config.variant}>
                          <StatusIcon size={11} className="mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      {rsvp.plus_one_name && (
                        <p className="font-ui text-xs text-[var(--color-text-muted)] mb-2">
                          +1: {rsvp.plus_one_name}
                        </p>
                      )}
                      {rsvp.message && (
                        <p className="font-body text-xs text-[var(--color-text-muted)] italic mb-2">
                          "{rsvp.message}"
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Select
                          value={rsvp.status}
                          onChange={(e) =>
                            handleStatusChange(rsvp.id, e.target.value as RsvpStatus)
                          }
                          className="flex-1 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="declined">Declined</option>
                          <option value="tentative">Tentative</option>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
