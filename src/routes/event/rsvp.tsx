import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp, type SubEvent, type GuestGroup, type EventGuest } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Select, Card, Badge, EmptyState, LoadingSpinner, ErrorState } from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";

type StatusFilter = "all" | "attending" | "not_attending" | "pending";

interface RsvpWithGuest extends EventRsvp {
  guest?: EventGuest | null;
}

export function RsvpPage() {
  const { eventId } = useEventContext();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  // Fetch RSVPs
  const {
    data: rsvps,
    isLoading: rsvpsLoading,
    isError: rsvpsError,
    refetch: refetchRsvps,
  } = useQuery({
    queryKey: ["event-rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId!);
      if (error) throw error;
      return data as EventRsvp[];
    },
    enabled: !!eventId,
  });

  // Fetch sub-events for grouping
  const { data: subEvents } = useQuery({
    queryKey: ["sub-events-rsvp", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId!);
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!eventId,
  });

  // Fetch guests for group info
  const {
    data: guests,
    isLoading: guestsLoading,
    isError: guestsError,
    refetch: refetchGuests,
  } = useQuery({
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

  // Fetch guest groups
  const { data: groups } = useQuery({
    queryKey: ["guest-groups-rsvp", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId!);
      if (error) throw error;
      return data as GuestGroup[];
    },
    enabled: !!eventId,
  });

  // Build guest lookup map
  const guestMap = useMemo(() => {
    const map = new Map<string, EventGuest>();
    guests?.forEach((g) => map.set(g.id, g));
    return map;
  }, [guests]);

  // Group RSVPs by sub_event_id
  const groupedRsvps = useMemo(() => {
    const groups = new Map<string | null, RsvpWithGuest[]>();
    rsvps?.forEach((rsvp) => {
      const key = rsvp.sub_event_id;
      if (!groups.has(key)) groups.set(key, []);
      const enriched: RsvpWithGuest = {
        ...rsvp,
        guest: rsvp.guest_id ? guestMap.get(rsvp.guest_id) ?? null : null,
      };
      groups.get(key)!.push(enriched);
    });
    return groups;
  }, [rsvps, guestMap]);

  // Apply filters
  const filteredGroupedRsvps = useMemo(() => {
    const result = new Map<string | null, RsvpWithGuest[]>();
    groupedRsvps.forEach((items, subEventId) => {
      const filtered = items.filter((rsvp) => {
        // Status filter
        if (statusFilter !== "all" && rsvp.status !== statusFilter) return false;
        // Search filter
        if (search.trim()) {
          const guestName = (rsvp.guest?.name || rsvp.guest_name || "").toLowerCase();
          if (!guestName.includes(search.toLowerCase())) return false;
        }
        // Group filter
        if (groupFilter !== "all") {
          const guestGroupId = rsvp.guest?.group_id;
          if (guestGroupId !== groupFilter) return false;
        }
        return true;
      });
      if (filtered.length > 0) {
        result.set(subEventId, filtered);
      }
    });
    return result;
  }, [groupedRsvps, statusFilter, search, groupFilter]);

  // Compute totals per sub-event
  const subEventStats = useMemo(() => {
    const stats = new Map<string | null, { attending: number; notAttending: number; pending: number }>();
    groupedRsvps.forEach((items, subEventId) => {
      const s = {
        attending: items.filter((r) => r.status === "attending").length,
        notAttending: items.filter((r) => r.status === "not_attending").length,
        pending: items.filter((r) => r.status === "pending").length,
      };
      stats.set(subEventId, s);
    });
    return stats;
  }, [groupedRsvps]);

  const getSubEventName = (subEventId: string | null): string => {
    if (!subEventId) return "General RSVP";
    const se = subEvents?.find((s) => s.id === subEventId);
    return se?.name ?? "Unknown Event";
  };

  const getSubEventDateTime = (subEventId: string | null): string => {
    if (!subEventId) return "";
    const se = subEvents?.find((s) => s.id === subEventId);
    if (!se) return "";
    const parts: string[] = [];
    if (se.date) parts.push(formatDate(se.date));
    if (se.start_time) parts.push(formatTime12(se.start_time));
    return parts.join(" • ");
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "attending":
        return <Badge color="success">Attending</Badge>;
      case "not_attending":
        return <Badge color="danger">Not Attending</Badge>;
      default:
        return <Badge color="warning">Pending</Badge>;
    }
  };

  const exportCsv = () => {
    const rows: string[] = [];
    rows.push("Guest Name,Status,Plus One Count,Plus One Names,Event Name");

    groupedRsvps.forEach((items, subEventId) => {
      const eventName = getSubEventName(subEventId);
      items.forEach((rsvp) => {
        const guestName = rsvp.guest?.name || rsvp.guest_name || "Unknown";
        const plusOneNames = (rsvp.plus_one_names ?? []).join("; ");
        const csvRow = [
          `"${guestName.replace(/"/g, '""')}"`,
          rsvp.status,
          String(rsvp.plus_ones ?? 0),
          `"${plusOneNames.replace(/"/g, '""')}"`,
          `"${eventName.replace(/"/g, '""')}"`,
        ].join(",");
        rows.push(csvRow);
      });
    });

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rsvps-${eventId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (rsvpsLoading || guestsLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (rsvpsError || guestsError) {
    return (
      <ErrorState
        title="Failed to load RSVPs"
        onRetry={() => {
          refetchRsvps();
          refetchGuests();
        }}
      />
    );
  }

  const totalRsvps = rsvps?.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">RSVP Management</h2>
        <Button
          onClick={exportCsv}
          variant="secondary"
          size="sm"
          disabled={totalRsvps === 0}
        >
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Search by guest name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
          />
        </div>
        <div className="sm:w-48">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">All</option>
            <option value="attending">Attending</option>
            <option value="not_attending">Not Attending</option>
            <option value="pending">Pending</option>
          </Select>
        </div>
        <div className="sm:w-48">
          <Select
            label="Guest Group"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="all">All Groups</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Empty state */}
      {totalRsvps === 0 ? (
        <EmptyState
          title="No RSVPs yet"
          description="RSVP responses from your guests will appear here."
        />
      ) : filteredGroupedRsvps.size === 0 ? (
        <EmptyState
          title="No matching RSVPs"
          description="Try adjusting your filters."
        />
      ) : (
        <div className="space-y-6">
          {Array.from(filteredGroupedRsvps.entries()).map(([subEventId, items]) => {
            const stats = subEventStats.get(subEventId);
            return (
              <Card key={subEventId ?? "general"}>
                {/* Event header */}
                <div className="mb-4 border-b border-dash-border pb-3">
                  <h3 className="text-lg font-semibold text-dash-text">
                    {getSubEventName(subEventId)}
                  </h3>
                  {getSubEventDateTime(subEventId) && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {getSubEventDateTime(subEventId)}
                    </p>
                  )}
                  {stats && (
                    <div className="mt-2 flex gap-3">
                      <Badge color="success">
                        Attending: {stats.attending}
                      </Badge>
                      <Badge color="danger">
                        Not Attending: {stats.notAttending}
                      </Badge>
                      <Badge color="warning">
                        Pending: {stats.pending}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Guest list */}
                <div className="space-y-3">
                  {items.map((rsvp) => {
                    const guestName = rsvp.guest?.name || rsvp.guest_name || "Unknown Guest";
                    const plusOneNames = rsvp.plus_one_names ?? [];
                    return (
                      <div
                        key={rsvp.id}
                        className="flex flex-col gap-2 rounded-md border border-dash-border p-3 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-dash-text">
                              {guestName}
                            </span>
                            {statusBadge(rsvp.status)}
                          </div>
                          {(rsvp.plus_ones ?? 0) > 0 && (
                            <p className="mt-1 text-sm text-dash-muted">
                              Plus ones: {rsvp.plus_ones}
                            </p>
                          )}
                          {plusOneNames.length > 0 && (
                            <ul className="mt-1 list-inside list-disc text-sm text-dash-muted">
                              {plusOneNames.map((name, idx) => (
                                <li key={idx}>{name}</li>
                              ))}
                            </ul>
                          )}
                          {rsvp.dietary && (
                            <p className="mt-1 text-sm text-dash-muted">
                              Dietary: {rsvp.dietary}
                            </p>
                          )}
                          {rsvp.message && (
                            <p className="mt-1 text-sm text-dash-muted">
                              "{rsvp.message}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
