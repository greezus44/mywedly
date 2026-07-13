import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { LoadingSpinner, ErrorState, Card } from "../../components/ui";
import { formatDate, formatDateTime } from "../../lib/utils";

export default function Analytics() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: views, isLoading: viewsLoading, error: viewsError } = useQuery({
    queryKey: ["sharing_events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("wedding_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: rsvps, isLoading: rsvpsLoading, error: rsvpsError } = useQuery({
    queryKey: ["event_rsvps", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (viewsLoading || rsvpsLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (viewsError || rsvpsError) {
    return <ErrorState message="Failed to load analytics data." />;
  }

  const totalViews = views?.length ?? 0;
  const uniqueGuestViews = new Set(views?.map((v) => v.guest_id).filter(Boolean)).size;
  const deviceTypes = (views || []).reduce<Record<string, number>>((acc, v) => {
    const dt = v.device_type || "unknown";
    acc[dt] = (acc[dt] || 0) + 1;
    return acc;
  }, {});

  const totalRsvps = rsvps?.length ?? 0;
  const attending = rsvps?.filter((r) => r.status === "attending" || r.status === "yes").length ?? 0;
  const notAttending = rsvps?.filter((r) => r.status === "not_attending" || r.status === "no").length ?? 0;
  const maybe = rsvps?.filter((r) => r.status === "maybe").length ?? 0;
  const pending = rsvps?.filter((r) => r.status === "pending" || !r.status).length ?? 0;

  const recentViews = (views || []).slice(0, 10);
  const recentRsvps = (rsvps || []).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Analytics</h2>
        <p className="mt-1 text-sm text-dash-muted">Track views and RSVP responses for your website.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-dash-primary">{totalViews}</div>
          <div className="mt-1 text-sm text-dash-muted">Total Views</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-dash-primary">{uniqueGuestViews}</div>
          <div className="mt-1 text-sm text-dash-muted">Unique Guests</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-dash-primary">{totalRsvps}</div>
          <div className="mt-1 text-sm text-dash-muted">Total RSVPs</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600">{attending}</div>
          <div className="mt-1 text-sm text-dash-muted">Attending</div>
        </Card>
      </div>

      {/* RSVP breakdown */}
      <Card>
        <h3 className="text-lg font-semibold text-dash-text">RSVP Breakdown</h3>
        <div className="mt-4 space-y-3">
          {[
            { label: "Attending", count: attending, color: "bg-green-500" },
            { label: "Not Attending", count: notAttending, color: "bg-red-500" },
            { label: "Maybe", count: maybe, color: "bg-amber-500" },
            { label: "Pending", count: pending, color: "bg-slate-400" },
          ].map((item) => {
            const pct = totalRsvps > 0 ? (item.count / totalRsvps) * 100 : 0;
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dash-text">{item.label}</span>
                  <span className="text-dash-muted">{item.count} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-dash-bg">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Device breakdown */}
      {Object.keys(deviceTypes).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-dash-text">Views by Device</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(deviceTypes).map(([device, count]) => (
              <div key={device} className="rounded-lg border border-dash-border bg-dash-bg px-4 py-2">
                <span className="text-sm font-medium text-dash-text capitalize">{device}</span>
                <span className="ml-2 text-sm text-dash-muted">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent views */}
      {recentViews.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-dash-text">Recent Views</h3>
          <div className="mt-4 space-y-2">
            {recentViews.map((view) => (
              <div key={view.id} className="flex items-center justify-between border-b border-dash-border pb-2 last:border-0">
                <div className="text-sm text-dash-text">
                  <span className="font-medium">{view.event_type || "View"}</span>
                  {view.source && <span className="ml-2 text-dash-muted">via {view.source}</span>}
                </div>
                <div className="text-xs text-dash-muted">{formatDateTime(view.created_at)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent RSVPs */}
      {recentRsvps.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-dash-text">Recent RSVPs</h3>
          <div className="mt-4 space-y-2">
            {recentRsvps.map((rsvp) => (
              <div key={rsvp.id} className="flex items-center justify-between border-b border-dash-border pb-2 last:border-0">
                <div className="text-sm">
                  <span className="font-medium text-dash-text">{rsvp.guest_name}</span>
                  <span className="ml-2 text-dash-muted capitalize">{rsvp.status}</span>
                </div>
                <div className="text-xs text-dash-muted">{formatDateTime(rsvp.submitted_at)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {totalViews === 0 && totalRsvps === 0 && (
        <Card>
          <div className="py-8 text-center">
            <p className="text-sm text-dash-muted">No analytics data yet. Share your website to start collecting data.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
