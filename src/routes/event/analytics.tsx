import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { formatDate } from "../../lib/utils";

export default function AnalyticsPage() {
  const { eventId } = useEventContext();

  const { data: sharingEvents, isLoading: sharingLoading, isError: sharingError } = useQuery({
    queryKey: ["analytics-sharing", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: rsvps, isLoading: rsvpLoading, isError: rsvpError } = useQuery({
    queryKey: ["analytics-rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (sharingLoading || rsvpLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (sharingError || rsvpError) {
    return (
      <ErrorState
        title="Failed to load analytics"
        description="There was an error loading your analytics data."
      />
    );
  }

  const totalShares = sharingEvents?.length ?? 0;
  const totalRsvps = rsvps?.length ?? 0;
  const confirmedRsvps = rsvps?.filter((r) => r.status === "confirmed" || r.status === "attending").length ?? 0;
  const declinedRsvps = rsvps?.filter((r) => r.status === "declined").length ?? 0;
  const pendingRsvps = rsvps?.filter((r) => r.status === "pending").length ?? 0;
  const totalGuests = rsvps?.reduce((sum, r) => sum + (r.guest_count ?? 1), 0) ?? 0;

  const stats = [
    { label: "Total Shares", value: totalShares, icon: "🔗" },
    { label: "Total RSVPs", value: totalRsvps, icon: "📋" },
    { label: "Confirmed", value: confirmedRsvps, icon: "✅" },
    { label: "Declined", value: declinedRsvps, icon: "❌" },
    { label: "Pending", value: pendingRsvps, icon: "⏳" },
    { label: "Total Guests", value: totalGuests, icon: "👥" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-dash-text">Analytics</h2>
        <p className="text-sm text-dash-muted">Track engagement and RSVP responses.</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dash-muted">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold text-dash-text">{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Shares */}
      <Card>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Recent Shares</h3>
        {sharingEvents && sharingEvents.length > 0 ? (
          <div className="space-y-2">
            {sharingEvents.slice(0, 10).map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between rounded-md border border-dash-border bg-dash-bg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{share.platform}</Badge>
                  <span className="text-sm text-dash-muted truncate max-w-xs">{share.url}</span>
                </div>
                <span className="text-xs text-dash-muted">{formatDate(share.created_at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dash-muted">No shares recorded yet.</p>
        )}
      </Card>

      {/* Recent RSVPs */}
      <Card>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Recent RSVP Responses</h3>
        {rsvps && rsvps.length > 0 ? (
          <div className="space-y-2">
            {rsvps.slice(0, 10).map((rsvp) => (
              <div
                key={rsvp.id}
                className="flex items-center justify-between rounded-md border border-dash-border bg-dash-bg px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      rsvp.status === "confirmed" || rsvp.status === "attending"
                        ? "success"
                        : rsvp.status === "declined"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {rsvp.status}
                  </Badge>
                  <span className="text-sm text-dash-text">
                    {rsvp.guest_count ?? 1} guest(s)
                  </span>
                  {rsvp.message && (
                    <span className="text-sm text-dash-muted truncate max-w-xs">
                      "{rsvp.message}"
                    </span>
                  )}
                </div>
                <span className="text-xs text-dash-muted">{formatDate(rsvp.responded_at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dash-muted">No RSVP responses yet.</p>
        )}
      </Card>
    </div>
  );
}
