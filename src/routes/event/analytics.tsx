import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp, type SharingEvent } from "../../lib/supabase";
import { formatDate } from "../../lib/utils";
import { Card, LoadingSpinner, ErrorState, Badge, EmptyState } from "../../components/ui";

export default function AnalyticsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: sharingEvents, isLoading: viewsLoading, isError: viewsError } = useQuery({
    queryKey: ["sharing_events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("wedding_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SharingEvent[];
    },
  });

  const { data: rsvps, isLoading: rsvpsLoading, isError: rsvpsError } = useQuery({
    queryKey: ["event_rsvps", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const isLoading = viewsLoading || rsvpsLoading;
  const isError = viewsError || rsvpsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState message="Failed to load analytics data." />;
  }

  const views = sharingEvents ?? [];
  const rsvpList = rsvps ?? [];
  const totalViews = views.length;
  const uniqueGuests = new Set(views.map((v) => v.guest_id).filter(Boolean)).size;
  const totalRsvps = rsvpList.length;
  const attending = rsvpList.filter((r) => r.status === "attending" || r.status === "yes").length;
  const declined = rsvpList.filter((r) => r.status === "declined" || r.status === "no").length;
  const pending = rsvpList.filter((r) => r.status === "pending").length;

  const stats = [
    { label: "Total Views", value: totalViews, icon: "👁" },
    { label: "Unique Guests", value: uniqueGuests, icon: "👥" },
    { label: "Total RSVPs", value: totalRsvps, icon: "📝" },
    { label: "Attending", value: attending, icon: "✓" },
    { label: "Declined", value: declined, icon: "✕" },
    { label: "Pending", value: pending, icon: "⏳" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Analytics</h2>
        <p className="text-sm text-dash-muted">Track views and RSVP responses for your website.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <div className="text-2xl">{stat.icon}</div>
            <div className="mt-1 text-2xl font-bold text-dash-text">{stat.value}</div>
            <div className="text-xs text-dash-muted">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Recent Views */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Recent Views</h3>
        {views.length === 0 ? (
          <EmptyState title="No views yet" description="Share your website URL to start tracking views." />
        ) : (
          <div className="space-y-2">
            {views.slice(0, 20).map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-lg border border-dash-border bg-dash-bg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="info">{v.event_type}</Badge>
                  <span className="text-sm text-dash-muted">{v.source || "direct"}</span>
                  {v.device_type && (
                    <span className="text-xs text-dash-muted">• {v.device_type}</span>
                  )}
                </div>
                <span className="text-xs text-dash-muted">
                  {formatDate(v.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent RSVPs */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Recent RSVPs</h3>
        {rsvpList.length === 0 ? (
          <EmptyState title="No RSVPs yet" description="RSVP responses will appear here once guests respond." />
        ) : (
          <div className="space-y-2">
            {rsvpList.slice(0, 20).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-dash-border bg-dash-bg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-dash-text">{r.guest_name}</span>
                  {r.plus_ones > 0 && (
                    <span className="text-xs text-dash-muted">+{r.plus_ones}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      r.status === "attending" || r.status === "yes"
                        ? "success"
                        : r.status === "declined" || r.status === "no"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {r.status}
                  </Badge>
                  <span className="text-xs text-dash-muted">{formatDate(r.submitted_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
