import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  Input,
  Select,
  Card,
  Badge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";

interface RsvpWithSubEvent extends EventRsvp {
  sub_event_name?: string | null;
  sub_event_date?: string | null;
  sub_event_time?: string | null;
}

async function fetchRsvps(eventId: string): Promise<RsvpWithSubEvent[]> {
  const { data: rsvps, error: rsvpError } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .order("submitted_at", { ascending: false });

  if (rsvpError) throw rsvpError;

  const { data: subEvents, error: subError } = await supabase
    .from("sub_events")
    .select("*")
    .eq("parent_event_id", eventId)
    .order("display_order", { ascending: true });

  if (subError) throw subError;

  const subEventMap = new Map<string, SubEvent>();
  for (const se of (subEvents ?? []) as SubEvent[]) {
    subEventMap.set(se.id, se);
  }

  return (rsvps ?? []).map((rsvp) => {
    const r = rsvp as EventRsvp;
    const subEvent = r.sub_event_id ? subEventMap.get(r.sub_event_id) : null;
    return {
      ...r,
      sub_event_name: subEvent?.name ?? null,
      sub_event_date: subEvent?.date ?? null,
      sub_event_time: subEvent?.time ?? null,
    };
  });
}

async function fetchGroups(
  eventId: string
): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase
    .from("guest_groups")
    .select("id, name")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string }>;
}

async function fetchGuestGroupMap(
  eventId: string
): Promise<Map<string, string>> {
  const { data: guests, error } = await supabase
    .from("event_guests")
    .select("id, group_id")
    .eq("event_id", eventId);

  if (error) throw error;

  const map = new Map<string, string>();
  for (const g of (guests ?? []) as Array<{ id: string; group_id: string | null }>) {
    if (g.group_id) {
      map.set(g.id, g.group_id);
    }
  }
  return map;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "attending":
      return <Badge variant="success">Attending</Badge>;
    case "not_attending":
      return <Badge variant="danger">Not Attending</Badge>;
    default:
      return <Badge variant="warning">Pending</Badge>;
  }
}

