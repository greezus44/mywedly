import { useQuery } from "@tanstack/react-query";
import { supabase, type SharingEvent, type EventRsvp } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, Badge, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";

export function AnalyticsPage() {
  const { eventId } = useEventContext();

  const { data: sharingEvents, isLoading: sharingLoading, isError: sharingError, refetch: refetchSharing } = useQuery({
    queryKey: ["analytics-sharing", eventId],
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
    queryKey: ["analytics-rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId!);
      if (error) throw error;
      return data as EventRsvp[];
    },
    enabled: !!eventId,
  });

  if (sharingLoading || rsvpLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (sharingError || rsvpError) {
    return (
      <ErrorState
        message="Failed to load analytics data."
        onRetry={() => refetchSharing()}
      />
    );
  }

  const totalViews = sharingEvents?.length ?? 0;
  const uniqueGuests = new Set(sharingEvents?.map((e) => e.guest_id).filter(Boolean)).size;
  const totalRsvps = rsvps?.length ?? 0;
  const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
  const notAttending = rsvps?.filter((r) => r.status === "not_attending").length ?? 0;
  const pending = rsvps?.filter((r) => r.status === "pending" || r.status === "no_response").length ?? 0;

  const stats = [
    { label: "Page Views", value: totalViews, icon: "👁️" },
    { label: "Unique Guests", value: uniqueGuests, icon: "👥" },
    { label: "Total RSVPs", value: totalRsvps, icon: "📋" },
    { label: "Attending", value: attending, icon: "✅" },
    { label: "Not Attending", value: notAttending, icon: "❌" },
    { label: "Pending", value: pending, icon: "⏳" },
  ];

  const recentViews = sharingEvents?.slice(0, 10) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Analytics</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Track views, RSVP responses, and guest engagement.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="text-2xl">{stat.icon}</div>
            <div className="mt-2 text-2xl font-bold text-dash-text">{stat.value}</div>
            <div className="text-xs text-dash-muted">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Recent views */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Recent Page Views</h3>
        {recentViews.length === 0 ? (
          <EmptyState title="No views yet" description="Page views will appear here once guests visit your website." />
        ) : (
          <div className="space-y-2">
            {recentViews.map((view) => (
              <div
                key={view.id}
                className="flex items-center justify-between rounded-md border border-dash-border bg-dash-bg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="default">{view.source}</Badge>
                  {view.device_type && (
                    <span className="text-xs text-dash-muted">{view.device_type}</span>
                  )}
                </div>
                <span className="text-xs text-dash-muted">
                  {formatDateTime(view.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
