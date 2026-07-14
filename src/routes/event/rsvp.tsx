import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp, type SubEvent, type GuestGroup } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import {
  Card,
  Badge,
  Input,
  Select,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { formatDate, to12Hour, cn } from "../../lib/utils";

interface RsvpWithSubEvent extends EventRsvp {
  sub_events?: SubEvent | null;
}

type StatusFilter = "all" | "attending" | "not_attending" | "pending";

function statusBadgeVariant(status: string): "success" | "danger" | "warning" | "default" {
  switch (status) {
    case "attending":
      return "success";
    case "not_attending":
      return "danger";
    case "pending":
      return "warning";
    default:
      return "default";
  }
}

export function RsvpPage() {
  const { eventId } = useEventContext();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  // Fetch RSVPs joined with sub_events
  const {
    data: rsvps,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["event-rsvps", eventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("event_rsvps")
        .select("*, sub_events!event_rsvps_sub_event_id_fkey(*)")
        .eq("event_id", eventId)
        .order("submitted_at", { ascending: false });
      if (queryError) throw queryError;
      return data as RsvpWithSubEvent[];
    },
  });

  // Fetch guests for group info
  const { data: guests } = useQuery({
    queryKey: ["event-guests-rsvp", eventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId);
      if (queryError) throw queryError;
      return data;
    },
  });

  // Fetch guest groups
  const { data: groups } = useQuery({
    queryKey: ["guest-groups-rsvp", eventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (queryError) throw queryError;
      return data as GuestGroup[];
    },
  });

  // Build a map of guest_id -> group_id
  const guestGroupMap = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const g of guests ?? []) {
      map.set(g.id, g.group_id);
    }
    return map;
  }, [guests]);

  // Filter RSVPs
  const filteredRsvps = useMemo(() => {
    if (!rsvps) return [];
    return rsvps.filter((rsvp) => {
      // Status filter
      if (statusFilter !== "all" && rsvp.status !== statusFilter) return false;
      // Search filter
      if (search && !rsvp.guest_name.toLowerCase().includes(search.toLowerCase())) return false;
      // Group filter
      if (groupFilter !== "all") {
        const guestId = rsvp.guest_id;
        const gId = guestGroupMap.get(guestId) ?? null;
        if (gId !== groupFilter) return false;
      }
      return true;
    });
  }, [rsvps, statusFilter, search, groupFilter, guestGroupMap]);

  // Group by sub_event
  const grouped = useMemo(() => {
    const groups = new Map<string, { subEvent: SubEvent | null; rsvps: RsvpWithSubEvent[] }>();
    for (const rsvp of filteredRsvps) {
      const key = rsvp.sub_event_id ?? "__none__";
      const existing = groups.get(key);
      if (existing) {
        existing.rsvps.push(rsvp);
      } else {
        groups.set(key, { subEvent: rsvp.sub_events ?? null, rsvps: [rsvp] });
      }
    }
    return Array.from(groups.entries()).map(([key, val]) => ({
      key,
      subEvent: val.subEvent,
      rsvps: val.rsvps,
    }));
  }, [filteredRsvps]);

  // CSV export
  const handleExportCsv = () => {
    const headers = ["Guest Name", "Status", "Plus One Count", "Plus One Names", "Event Name"];
    const rows = filteredRsvps.map((r) => [
      r.guest_name,
      r.status,
      String(r.plus_ones ?? 0),
      (r.plus_one_names ?? []).join("; "),
      r.sub_events?.name ?? "General",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rsvps.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Failed to load RSVPs"} onRetry={() => refetch()} />;
  }

  if (!rsvps || rsvps.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-dash-text">RSVP Management</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Track and manage RSVP responses from your guests.
          </p>
        </div>
        <EmptyState
          title="No RSVPs yet"
          description="When guests submit their RSVPs, they will appear here."
          icon={<span className="text-4xl">✅</span>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dash-text">RSVP Management</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Track and manage RSVP responses from your guests.
          </p>
        </div>
        <Button variant="secondary" onClick={handleExportCsv}>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">All Statuses</option>
            <option value="attending">Attending</option>
            <option value="not_attending">Not Attending</option>
            <option value="pending">Pending</option>
          </Select>
          <Input
            label="Search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by guest name..."
          />
          <Select
            label="Group"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="all">All Groups</option>
            {(groups ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Grouped RSVPs */}
      {grouped.length === 0 ? (
        <EmptyState
          title="No matching RSVPs"
          description="Try adjusting your filters."
          icon={<span className="text-4xl">🔍</span>}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => {
            const attending = group.rsvps.filter((r) => r.status === "attending");
            const notAttending = group.rsvps.filter((r) => r.status === "not_attending");
            const pending = group.rsvps.filter((r) => r.status === "pending");

            return (
              <Card key={group.key}>
                {/* Event header */}
                <div className="border-b border-dash-border pb-4">
                  <h3 className="text-lg font-semibold text-dash-text">
                    {group.subEvent?.name ?? "General RSVP"}
                  </h3>
                  {(group.subEvent?.date || group.subEvent?.start_time) && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {group.subEvent?.date && formatDate(group.subEvent.date)}
                      {group.subEvent?.start_time &&
                        ` at ${to12Hour(group.subEvent.start_time)}`}
                    </p>
                  )}
                </div>

                {/* Totals */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{attending.length}</p>
                    <p className="text-xs text-green-600">Attending</p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                    <p className="text-2xl font-bold text-red-700">{notAttending.length}</p>
                    <p className="text-xs text-red-600">Not Attending</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                    <p className="text-2xl font-bold text-amber-700">{pending.length}</p>
                    <p className="text-xs text-amber-600">Pending</p>
                  </div>
                </div>

                {/* Guest lists by status */}
                <div className="mt-4 space-y-4">
                  {attending.length > 0 && (
                    <GuestList
                      title="Attending"
                      rsvps={attending}
                      variant="success"
                    />
                  )}
                  {notAttending.length > 0 && (
                    <GuestList
                      title="Not Attending"
                      rsvps={notAttending}
                      variant="danger"
                    />
                  )}
                  {pending.length > 0 && (
                    <GuestList
                      title="Pending"
                      rsvps={pending}
                      variant="warning"
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface GuestListProps {
  title: string;
  rsvps: RsvpWithSubEvent[];
  variant: "success" | "danger" | "warning";
}

function GuestList({ title, rsvps, variant }: GuestListProps) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-dash-text">
        {title} ({rsvps.length})
      </h4>
      <div className="space-y-2">
        {rsvps.map((rsvp) => (
          <div
            key={rsvp.id}
            className="rounded-lg border border-dash-border bg-dash-bg p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-dash-text">
                  {rsvp.guest_name}
                </span>
                <Badge variant={statusBadgeVariant(rsvp.status)}>{rsvp.status}</Badge>
                {rsvp.plus_ones > 0 && (
                  <span className="text-xs text-dash-muted">
                    +{rsvp.plus_ones} plus one{rsvp.plus_ones > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {rsvp.dietary && (
                <span className="text-xs text-dash-muted">🍽️ {rsvp.dietary}</span>
              )}
            </div>
            {/* Plus one names */}
            {rsvp.plus_one_names && rsvp.plus_one_names.length > 0 && (
              <ul className="mt-2 ml-4 list-disc text-sm text-dash-muted">
                {rsvp.plus_one_names.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            )}
            {rsvp.message && (
              <p className="mt-2 text-sm italic text-dash-muted">"{rsvp.message}"</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
