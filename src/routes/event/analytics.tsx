import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Card, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { formatDate, formatDateTime } from "../../lib/utils";
import type { EventContextValue } from "./event-layout";

interface AnalyticsSummary {
  totalShares: number;
  totalGuests: number;
  totalRsvps: number;
  attending: number;
  declined: number;
  pending: number;
}

export function AnalyticsPage() {
  const { eventId } = useOutletContext<EventContextValue>();

  const { data: summary, isLoading, isError, error, refetch } = useQuery<AnalyticsSummary>({
    queryKey: ["analytics", eventId],
    queryFn: async () => {
      const [sharesResult, guestsResult, rsvpsResult] = await Promise.all([
        supabase.from("sharing_events").select("*", { count: "exact", head: true }).eq("event_id", eventId),
        supabase.from("event_guests").select("*", { count: "exact", head: true }).eq("event_id", eventId),
        supabase.from("event_rsvps").select("status").eq("event_id", eventId),
      ]);

      if (sharesResult.error) throw sharesResult.error;
      if (guestsResult.error) throw guestsResult.error;
      if (rsvpsResult.error) throw rsvpsResult.error;

      const rsvps = rsvpsResult.data ?? [];
      const attending = rsvps.filter((r) => r.status === "attending").length;
      const declined = rsvps.filter((r) => r.status === "declined").length;
      const pending = rsvps.filter((r) => r.status === "pending" || r.status === "no_response").length;

      return {
        totalShares: sharesResult.count ?? 0,
        totalGuests: guestsResult.count ?? 0,
        totalRsvps: rsvps.length,
        attending,
        declined,
        pending,
      };
    },
  });

  const { data: recentShares } = useQuery({
    queryKey: ["recent-shares", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState message={error?.message ?? "Failed to load analytics"} onRetry={refetch} />
    );
  }

  const rsvpRate = summary && summary.totalGuests > 0
    ? Math.round((summary.totalRsvps / summary.totalGuests) * 100)
    : 0;

  const attendanceRate = summary && summary.totalRsvps > 0
    ? Math.round((summary.attending / summary.totalRsvps) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Analytics</h2>
        <p className="text-sm text-dash-muted">Track engagement and RSVPs for your event.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-dash-muted">Total Guests</p>
          <p className="mt-1 text-2xl font-bold text-dash-text">{summary?.totalGuests ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-dash-muted">Total RSVPs</p>
          <p className="mt-1 text-2xl font-bold text-dash-text">{summary?.totalRsvps ?? 0}</p>
          <p className="mt-1 text-xs text-dash-muted">{rsvpRate}% response rate</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-dash-muted">Attending</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{summary?.attending ?? 0}</p>
          <p className="mt-1 text-xs text-dash-muted">{attendanceRate}% of responses</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-dash-muted">Shares</p>
          <p className="mt-1 text-2xl font-bold text-dash-primary">{summary?.totalShares ?? 0}</p>
        </Card>
      </div>

      {/* RSVP Breakdown */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">RSVP Breakdown</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-dash-text">Attending</span>
              <span className="font-medium text-green-600">{summary?.attending ?? 0}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-dash-border">
              <div
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-dash-text">Declined</span>
              <span className="font-medium text-red-600">{summary?.declined ?? 0}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-dash-border">
              <div
                className="h-2 rounded-full bg-red-500"
                style={{ width: `${summary && summary.totalRsvps > 0 ? (summary.declined / summary.totalRsvps) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-dash-text">Pending</span>
              <span className="font-medium text-amber-600">{summary?.pending ?? 0}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-dash-border">
              <div
                className="h-2 rounded-full bg-amber-500"
                style={{ width: `${summary && summary.totalRsvps > 0 ? (summary.pending / summary.totalRsvps) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Shares */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Recent Shares</h3>
        {!recentShares || recentShares.length === 0 ? (
          <p className="text-sm text-dash-muted">No shares yet.</p>
        ) : (
          <div className="space-y-2">
            {recentShares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between rounded-md border border-dash-border bg-dash-bg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="default">{share.source ?? "direct"}</Badge>
                  {share.device_type && (
                    <span className="text-xs text-dash-muted">{share.device_type}</span>
                  )}
                </div>
                <span className="text-xs text-dash-muted">{formatDateTime(share.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default AnalyticsPage;
