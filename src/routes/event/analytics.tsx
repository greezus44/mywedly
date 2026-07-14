import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { formatDate, formatDateTime } from "../../lib/utils";

interface SharingStat {
  event_type: string;
  count: number;
}

interface RsvpStat {
  status: string;
  count: number;
}

async function fetchSharingStats(eventId: string): Promise<SharingStat[]> {
  const { data, error } = await supabase
    .from("sharing_events")
    .select("event_type")
    .eq("wedding_id", eventId);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const type = (row as { event_type: string }).event_type;
    counts[type] = (counts[type] ?? 0) + 1;
  }

  return Object.entries(counts).map(([event_type, count]) => ({
    event_type,
    count,
  }));
}

async function fetchRsvpStats(eventId: string): Promise<RsvpStat[]> {
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("status")
    .eq("event_id", eventId);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const status = (row as { status: string }).status;
    counts[status] = (counts[status] ?? 0) + 1;
  }

  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

async function fetchRecentViews(
  eventId: string
): Promise<Array<{ id: string; event_type: string; source: string | null; created_at: string }>> {
  const { data, error } = await supabase
    .from("sharing_events")
    .select("id, event_type, source, created_at")
    .eq("wedding_id", eventId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data ?? []) as Array<{ id: string; event_type: string; source: string | null; created_at: string }>;
}

export function AnalyticsPage() {
  const { event, eventId } = useEventContext();

  const {
    data: sharingStats,
    isLoading: sharingLoading,
    isError: sharingError,
  } = useQuery({
    queryKey: ["analytics", "sharing", eventId],
    queryFn: () => fetchSharingStats(eventId),
  });

  const {
    data: rsvpStats,
    isLoading: rsvpLoading,
    isError: rsvpError,
  } = useQuery({
    queryKey: ["analytics", "rsvp", eventId],
    queryFn: () => fetchRsvpStats(eventId),
  });

  const {
    data: recentViews,
    isLoading: viewsLoading,
  } = useQuery({
    queryKey: ["analytics", "views", eventId],
    queryFn: () => fetchRecentViews(eventId),
  });

  const totalViews = sharingStats?.reduce((sum, s) => sum + s.count, 0) ?? 0;
  const totalRsvps = rsvpStats?.reduce((sum, s) => sum + s.count, 0) ?? 0;
  const attendingCount = rsvpStats?.find((s) => s.status === "attending")?.count ?? 0;
  const notAttendingCount = rsvpStats?.find((s) => s.status === "not_attending")?.count ?? 0;
  const pendingCount = rsvpStats?.find((s) => s.status === "pending")?.count ?? 0;

  const isLoading = sharingLoading || rsvpLoading || viewsLoading;
  const isError = sharingError || rsvpError;

  if (isError) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-dash-text">Analytics</h2>
        <ErrorState title="Failed to load analytics" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-dash-text">Analytics</h2>
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  const hasData = totalViews > 0 || totalRsvps > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Analytics</h2>
        <p className="text-sm text-dash-muted">
          Track views and RSVPs for {event.name}
        </p>
      </div>

      {!hasData ? (
        <EmptyState
          title="No data yet"
          description="Once you publish and share your invitation website, analytics will appear here."
        />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-sm text-dash-muted">Total Views</p>
              <p className="mt-2 text-3xl font-bold text-dash-text">{totalViews}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-dash-muted">Total RSVPs</p>
              <p className="mt-2 text-3xl font-bold text-dash-text">{totalRsvps}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-dash-muted">Attending</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{attendingCount}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-dash-muted">Not Attending</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{notAttendingCount}</p>
            </Card>
          </div>

          {/* RSVP breakdown */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-dash-text mb-4">RSVP Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-dash-text w-24">Attending</span>
                <div className="flex-1 h-4 rounded-full bg-dash-bg overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${totalRsvps > 0 ? (attendingCount / totalRsvps) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-dash-text w-8 text-right">{attendingCount}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-dash-text w-24">Not Attending</span>
                <div className="flex-1 h-4 rounded-full bg-dash-bg overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${totalRsvps > 0 ? (notAttendingCount / totalRsvps) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-dash-text w-8 text-right">{notAttendingCount}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-dash-text w-24">Pending</span>
                <div className="flex-1 h-4 rounded-full bg-dash-bg overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${totalRsvps > 0 ? (pendingCount / totalRsvps) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-dash-text w-8 text-right">{pendingCount}</span>
              </div>
            </div>
          </Card>

          {/* Recent views */}
          {recentViews && recentViews.length > 0 && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-dash-text mb-4">Recent Views</h3>
              <div className="space-y-2">
                {recentViews.map((view) => (
                  <div
                    key={view.id}
                    className="flex items-center justify-between text-sm py-2 border-b border-dash-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-dash-text font-medium capitalize">
                        {view.event_type}
                      </span>
                      {view.source && (
                        <span className="text-dash-muted">from {view.source}</span>
                      )}
                    </div>
                    <span className="text-dash-muted text-xs">
                      {formatDateTime(view.created_at)}
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
