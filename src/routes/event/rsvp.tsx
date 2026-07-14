import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp, type SubEvent, type GuestGroup } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, Select, Badge, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { formatDateTime, cn } from "../../lib/utils";

interface RsvpWithSubEvent extends EventRsvp {
  sub_events?: { name: string } | null;
}

const statusConfig: Record<string, { label: string; variant: "success" | "danger" | "warning" | "default" }> = {
  attending: { label: "Attending", variant: "success" },
  not_attending: { label: "Not Attending", variant: "danger" },
  pending: { label: "Pending", variant: "warning" },
  no_response: { label: "No Response", variant: "warning" },
};

export function RsvpPage() {
  const { eventId } = useEventContext();

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  const { data: rsvps, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*, sub_events:event_rsvps_sub_event_id_fkey(name)")
        .eq("event_id", eventId!);
      if (error) throw error;
      return (data ?? []) as unknown as RsvpWithSubEvent[];
    },
    enabled: !!eventId,
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId!);
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
    enabled: !!eventId,
  });

  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId!);
      if (error) throw error;
      return (data ?? []) as GuestGroup[];
    },
    enabled: !!eventId,
  });

  // Group RSVPs by sub_event
  const groupedRsvps = useMemo(() => {
    const groups = new Map<string, RsvpWithSubEvent[]>();
    const generalKey = "__general__";
    for (const rsvp of rsvps ?? []) {
      const key = rsvp.sub_event_id ?? generalKey;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(rsvp);
    }
    return groups;
  }, [rsvps]);

  // Filtered RSVPs
  const filteredRsvps = useMemo(() => {
    return (rsvps ?? []).filter((rsvp) => {
      if (statusFilter !== "all" && rsvp.status !== statusFilter) return false;
      if (searchQuery && !rsvp.guest_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [rsvps, statusFilter, searchQuery]);

  // Totals
  const totals = useMemo(() => {
    const all = rsvps ?? [];
    return {
      total: all.length,
      attending: all.filter((r) => r.status === "attending").length,
      notAttending: all.filter((r) => r.status === "not_attending").length,
      pending: all.filter((r) => r.status === "pending" || r.status === "no_response").length,
    };
  }, [rsvps]);

  const exportCsv = () => {
    const headers = ["Guest Name", "Status", "Plus Ones", "Plus One Names", "Dietary", "Message", "Event", "Submitted At"];
    const rows = filteredRsvps.map((r) => [
      r.guest_name,
      statusConfig[r.status]?.label ?? r.status,
      String(r.plus_ones ?? 0),
      (r.plus_one_names ?? []).join("; "),
      r.dietary ?? "",
      r.message ?? "",
      r.sub_events?.name ?? "General",
      r.submitted_at ? formatDateTime(r.submitted_at) : "",
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
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load RSVPs." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">RSVP Management</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Track and manage RSVP responses from your guests.
          </p>
        </div>
        <Button variant="secondary" onClick={exportCsv} disabled={filteredRsvps.length === 0}>
          Export CSV
        </Button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-dash-text">{totals.total}</div>
          <div className="text-xs text-dash-muted">Total RSVPs</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{totals.attending}</div>
          <div className="text-xs text-dash-muted">Attending</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{totals.notAttending}</div>
          <div className="text-xs text-dash-muted">Not Attending</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-amber-600">{totals.pending}</div>
          <div className="text-xs text-dash-muted">Pending</div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Search by Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guests..."
          />
          <Select
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="attending">Attending</option>
            <option value="not_attending">Not Attending</option>
            <option value="pending">Pending</option>
            <option value="no_response">No Response</option>
          </Select>
          <Select
            label="Filter by Group"
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
      </Card>

      {/* RSVP List grouped by Event */}
      {filteredRsvps.length === 0 ? (
        <EmptyState
          title="No RSVPs found"
          description="RSVP responses from guests will appear here."
          icon={<div className="text-4xl">📋</div>}
        />
      ) : (
        <div className="space-y-6">
          {Array.from(groupedRsvps.entries()).map(([key, groupRsvps]) => {
            const subEvent = subEvents?.find((se) => se.id === key);
            const groupLabel = key === "__general__" ? "General" : subEvent?.name ?? "Unknown Event";
            const filtered = groupRsvps.filter((r) => filteredRsvps.includes(r));
            if (filtered.length === 0) return null;

            return (
              <div key={key}>
                <h3 className="mb-3 text-lg font-semibold text-dash-text">{groupLabel}</h3>
                <div className="space-y-2">
                  {filtered.map((rsvp) => {
                    const cfg = statusConfig[rsvp.status] ?? statusConfig.no_response;
                    return (
                      <Card key={rsvp.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-dash-text">{rsvp.guest_name}</span>
                              <Badge variant={cfg.variant}>{cfg.label}</Badge>
                              {(rsvp.plus_ones ?? 0) > 0 && (
                                <Badge variant="default">
                                  +{rsvp.plus_ones} guest{(rsvp.plus_ones ?? 0) > 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                            {rsvp.plus_one_names && rsvp.plus_one_names.length > 0 && (
                              <ul className="mt-2 list-inside list-disc text-sm text-dash-muted">
                                {rsvp.plus_one_names.map((name, i) => (
                                  <li key={i}>{name}</li>
                                ))}
                              </ul>
                            )}
                            {rsvp.dietary && (
                              <p className="mt-1 text-sm text-dash-muted">
                                🍽️ Dietary: {rsvp.dietary}
                                {rsvp.dietary_notes ? ` — ${rsvp.dietary_notes}` : ""}
                              </p>
                            )}
                            {rsvp.message && (
                              <p className="mt-1 text-sm text-dash-muted">💬 {rsvp.message}</p>
                            )}
                            {rsvp.responded_at && (
                              <p className="mt-1 text-xs text-dash-muted">
                                Responded: {formatDateTime(rsvp.responded_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
