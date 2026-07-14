import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import {
  Card,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { formatDateShort, cn } from "../../lib/utils";

async function fetchRsvps(eventId: string): Promise<{ rsvps: EventRsvp[]; subEvents: SubEvent[] }> {
  const { data: rsvps, error: rsvpError } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId);
  if (rsvpError) throw rsvpError;

  const { data: subEvents, error: subError } = await supabase
    .from("sub_events")
    .select("*")
    .eq("parent_event_id", eventId);
  if (subError) throw subError;

  return {
    rsvps: (rsvps ?? []) as EventRsvp[],
    subEvents: (subEvents ?? []) as SubEvent[],
  };
}

function statusColor(status: string): "success" | "danger" | "warning" | "default" {
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

function statusLabel(status: string): string {
  switch (status) {
    case "attending":
      return "Attending";
    case "not_attending":
      return "Not Attending";
    case "pending":
      return "Pending";
    default:
      return "Pending";
  }
}

export function RsvpPage() {
  const { eventId } = useEventContext();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["event-rsvps", eventId],
    queryFn: () => fetchRsvps(eventId),
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  const rsvps = data?.rsvps ?? [];
  const subEvents = data?.subEvents ?? [];

  // Group RSVPs by sub-event (or "Main Event" if no sub_event_id)
  const grouped = useMemo(() => {
    const groups: Record<string, { subEvent: SubEvent | null; items: EventRsvp[] }> = {};

    // Group with no sub-event
    const noSub = rsvps.filter((r) => !r.sub_event_id);
    if (noSub.length > 0) {
      groups["__main__"] = { subEvent: null, items: noSub };
    }

    // Groups by sub-event
    for (const sub of subEvents) {
      const items = rsvps.filter((r) => r.sub_event_id === sub.id);
      if (items.length > 0) {
        groups[sub.id] = { subEvent: sub, items };
      }
    }

    return groups;
  }, [rsvps, subEvents]);

  // Apply filters
  const filteredGrouped = useMemo(() => {
    const result: Record<string, { subEvent: SubEvent | null; items: EventRsvp[] }> = {};
    for (const [key, group] of Object.entries(grouped)) {
      let items = group.items;
      if (statusFilter !== "all") {
        items = items.filter((r) => (r.status ?? "pending") === statusFilter);
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        items = items.filter(
          (r) =>
            r.guest_name?.toLowerCase().includes(q) ||
            r.dietary?.toLowerCase().includes(q) ||
            r.message?.toLowerCase().includes(q),
        );
      }
      if (groupFilter !== "all") {
        // Filter by sub-event
        if (groupFilter === "__main__" && key !== "__main__") continue;
        if (groupFilter !== "__main__" && key !== groupFilter) continue;
      }
      if (items.length > 0) {
        result[key] = { ...group, items };
      }
    }
    return result;
  }, [grouped, statusFilter, search, groupFilter]);

  // Totals
  const totals = useMemo(() => {
    const attending = rsvps.filter((r) => r.status === "attending").length;
    const notAttending = rsvps.filter((r) => r.status === "not_attending").length;
    const pending = rsvps.filter((r) => !r.status || r.status === "pending").length;
    return { attending, notAttending, pending, total: rsvps.length };
  }, [rsvps]);

  const handleExportCsv = () => {
    const headers = ["Guest Name", "Status", "Plus Ones", "Plus One Names", "Dietary", "Message", "Submitted At", "Event"];
    const rows = rsvps.map((r) => {
      const subName = subEvents.find((s) => s.id === r.sub_event_id)?.name ?? "Main Event";
      return [
        r.guest_name ?? "",
        statusLabel(r.status ?? "pending"),
        String(r.plus_ones ?? 0),
        (r.plus_one_names ?? []).join("; "),
        r.dietary ?? "",
        r.message ?? "",
        r.submitted_at ?? "",
        subName,
      ];
    });

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
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load RSVPs"}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">RSVP Management</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Track and manage guest RSVPs
          </p>
        </div>
        {rsvps.length > 0 && (
          <Button variant="secondary" size="sm" onClick={handleExportCsv}>
            Export CSV
          </Button>
        )}
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-dash-text">{totals.total}</div>
          <div className="mt-1 text-sm text-dash-muted">Total RSVPs</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">{totals.attending}</div>
          <div className="mt-1"><Badge color="success">Attending</Badge></div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-red-600">{totals.notAttending}</div>
          <div className="mt-1"><Badge color="danger">Not Attending</Badge></div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-amber-600">{totals.pending}</div>
          <div className="mt-1"><Badge color="warning">Pending</Badge></div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, dietary, message…"
          />
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="attending">Attending</option>
            <option value="not_attending">Not Attending</option>
            <option value="pending">Pending</option>
          </Select>
          <Select
            label="Event"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="all">All Events</option>
            <option value="__main__">Main Event</option>
            {subEvents.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* RSVPs grouped by Event */}
      {rsvps.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">💌</span>}
          title="No RSVPs yet"
          description="RSVPs will appear here once guests respond to your invitation."
        />
      ) : Object.keys(filteredGrouped).length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">🔍</span>}
          title="No matching RSVPs"
          description="Try adjusting your filters."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredGrouped).map(([key, group]) => {
            const groupAttending = group.items.filter((r) => r.status === "attending").length;
            const groupNotAttending = group.items.filter((r) => r.status === "not_attending").length;
            const groupPending = group.items.filter((r) => !r.status || r.status === "pending").length;

            return (
              <Card key={key}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-dash-text">
                    {group.subEvent ? group.subEvent.name : "Main Event"}
                  </h3>
                  <div className="flex gap-2">
                    <Badge color="success">{groupAttending} attending</Badge>
                    <Badge color="danger">{groupNotAttending} declined</Badge>
                    <Badge color="warning">{groupPending} pending</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {group.items.map((rsvp) => (
                    <div
                      key={rsvp.id}
                      className="rounded-lg border border-dash-border bg-dash-bg p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-dash-text">
                              {rsvp.guest_name || "Unknown Guest"}
                            </span>
                            <Badge color={statusColor(rsvp.status ?? "pending")}>
                              {statusLabel(rsvp.status ?? "pending")}
                            </Badge>
                          </div>

                          {rsvp.plus_ones !== null && rsvp.plus_ones > 0 && (
                            <p className="mt-1 text-sm text-dash-muted">
                              +{rsvp.plus_ones} guest{rsvp.plus_ones > 1 ? "s" : ""}
                            </p>
                          )}

                          {rsvp.plus_one_names && rsvp.plus_one_names.length > 0 && (
                            <ul className="mt-1 list-inside list-disc text-sm text-dash-muted">
                              {rsvp.plus_one_names.map((name, i) => (
                                <li key={i}>{name}</li>
                              ))}
                            </ul>
                          )}

                          {rsvp.dietary && (
                            <p className="mt-1 text-sm text-dash-muted">
                              🍽 Dietary: {rsvp.dietary}
                              {rsvp.dietary_notes ? ` (${rsvp.dietary_notes})` : ""}
                            </p>
                          )}

                          {rsvp.message && (
                            <p className="mt-1 text-sm text-dash-muted">
                              💬 {rsvp.message}
                            </p>
                          )}

                          {rsvp.submitted_at && (
                            <p className="mt-1 text-xs text-dash-muted">
                              Submitted: {formatDateShort(rsvp.submitted_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
