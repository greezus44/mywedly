import { useQuery } from "@tanstack/react-query";
import { supabase, type SharingEvent, type EventRsvp, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, LoadingSpinner, ErrorState } from "../../components/ui";
import { formatDate, formatDateTime } from "../../lib/utils";

export function AnalyticsPage() {
  const { eventId } = useEventContext();

  const { data: sharingEvents, isLoading: sLoading, isError: sError } = useQuery({
    queryKey: ["analytics-sharing", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SharingEvent[];
    },
  });

  const { data: rsvps, isLoading: rLoading, isError: rError } = useQuery({
    queryKey: ["analytics-rsvps", eventId],
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
    queryKey: ["analytics-sub-events", eventId],
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

  if (sLoading || rLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (sError || rError) {
    return <ErrorState title="Failed to load analytics" />;
  }

  const totalViews = sharingEvents?.length ?? 0;
  const uniqueGuests = new Set(sharingEvents?.map((e) => e.guest_id).filter(Boolean)).size;
  const totalRsvps = rsvps?.length ?? 0;
  const confirmedRsvps = rsvps?.filter((r) => r.status === "confirmed" || r.status === "yes").length ?? 0;
  const declinedRsvps = rsvps?.filter((r) => r.status === "declined" || r.status === "no").length ?? 0;
  const pendingRsvps = rsvps?.filter((r) => r.status === "pending").length ?? 0;

  // Per-Event RSVP breakdown
  const rsvpsBySubEvent = new Map<string, EventRsvp[]>();
  for (const rsvp of rsvps ?? []) {
    const key = rsvp.sub_event_id ?? "main";
    if (!rsvpsBySubEvent.has(key)) rsvpsBySubEvent.set(key, []);
    rsvpsBySubEvent.get(key)!.push(rsvp);
  }

  // Source breakdown
  const sourceCounts = new Map<string, number>();
  for (const ev of sharingEvents ?? []) {
    const src = ev.source || "unknown";
    sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-dash-text">Analytics</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-dash-muted">Page Views</p>
          <p className="text-2xl font-bold text-dash-text mt-1">{totalViews}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-dash-muted">Unique Guests</p>
          <p className="text-2xl font-bold text-dash-text mt-1">{uniqueGuests}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-dash-muted">Total RSVPs</p>
          <p className="text-2xl font-bold text-dash-text mt-1">{totalRsvps}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-dash-muted">Confirmed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{confirmedRsvps}</p>
        </Card>
      </div>

      {/* RSVP breakdown */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-dash-text mb-3">RSVP Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-dash-muted">Confirmed</p>
            <p className="text-xl font-semibold text-green-600">{confirmedRsvps}</p>
          </div>
          <div>
            <p className="text-sm text-dash-muted">Declined</p>
            <p className="text-xl font-semibold text-dash-danger">{declinedRsvps}</p>
          </div>
          <div>
            <p className="text-sm text-dash-muted">Pending</p>
            <p className="text-xl font-semibold text-dash-muted">{pendingRsvps}</p>
          </div>
        </div>
      </Card>

      {/* Per-Event RSVPs */}
      {subEvents && subEvents.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-dash-text mb-3">RSVPs by Event</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm border-b border-dash-border pb-2">
              <span className="font-medium text-dash-text">Main Event</span>
              <span className="text-dash-muted">{rsvpsBySubEvent.get("main")?.length ?? 0}</span>
            </div>
            {subEvents.map((se) => (
              <div key={se.id} className="flex justify-between text-sm border-b border-dash-border pb-2 last:border-0">
                <span className="font-medium text-dash-text">{se.name}</span>
                <span className="text-dash-muted">{rsvpsBySubEvent.get(se.id)?.length ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Source breakdown */}
      {sourceCounts.size > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-dash-text mb-3">Views by Source</h3>
          <div className="space-y-2">
            {Array.from(sourceCounts.entries()).map(([source, count]) => (
              <div key={source} className="flex justify-between text-sm">
                <span className="font-medium text-dash-text capitalize">{source}</span>
                <span className="text-dash-muted">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent views */}
      {sharingEvents && sharingEvents.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-dash-text mb-3">Recent Views</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sharingEvents.slice(0, 20).map((ev) => (
              <div key={ev.id} className="flex justify-between text-sm border-b border-dash-border pb-2 last:border-0">
                <span className="text-dash-text">
                  {ev.source} {ev.device_type ? `· ${ev.device_type}` : ""}
                </span>
                <span className="text-dash-muted">{formatDateTime(ev.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {totalViews === 0 && totalRsvps === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-dash-muted">
            No analytics data yet. Publish your website and share it with guests to start collecting data.
          </p>
        </Card>
      )}
    </div>
  );
}
