import { useQuery } from "@tanstack/react-query";
import { supabase, type SharingEvent, type EventRsvp, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";

export function AnalyticsPage() {
  const { eventId } = useEventContext();

  const { data: sharingEvents, isLoading: sharingLoading, isError: sharingError } = useQuery({
    queryKey: ["sharing-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SharingEvent[];
    },
    enabled: !!eventId,
  });

  const { data: rsvps, isLoading: rsvpLoading, isError: rsvpError } = useQuery({
    queryKey: ["event-rsvps-analytics", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
    enabled: !!eventId,
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub-events-analytics", eventId],
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

  if (sharingLoading || rsvpLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (sharingError || rsvpError) {
    return (
      <ErrorState message="Failed to load analytics data" />
    );
  }

  const totalVisits = sharingEvents?.length ?? 0;
  const uniqueVisitors = new Set(sharingEvents?.map((e) => e.guest_id).filter(Boolean)).size;
  const totalRsvps = rsvps?.length ?? 0;
  const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
  const notAttending = rsvps?.filter((r) => r.status === "not_attending").length ?? 0;
  const pending = rsvps?.filter((r) => r.status === "pending" || !r.status).length ?? 0;

  const visitsByType: Record<string, number> = {};
  sharingEvents?.forEach((e) => {
    const type = e.event_type || "view";
    visitsByType[type] = (visitsByType[type] || 0) + 1;
  });

  const rsvpsBySubEvent: Record<string, number> = {};
  rsvps?.forEach((r) => {
    const key = r.sub_event_id ?? "main";
    rsvpsBySubEvent[key] = (rsvpsBySubEvent[key] || 0) + 1;
  });

  const subEventMap = new Map<string, string>();
  subEvents?.forEach((s) => subEventMap.set(s.id, s.name));
  subEventMap.set("main", "Main Event");

  const stats = [
    { label: "Total Visits", value: totalVisits, color: "text-sky-600" },
    { label: "Unique Guests", value: uniqueVisitors, color: "text-indigo-600" },
    { label: "Total RSVPs", value: totalRsvps, color: "text-green-600" },
    { label: "Attending", value: attending, color: "text-emerald-600" },
    { label: "Not Attending", value: notAttending, color: "text-red-600" },
    { label: "Pending", value: pending, color: "text-amber-600" },
  ];

  const hasData = totalVisits > 0 || totalRsvps > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Analytics</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Track visits, RSVP responses, and engagement for your invitation website.
        </p>
      </div>

      {!hasData ? (
        <EmptyState
          title="No analytics data yet"
          description="Once you publish and share your invitation website, analytics data will appear here."
        />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-4">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="mt-1 text-xs text-dash-muted">{stat.label}</p>
              </Card>
            ))}
          </div>

          {/* Visits by Type */}
          {Object.keys(visitsByType).length > 0 && (
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-dash-text">Visits by Type</h3>
              <div className="space-y-2">
                {Object.entries(visitsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-dash-text">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 rounded-full bg-dash-bg">
                        <div
                          className="h-2 rounded-full bg-dash-primary"
                          style={{ width: `${(count / totalVisits) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-dash-text">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* RSVPs by Event */}
          {Object.keys(rsvpsBySubEvent).length > 0 && (
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-dash-text">RSVPs by Event</h3>
              <div className="space-y-2">
                {Object.entries(rsvpsBySubEvent).map(([subId, count]) => (
                  <div key={subId} className="flex items-center justify-between">
                    <span className="text-sm text-dash-text">
                      {subEventMap.get(subId) ?? "Main Event"}
                    </span>
                    <span className="text-sm font-medium text-dash-text">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Visits */}
          {sharingEvents && sharingEvents.length > 0 && (
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-dash-text">Recent Visits</h3>
              <div className="space-y-2">
                {sharingEvents.slice(0, 10).map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between border-b border-dash-border pb-2 last:border-0"
                  >
                    <div>
                      <span className="text-sm font-medium capitalize text-dash-text">
                        {visit.event_type}
                      </span>
                      {visit.device_type && (
                        <span className="ml-2 text-xs text-dash-muted">
                          {visit.device_type}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-dash-muted">
                      {formatDateTime(visit.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
