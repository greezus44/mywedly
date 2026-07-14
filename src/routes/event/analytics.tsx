import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Card, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { formatDate, formatDateTime } from "../../lib/utils";

export default function AnalyticsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();

  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ["analytics", eventId],
    queryFn: async () => {
      const [visitsRes, rsvpsRes, uniqueVisitorsRes] = await Promise.all([
        supabase
          .from("sharing_events")
          .select("*")
          .eq("wedding_id", eventId),
        supabase
          .from("event_rsvps")
          .select("*")
          .eq("event_id", eventId),
        supabase
          .from("sharing_events")
          .select("guest_id")
          .eq("wedding_id", eventId)
          .not("guest_id", "is", null),
      ]);

      if (visitsRes.error) throw visitsRes.error;
      if (rsvpsRes.error) throw rsvpsRes.error;

      const visits = visitsRes.data ?? [];
      const rsvps = rsvpsRes.data ?? [];

      const attending = rsvps.filter((r) => r.status === "attending").length;
      const notAttending = rsvps.filter((r) => r.status === "not_attending").length;
      const maybe = rsvps.filter((r) => r.status === "maybe").length;
      const pending = rsvps.filter((r) => r.status === "pending").length;

      const deviceTypes: Record<string, number> = {};
      visits.forEach((v) => {
        const dt = v.device_type ?? "unknown";
        deviceTypes[dt] = (deviceTypes[dt] ?? 0) + 1;
      });

      const sources: Record<string, number> = {};
      visits.forEach((v) => {
        const s = v.source ?? "direct";
        sources[s] = (sources[s] ?? 0) + 1;
      });

      return {
        totalVisits: visits.length,
        uniqueVisitors: new Set(uniqueVisitorsRes.data?.map((v) => v.guest_id) ?? [null]).size,
        totalRsvps: rsvps.length,
        attending,
        notAttending,
        maybe,
        pending,
        deviceTypes,
        sources,
        recentVisits: visits.slice(-10).reverse(),
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20">
        <ErrorState message={error?.message} />
      </div>
    );
  }

  const statCards = [
    { label: "Total Visits", value: stats?.totalVisits ?? 0, icon: "👁" },
    { label: "Unique Visitors", value: stats?.uniqueVisitors ?? 0, icon: "👤" },
    { label: "RSVPs Received", value: stats?.totalRsvps ?? 0, icon: "✉" },
    { label: "Attending", value: stats?.attending ?? 0, icon: "✓" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Analytics</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Track visits and RSVP responses for {event.name}.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-dash-text">{stat.value}</p>
            <p className="text-sm text-dash-muted">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* RSVP breakdown */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-dash-text">RSVP Breakdown</h3>
        <div className="space-y-2">
          {[
            { label: "Attending", value: stats?.attending ?? 0, color: "bg-green-500" },
            { label: "Not Attending", value: stats?.notAttending ?? 0, color: "bg-red-500" },
            { label: "Maybe", value: stats?.maybe ?? 0, color: "bg-amber-500" },
            { label: "Pending", value: stats?.pending ?? 0, color: "bg-gray-400" },
          ].map((item) => {
            const total = stats?.totalRsvps ?? 1;
            const pct = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-dash-text">{item.label}</span>
                  <span className="text-dash-muted">{item.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-dash-bg">
                  <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Device types */}
      {stats && Object.keys(stats.deviceTypes).length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-dash-text">Device Types</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.deviceTypes).map(([type, count]) => (
              <Badge key={type} variant="info">
                {type}: {count}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Recent visits */}
      {stats && stats.recentVisits.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-dash-text">Recent Visits</h3>
          <div className="space-y-2">
            {stats.recentVisits.map((visit) => (
              <div key={visit.id} className="flex items-center justify-between border-b border-dash-border pb-2 text-sm last:border-0">
                <div>
                  <span className="text-dash-text">{visit.source || "direct"}</span>
                  {visit.device_type && (
                    <span className="ml-2 text-dash-muted">· {visit.device_type}</span>
                  )}
                </div>
                <span className="text-dash-muted">{formatDateTime(visit.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {stats && stats.totalVisits === 0 && stats.totalRsvps === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-dash-muted">
            No analytics data yet. Publish your website and share the link to start collecting data.
          </p>
        </Card>
      )}
    </div>
  );
}
