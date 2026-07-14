import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp, type SubEvent, type GuestGroup, type EventGuest } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Select, Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { formatDate, formatTime12, cn } from "../../lib/utils";

type StatusFilter = "all" | "attending" | "not_attending" | "pending";

interface RsvpWithSubEvent extends EventRsvp {
  sub_event_name?: string;
  sub_event_date?: string | null;
  sub_event_time?: string | null;
  group_name?: string | null;
}

interface EventGroup {
  subEventId: string;
  subEventName: string;
  date: string | null;
  time: string | null;
  rsvps: RsvpWithSubEvent[];
  attending: number;
  notAttending: number;
  pending: number;
}

function statusBadge(status: string) {
  switch (status) {
    case "attending":
      return <Badge variant="success">Attending</Badge>;
    case "not_attending":
      return <Badge variant="danger">Not Attending</Badge>;
    default:
      return <Badge variant="warning">Pending</Badge>;
  }
}

export function RsvpPage() {
  const { eventId } = useEventContext();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  const { data: rsvps, isLoading, isError, error } = useQuery({
    queryKey: ["event-rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*, sub_events:event_rsvps_sub_event_id_fkey(name, date, time)")
        .eq("event_id", eventId!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Array<EventRsvp & {
        sub_events: { name: string; date: string | null; time: string | null } | null;
      }>) ?? [];
    },
    enabled: !!eventId,
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub-events-rsvp", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId!)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!eventId,
  });

  const { data: guests } = useQuery({
    queryKey: ["event-guests-rsvp", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId!);
      if (error) throw error;
      return data as EventGuest[];
    },
    enabled: !!eventId,
  });

  const { data: groups } = useQuery({
    queryKey: ["guest-groups-rsvp", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
    enabled: !!eventId,
  });

  // Build guest lookup for group info
  const guestMap = useMemo(() => {
    const m = new Map<string, EventGuest>();
    guests?.forEach((g) => m.set(g.id, g));
    return m;
  }, [guests]);

  const groupMap = useMemo(() => {
    const m = new Map<string, string>();
    groups?.forEach((g) => m.set(g.id, g.name));
    return m;
  }, [groups]);

  // Normalize RSVPs with sub-event info
  const normalizedRsvps: RsvpWithSubEvent[] = useMemo(() => {
    if (!rsvps) return [];
    return rsvps.map((r) => {
      const subEvent = r.sub_events;
      const guest = guestMap.get(r.guest_id);
      return {
        ...r,
        sub_event_name: subEvent?.name ?? "Main Event",
        sub_event_date: subEvent?.date ?? null,
        sub_event_time: subEvent?.time ?? null,
        group_name: guest?.group_id ? groupMap.get(guest.group_id) ?? null : guest?.group_name ?? null,
      };
    });
  }, [rsvps, guestMap, groupMap]);

  // Client-side filtering
  const filteredRsvps = useMemo(() => {
    return normalizedRsvps.filter((r) => {
      if (statusFilter !== "all") {
        if (statusFilter === "pending" && r.status && r.status !== "pending") return false;
        if (statusFilter !== "pending" && r.status !== statusFilter) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        if (!r.guest_name.toLowerCase().includes(q)) return false;
      }
      if (groupFilter !== "all") {
        const guest = guestMap.get(r.guest_id);
        if (guest?.group_id !== groupFilter) return false;
      }
      return true;
    });
  }, [normalizedRsvps, statusFilter, search, groupFilter, guestMap]);

  // Group by sub-event
  const eventGroups: EventGroup[] = useMemo(() => {
    const groupMap = new Map<string, EventGroup>();
    for (const r of filteredRsvps) {
      const key = r.sub_event_id ?? "main";
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          subEventId: key,
          subEventName: r.sub_event_name ?? "Main Event",
          date: r.sub_event_date ?? null,
          time: r.sub_event_time ?? null,
          rsvps: [],
          attending: 0,
          notAttending: 0,
          pending: 0,
        });
      }
      const g = groupMap.get(key)!;
      g.rsvps.push(r);
      if (r.status === "attending") g.attending++;
      else if (r.status === "not_attending") g.notAttending++;
      else g.pending++;
    }
    return Array.from(groupMap.values());
  }, [filteredRsvps]);

  function exportCsv() {
    const headers = ["Guest Name", "Status", "Plus One Count", "Plus One Names", "Event Name"];
    const rows = filteredRsvps.map((r) => [
      r.guest_name,
      r.status || "pending",
      String(r.plus_ones ?? 0),
      (r.plus_one_names ?? []).join("; "),
      r.sub_event_name ?? "Main Event",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rsvps-${eventId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Failed to load RSVPs"} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">RSVP Management</h2>
          <p className="mt-1 text-sm text-dash-muted">View and manage RSVP responses grouped by Event</p>
        </div>
        {filteredRsvps.length > 0 && (
          <Button variant="secondary" onClick={exportCsv}>
            Export CSV
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-dash-text">Status</label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">All</option>
              <option value="attending">Attending</option>
              <option value="not_attending">Not Attending</option>
              <option value="pending">Pending</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-dash-text">Search</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by guest name..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-dash-text">Guest Group</label>
            <Select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="all">All Groups</option>
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Empty State */}
      {filteredRsvps.length === 0 ? (
        <EmptyState
          title={normalizedRsvps.length === 0 ? "No RSVPs yet" : "No RSVPs match your filters"}
          description={
            normalizedRsvps.length === 0
              ? "RSVP responses from your guests will appear here."
              : "Try adjusting your filters to see more results."
          }
        />
      ) : (
        <div className="space-y-6">
          {eventGroups.map((group) => (
            <Card key={group.subEventId}>
              {/* Event Header */}
              <div className="mb-4 border-b border-dash-border pb-3">
                <h3 className="text-base font-semibold text-dash-text">{group.subEventName}</h3>
                {group.date && (
                  <p className="mt-1 text-sm text-dash-muted">
                    {formatDate(group.date)}
                    {group.time && ` · ${formatTime12(group.time)}`}
                  </p>
                )}
              </div>

              {/* RSVP Totals */}
              <div className="mb-4 flex gap-3">
                <Badge variant="success">Attending: {group.attending}</Badge>
                <Badge variant="danger">Not Attending: {group.notAttending}</Badge>
                <Badge variant="warning">Pending: {group.pending}</Badge>
              </div>

              {/* Guest Lists by Status */}
              <div className="space-y-4">
                {(["attending", "not_attending", "pending"] as const).map((status) => {
                  const statusRsvps = group.rsvps.filter(
                    (r) =>
                      (status === "pending" && (!r.status || r.status === "pending")) ||
                      r.status === status,
                  );
                  if (statusRsvps.length === 0) return null;
                  return (
                    <div key={status}>
                      <h4 className="mb-2 text-sm font-semibold capitalize text-dash-muted">
                        {status === "not_attending" ? "Not Attending" : status}
                      </h4>
                      <div className="space-y-2">
                        {statusRsvps.map((rsvp) => (
                          <div
                            key={rsvp.id}
                            className="rounded-md border border-dash-border bg-dash-surface p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-dash-text">
                                  {rsvp.guest_name}
                                </span>
                                {statusBadge(rsvp.status || "pending")}
                              </div>
                              <div className="flex items-center gap-2">
                                {rsvp.plus_ones > 0 && (
                                  <span className="text-xs text-dash-muted">
                                    +{rsvp.plus_ones} plus one{rsvp.plus_ones > 1 ? "s" : ""}
                                  </span>
                                )}
                                {rsvp.group_name && (
                                  <Badge>{rsvp.group_name}</Badge>
                                )}
                              </div>
                            </div>
                            {/* Plus one names */}
                            {rsvp.plus_one_names && rsvp.plus_one_names.length > 0 && (
                              <ul className="mt-2 ml-4 list-disc text-sm text-dash-muted">
                                {rsvp.plus_one_names.map((name, i) => (
                                  <li key={i}>{name}</li>
                                ))}
                              </ul>
                            )}
                            {rsvp.dietary_notes && (
                              <p className="mt-1 text-xs text-dash-muted">
                                Dietary: {rsvp.dietary_notes}
                              </p>
                            )}
                            {rsvp.message && (
                              <p className="mt-1 text-xs italic text-dash-muted">
                                "{rsvp.message}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
