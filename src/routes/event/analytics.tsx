import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SharingEvent, type EventRsvp } from "../../lib/supabase";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { formatDate } from "../../lib/utils";
import type { EventOutletContext } from "./event-layout";

export default function Analytics(): React.ReactElement {
  const { eventId } = useOutletContext<EventOutletContext>();

  const { data: sharingEvents, isLoading: sharingLoading, error: sharingError } = useQuery({
    queryKey: ["analytics-sharing", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("wedding_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SharingEvent[];
    },
  });

  const { data: rsvps, isLoading: rsvpsLoading, error: rsvpsError } = useQuery({
    queryKey: ["analytics-rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const stats = useMemo(() => {
    const totalViews = sharingEvents?.length ?? 0;
    const uniqueGuests = new Set(sharingEvents?.map((e) => e.guest_id).filter(Boolean) ?? []).size;
    const totalRsvps = rsvps?.length ?? 0;
    const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
    const declined = rsvps?.filter((r) => r.status === "declined").length ?? 0;
    const totalPlusOnes = rsvps?.reduce((sum, r) => sum + (r.plus_ones || 0), 0) ?? 0;
    return { totalViews, uniqueGuests, totalRsvps, attending, declined, totalPlusOnes };
  }, [sharingEvents, rsvps]);

  const deviceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of sharingEvents ?? []) {
      const dt = e.device_type ?? "unknown";
      counts[dt] = (counts[dt] ?? 0) + 1;
    }
    return counts;
  }, [sharingEvents]);

  const isLoading = sharingLoading || rsvpsLoading;
  const error = sharingError || rsvpsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  const statCards = [
    { label: "Total Views", value: stats.totalViews, icon: "👁" },
    { label: "Unique Guests", value: stats.uniqueGuests, icon: "👥" },
    { label: "Total RSVPs", value: stats.totalRsvps, icon: "✉" },
    { label: "Attending", value: stats.attending, icon: "✓" },
    { label: "Declined", value: stats.declined, icon: "✗" },
    { label: "Plus Ones", value: stats.totalPlusOnes, icon: "+" },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-dash-text">Analytics</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Track views and RSVP responses for your website
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label} className="text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-dash-text">{stat.value}</div>
            <div className="text-xs text-dash-muted mt-1">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Device breakdown */}
      {Object.keys(deviceBreakdown).length > 0 && (
        <Card className="mt-6">
          <h3 className="text-sm font-semibold text-dash-text mb-4">Device Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(deviceBreakdown).map(([device, count]) => {
              const pct = stats.totalViews > 0 ? Math.round((count / stats.totalViews) * 100) : 0;
              return (
                <div key={device} className="flex items-center gap-3">
                  <span className="text-sm text-dash-text w-24 capitalize">{device}</span>
                  <div className="flex-1 h-4 rounded-full bg-dash-bg overflow-hidden">
                    <div
                      className="h-full bg-dash-primary rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-dash-muted w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent views */}
      <Card className="mt-6">
        <h3 className="text-sm font-semibold text-dash-text mb-4">Recent Views</h3>
        {sharingEvents && sharingEvents.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {sharingEvents.slice(0, 20).map((e) => (
              <div key={e.id} className="flex items-center justify-between border-b border-dash-border pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <Badge variant={e.device_type === "mobile" ? "primary" : "default"}>
                    {e.device_type ?? "unknown"}
                  </Badge>
                  <span className="text-sm text-dash-muted">{e.source ?? "direct"}</span>
                </div>
                <span className="text-xs text-dash-muted">{formatDate(e.created_at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No views yet" description="Share your website to start tracking views." />
        )}
      </Card>

      {/* Recent RSVPs */}
      <Card className="mt-6">
        <h3 className="text-sm font-semibold text-dash-text mb-4">Recent RSVPs</h3>
        {rsvps && rsvps.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {rsvps.slice(0, 20).map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-dash-border pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-dash-text">{r.guest_name}</span>
                  <Badge variant={r.status === "attending" ? "success" : r.status === "declined" ? "danger" : "default"}>
                    {r.status}
                  </Badge>
                  {r.plus_ones > 0 && (
                    <span className="text-xs text-dash-muted">+{r.plus_ones}</span>
                  )}
                </div>
                <span className="text-xs text-dash-muted">{formatDate(r.submitted_at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No RSVPs yet" description="RSVP responses will appear here." />
        )}
      </Card>
    </div>
  );
}
