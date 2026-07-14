import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Input";
import {
  Card,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { RsvpBadge } from "./guest-form";
import { formatDate } from "../../lib/utils";

export function RsvpPage() {
  const { eventId } = useEventContext();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSubEvent, setFilterSubEvent] = useState("");

  const { data: rsvps, isLoading, isError, error } = useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventRsvp[];
    },
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
  });

  const subEventMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const se of subEvents ?? []) m.set(se.id, se.name);
    return m;
  }, [subEvents]);

  const filtered = useMemo(() => {
    if (!rsvps) return [];
    return rsvps.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.guest_name?.toLowerCase().includes(q)) return false;
      }
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterSubEvent) {
        const seId = r.sub_event_id ?? "main";
        if (seId !== filterSubEvent) return false;
      }
      return true;
    });
  }, [rsvps, search, filterStatus, filterSubEvent]);

  // Group by Event
  const groupedByEvent = useMemo(() => {
    const groups = new Map<string, EventRsvp[]>();
    for (const r of filtered) {
      const key = r.sub_event_id ?? "main";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }
    return groups;
  }, [filtered]);

  // Totals
  const totals = useMemo(() => {
    const total = filtered.length;
    const confirmed = filtered.filter((r) => r.status === "confirmed" || r.status === "yes").length;
    const declined = filtered.filter((r) => r.status === "declined" || r.status === "no").length;
    const pending = filtered.filter((r) => r.status === "pending").length;
    const totalPlusOnes = filtered.reduce((sum, r) => sum + (r.plus_ones ?? 0), 0);
    return { total, confirmed, declined, pending, totalPlusOnes };
  }, [filtered]);

  const handleExportCsv = () => {
    if (!filtered.length) return;
    const headers = ["Guest Name", "Status", "Plus Ones", "Plus One Names", "Dietary", "Message", "Event", "Submitted At"];
    const rows = filtered.map((r) => [
      r.guest_name ?? "",
      r.status ?? "",
      String(r.plus_ones ?? 0),
      (r.plus_one_names ?? []).join("; "),
      r.dietary ?? "",
      r.message ?? "",
      r.sub_event_id ? (subEventMap.get(r.sub_event_id) ?? "Unknown") : "Main Event",
      r.submitted_at ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
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
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load RSVPs" description={error instanceof Error ? error.message : undefined} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dash-text">RSVP</h2>
        <Button variant="secondary" onClick={handleExportCsv} disabled={!filtered.length}>
          Export CSV
        </Button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-dash-muted">Total</p>
          <p className="text-2xl font-bold text-dash-text">{totals.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-dash-muted">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">{totals.confirmed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-dash-muted">Declined</p>
          <p className="text-2xl font-bold text-dash-danger">{totals.declined}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-dash-muted">Pending</p>
          <p className="text-2xl font-bold text-dash-muted">{totals.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-dash-muted">Plus Ones</p>
          <p className="text-2xl font-bold text-dash-text">{totals.totalPlusOnes}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          placeholder="Search by guest name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="declined">Declined</option>
          <option value="pending">Pending</option>
          <option value="maybe">Maybe</option>
        </Select>
        <Select value={filterSubEvent} onChange={(e) => setFilterSubEvent(e.target.value)}>
          <option value="">All Events</option>
          <option value="main">Main Event</option>
          {subEvents?.map((se) => (
            <option key={se.id} value={se.id}>{se.name}</option>
          ))}
        </Select>
      </div>

      {/* RSVPs grouped by Event */}
      {rsvps && rsvps.length === 0 ? (
        <EmptyState
          title="No RSVPs yet"
          description="RSVPs will appear here once your guests respond."
        />
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-dash-muted">No RSVPs match your filters.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedByEvent.entries()).map(([eventKey, eventRsvps]) => (
            <div key={eventKey}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-dash-text">
                  {eventKey === "main" ? "Main Event" : subEventMap.get(eventKey) ?? "Unknown Event"}
                </h3>
                <Badge>{eventRsvps.length}</Badge>
              </div>
              <div className="space-y-2">
                {eventRsvps.map((rsvp) => (
                  <Card key={rsvp.id} className="p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-dash-text">{rsvp.guest_name}</h4>
                          <RsvpBadge status={rsvp.status} />
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-dash-muted">
                          {rsvp.plus_ones > 0 && (
                            <span>
                              +{rsvp.plus_ones} plus ones
                              {rsvp.plus_one_names && rsvp.plus_one_names.length > 0 && (
                                <span> ({rsvp.plus_one_names.join(", ")})</span>
                              )}
                            </span>
                          )}
                          {rsvp.dietary && <span>🍽️ {rsvp.dietary}</span>}
                          {rsvp.message && <span>💬 {rsvp.message}</span>}
                          <span>📅 {formatDate(rsvp.submitted_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
