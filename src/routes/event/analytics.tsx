import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp, type SharingEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import {
  LoadingSpinner,
  ErrorState,
  Card,
  Badge,
  EmptyState,
} from "../../components/ui";
import { formatDateTime } from "../../lib/utils";

export default function Analytics() {
  const { eventId } = useEventContext();

  const { data: stats, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["analytics", eventId],
    queryFn: async () => {
      // Fetch sharing events (page views)
      const { data: views, error: viewsError } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("wedding_id", eventId)
        .order("created_at", { ascending: false });

      if (viewsError) throw viewsError;

      // Fetch RSVPs
      const { data: rsvps, error: rsvpError } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("submitted_at", { ascending: false });

      if (rsvpError) throw rsvpError;

      const viewList = (views ?? []) as SharingEvent[];
      const rsvpList = (rsvps ?? []) as EventRsvp[];

      const uniqueVisitors = new Set(
        viewList.map((v) => v.guest_id ?? v.id)
      ).size;

      const accepted = rsvpList.filter((r) => r.status === "attending").length;
      const declined = rsvpList.filter((r) => r.status === "declined").length;
      const pending = rsvpList.filter(
        (r) => r.status !== "attending" && r.status !== "declined"
      ).length;
      const totalPlusOnes = rsvpList.reduce(
        (sum, r) => sum + (r.plus_ones ?? 0),
        0
      );

      // Device breakdown
      const deviceCounts: Record<string, number> = {};
      for (const v of viewList) {
        const dt = v.device_type ?? "unknown";
        deviceCounts[dt] = (deviceCounts[dt] ?? 0) + 1;
      }

      // Source breakdown
      const sourceCounts: Record<string, number> = {};
      for (const v of viewList) {
        const src = v.source ?? "direct";
        sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
      }

      return {
        totalViews: viewList.length,
        uniqueVisitors,
        totalRsvps: rsvpList.length,
        accepted,
        declined,
        pending,
        totalPlusOnes,
        recentViews: viewList.slice(0, 10),
        recentRsvps: rsvpList.slice(0, 10),
        deviceCounts,
        sourceCounts,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load analytics"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "Total Views", value: stats.totalViews, color: "text-dash-primary" },
    { label: "Unique Visitors", value: stats.uniqueVisitors, color: "text-blue-600" },
    { label: "RSVPs Received", value: stats.totalRsvps, color: "text-green-600" },
    { label: "Attending", value: stats.accepted, color: "text-green-600" },
    { label: "Declined", value: stats.declined, color: "text-red-600" },
    { label: "Plus Ones", value: stats.totalPlusOnes, color: "text-purple-600" },
  ];

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-dash-text">Analytics</h1>
        <p className="mt-1 text-sm text-dash-muted">
          Track views, RSVPs, and visitor engagement.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-xs font-medium text-dash-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Views */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-dash-text">Recent Views</h2>
          {stats.recentViews.length === 0 ? (
            <EmptyState title="No views yet" description="Share your link to start tracking views." />
          ) : (
            <div className="space-y-2">
              {stats.recentViews.map((view) => (
                <div
                  key={view.id}
                  className="flex items-center justify-between rounded-lg bg-dash-bg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{view.device_type ?? "unknown"}</Badge>
                    <span className="text-xs text-dash-muted">
                      {view.source ?? "direct"}
                    </span>
                  </div>
                  <span className="text-xs text-dash-muted">
                    {formatDateTime(view.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent RSVPs */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-dash-text">Recent RSVPs</h2>
          {stats.recentRsvps.length === 0 ? (
            <EmptyState title="No RSVPs yet" description="RSVPs will appear here once guests respond." />
          ) : (
            <div className="space-y-2">
              {stats.recentRsvps.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="flex items-center justify-between rounded-lg bg-dash-bg px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-dash-text">
                      {rsvp.guest_name}
                    </p>
                    <p className="text-xs text-dash-muted">
                      {rsvp.plus_ones > 0 && `+${rsvp.plus_ones} guest(s) · `}
                      {formatDateTime(rsvp.submitted_at)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      rsvp.status === "attending"
                        ? "success"
                        : rsvp.status === "declined"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {rsvp.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