function exportCsv(rsvps: RsvpWithSubEvent[]): void {
  const headers = [
    "Guest Name",
    "Status",
    "Plus One Count",
    "Plus One Names",
    "Event Name",
  ];
  const rows = rsvps.map((r) => [
    r.guest_name,
    r.status,
    String(r.plus_ones),
    (r.plus_one_names ?? []).join("; "),
    r.sub_event_name ?? "",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const escaped = String(cell).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rsvps.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function RsvpPage() {
  const { eventId } = useEventContext();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  const { data: rsvps, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: () => fetchRsvps(eventId),
  });

  const { data: groups } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: () => fetchGroups(eventId),
  });

  const { data: guestGroupMap } = useQuery({
    queryKey: ["guest-group-map", eventId],
    queryFn: () => fetchGuestGroupMap(eventId),
  });

  // Apply filters (client-side, instant)
  const filteredRsvps = useMemo(() => {
    if (!rsvps) return [];
    return rsvps.filter((rsvp) => {
      // Status filter
      if (statusFilter !== "all" && rsvp.status !== statusFilter) return false;
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!rsvp.guest_name.toLowerCase().includes(q)) return false;
      }
      // Group filter
      if (groupFilter !== "all" && guestGroupMap) {
        const guestGroupId = rsvp.guest_id
          ? guestGroupMap.get(rsvp.guest_id)
          : undefined;
        if (guestGroupId !== groupFilter) return false;
      }
      return true;
    });
  }, [rsvps, statusFilter, searchQuery, groupFilter, guestGroupMap]);

  // Group RSVPs by sub-event
  const groupedByEvent = useMemo(() => {
    const groups = new Map<string, RsvpWithSubEvent[]>();
    for (const rsvp of filteredRsvps) {
      const key = rsvp.sub_event_id ?? "no-event";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(rsvp);
    }
    return Array.from(groups.entries()).map(([key, items]) => {
      const first = items[0];
      return {
        key,
        subEventName: first.sub_event_name ?? "General Event",
        subEventDate: first.sub_event_date,
        subEventTime: first.sub_event_time,
        rsvps: items,
      };
    });
  }, [filteredRsvps]);

  // Compute totals per event group
  const getTotals = (rsvps: RsvpWithSubEvent[]) => {
    const attending = rsvps.filter((r) => r.status === "attending").length;
    const notAttending = rsvps.filter((r) => r.status === "not_attending").length;
    const pending = rsvps.filter((r) => r.status === "pending").length;
    return { attending, notAttending, pending };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">RSVP Management</h2>
          <p className="text-sm text-dash-muted">
            View and manage RSVP responses from your guests
          </p>
        </div>
        {rsvps && rsvps.length > 0 && (
          <Button variant="secondary" onClick={() => exportCsv(filteredRsvps)}>
            Export CSV
          </Button>
        )}
      </div>

      {/* Filters */}
      {rsvps && rsvps.length > 0 && (
        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              type="text"
              placeholder="Search by guest name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="attending">Attending</option>
              <option value="not_attending">Not Attending</option>
              <option value="pending">Pending</option>
            </Select>
            <Select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="all">All groups</option>
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <ErrorState
          title="Failed to load RSVPs"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      )}

      {/* Empty state */}
      {rsvps && rsvps.length === 0 && (
        <EmptyState
          title="No RSVPs yet"
          description="Once your guests start responding to invitations, their RSVPs will appear here."
        />
      )}

      {/* No results after filtering */}
      {rsvps && rsvps.length > 0 && filteredRsvps.length === 0 && (
        <EmptyState
          title="No matching RSVPs"
          description="Try adjusting your filters or search query."
        />
      )}

      {/* RSVP groups by event */}
      {groupedByEvent.map((group) => {
        const totals = getTotals(group.rsvps);
        return (
          <Card key={group.key} className="p-5">
            {/* Event header */}
            <div className="border-b border-dash-border pb-3 mb-4">
              <h3 className="text-lg font-semibold text-dash-text">
                {group.subEventName}
              </h3>
              {(group.subEventDate || group.subEventTime) && (
                <p className="text-sm text-dash-muted mt-1">
                  {group.subEventDate && formatDate(group.subEventDate)}
                  {group.subEventDate && group.subEventTime && " at "}
                  {group.subEventTime && formatTime12(group.subEventTime)}
                </p>
              )}

              {/* Totals */}
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-sm text-dash-text">
                    <strong>{totals.attending}</strong> Attending
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-sm text-dash-text">
                    <strong>{totals.notAttending}</strong> Not Attending
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-sm text-dash-text">
                    <strong>{totals.pending}</strong> Pending
                  </span>
                </div>
              </div>
            </div>

            {/* Guest lists by status */}
            <div className="space-y-4">
              {/* Attending */}
              {totals.attending > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-2">
                    Attending ({totals.attending})
                  </h4>
                  <div className="space-y-2">
                    {group.rsvps
                      .filter((r) => r.status === "attending")
                      .map((rsvp) => (
                        <GuestRsvpRow key={rsvp.id} rsvp={rsvp} />
                      ))}
                  </div>
                </div>
              )}

              {/* Not Attending */}
              {totals.notAttending > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-2">
                    Not Attending ({totals.notAttending})
                  </h4>
                  <div className="space-y-2">
                    {group.rsvps
                      .filter((r) => r.status === "not_attending")
                      .map((rsvp) => (
                        <GuestRsvpRow key={rsvp.id} rsvp={rsvp} />
                      ))}
                  </div>
                </div>
              )}

              {/* Pending */}
              {totals.pending > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-amber-700 mb-2">
                    Pending ({totals.pending})
                  </h4>
                  <div className="space-y-2">
                    {group.rsvps
                      .filter((r) => r.status === "pending")
                      .map((rsvp) => (
                        <GuestRsvpRow key={rsvp.id} rsvp={rsvp} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function GuestRsvpRow({ rsvp }: { rsvp: RsvpWithSubEvent }) {
  const plusOneNames = rsvp.plus_one_names ?? [];
  return (
    <div className="rounded-md border border-dash-border bg-dash-bg px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-dash-text">
          {rsvp.guest_name}
        </span>
        {getStatusBadge(rsvp.status)}
      </div>
      {rsvp.plus_ones > 0 && (
        <p className="text-xs text-dash-muted mt-1">
          +{rsvp.plus_ones} plus one{rsvp.plus_ones > 1 ? "s" : ""}
        </p>
      )}
      {plusOneNames.length > 0 && (
        <ul className="mt-1 ml-4 list-disc text-xs text-dash-muted">
          {plusOneNames.map((name, i) => (
            <li key={i}>{name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
