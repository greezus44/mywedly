import React from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Card, Badge, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";

export default function Analytics() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", event.id],
    queryFn: async () => {
      const [viewsRes, rsvpsRes, guestsRes] = await Promise.all([
        supabase.from("sharing_events").select("*").eq("wedding_id", event.id),
        supabase.from("event_rsvps").select("*").eq("event_id", event.id),
        supabase.from("event_guests").select("*").eq("event_id", event.id),
      ]);

      if (viewsRes.error) throw viewsRes.error;

      const views = viewsRes.data || [];
      const rsvps = rsvpsRes.data || [];
      const guests = guestsRes.data || [];

      const accepted = rsvps.filter((r) => r.status === "accepted").length;
      const declined = rsvps.filter((r) => r.status === "declined").length;
      const pending = guests.filter((g) => g.rsvp_status === "pending" || !g.rsvp_status).length;

      const bySource: Record<string, number> = {};
      const byDevice: Record<string, number> = {};
      views.forEach((v) => {
        const s = v.source ?? "direct";
        const d = v.device_type ?? "unknown";
        bySource[s] = (bySource[s] ?? 0) + 1;
        byDevice[d] = (byDevice[d] ?? 0) + 1;
      });

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        const count = views.filter((v) => {
          const vd = new Date(v.created_at);
          return vd >= d && vd < next;
        }).length;
        return { label: d.toLocaleDateString("en-US", { weekday: "short" }), count };
      });

      return {
        totalViews: views.length,
        uniqueGuests: new Set(views.map((v) => v.guest_id).filter(Boolean)).size,
        accepted,
        declined,
        pending,
        totalGuests: guests.length,
        totalRsvps: rsvps.length,
        bySource,
        byDevice,
        last7Days,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load analytics." onRetry={() => refetch()} />;
  }

  if (!stats) return null;

  const statCards = [
    { label: "Page Views", value: stats.totalViews, color: "text-blue-600" },
    { label: "Unique Visitors", value: stats.uniqueGuests, color: "text-purple-600" },
    { label: "Total Guests", value: stats.totalGuests, color: "text-gray-700" },
    { label: "RSVPs Received", value: stats.totalRsvps, color: "text-green-600" },
  ];

  const rsvpCards = [
    { label: "Accepted", value: stats.accepted, variant: "success" as const },
    { label: "Declined", value: stats.declined, variant: "danger" as const },
    { label: "Pending", value: stats.pending, variant: "warning" as const },
  ];

  const maxBar = Math.max(...stats.last7Days.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-dash-text">Analytics</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="p-4">
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-sm text-dash-muted mt-1">{card.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-dash-text mb-4">RSVP Status</h3>
          <div className="space-y-3">
            {rsvpCards.map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <Badge variant={r.variant}>{r.label}</Badge>
                <span className="text-lg font-semibold text-dash-text">{r.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-dash-text mb-4">Views (Last 7 Days)</h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {stats.last7Days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-dash-primary/70 transition-all"
                  style={{ height: `${(d.count / maxBar) * 100}%`, minHeight: d.count > 0 ? "4px" : "0" }}
                />
                <span className="text-xs text-dash-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-dash-text mb-4">Traffic Sources</h3>
          {Object.keys(stats.bySource).length === 0 ? (
            <EmptyState title="No data yet" />
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.bySource).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between text-sm">
                  <span className="text-dash-muted capitalize">{source}</span>
                  <span className="font-medium text-dash-text">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-dash-text mb-4">Devices</h3>
          {Object.keys(stats.byDevice).length === 0 ? (
            <EmptyState title="No data yet" />
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.byDevice).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between text-sm">
                  <span className="text-dash-muted capitalize">{device}</span>
                  <span className="font-medium text-dash-text">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
