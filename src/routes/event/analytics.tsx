import React from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { UserEvent, SharingEvent, EventRsvp } from "../../lib/supabase";
import { Card, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";

export function AnalyticsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();

  const { data: sharingEvents, isLoading: eventsLoading, isError: eventsError } = useQuery({
    queryKey: ["sharing-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SharingEvent[];
    },
  });

  const { data: rsvps, isLoading: rsvpsLoading, isError: rsvpsError } = useQuery({
    queryKey: ["event-rsvps-analytics", eventId],
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

  const isLoading = eventsLoading || rsvpsLoading;
  const isError = eventsError || rsvpsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState message="Failed to load analytics data" />
    );
  }

  const totalViews = sharingEvents?.length ?? 0;
  const uniqueGuests = new Set(
    (sharingEvents ?? []).filter((e) => e.guest_id).map((e) => e.guest_id)
  ).size;
  const totalRsvps = rsvps?.length ?? 0;
  const attending = (rsvps ?? []).filter((r) => r.status === "attending").length;
  const declined = (rsvps ?? []).filter((r) => r.status === "declined").length;
  const pending = (rsvps ?? []).filter((r) => r.status === "pending" || !r.status).length;

  const deviceTypes = (sharingEvents ?? []).reduce<Record<string, number>>((acc, e) => {
    const dt = e.device_type || "unknown";
    acc[dt] = (acc[dt] ?? 0) + 1;
    return acc;
  }, {});

  const sources = (sharingEvents ?? []).reduce<Record<string, number>>((acc, e) => {
    const src = e.source || "direct";
    acc[src] = (acc[src] ?? 0) + 1;
    return acc;
  }, {});

  const recentViews = (sharingEvents ?? []).slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-dash-text">Analytics</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Track views and RSVP responses for your website.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Views" value={totalViews} icon="👁" />
        <StatCard label="Unique Guests" value={uniqueGuests} icon="👥" />
        <StatCard label="Total RSVPs" value={totalRsvps} icon="📝" />
        <StatCard label="Attending" value={attending} icon="✅" />
      </div>

      {/* RSVP breakdown */}
      <Card className="p-6 mb-6">
        <h3 className="text-sm font-semibold text-dash-text mb-4">RSVP Breakdown</h3>
        <div className="space-y-3">
          <StatBar label="Attending" value={attending} total={totalRsvps} color="bg-green-500" />
          <StatBar label="Declined" value={declined} total={totalRsvps} color="bg-red-500" />
          <StatBar label="Pending" value={pending} total={totalRsvps} color="bg-amber-500" />
        </div>
      </Card>

      {/* Device & Source breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-dash-text mb-4">Devices</h3>
          {Object.keys(deviceTypes).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(deviceTypes).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between text-sm">
                  <span className="text-dash-muted capitalize">{device}</span>
                  <span className="font-medium text-dash-text">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dash-muted">No data yet</p>
          )}
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-dash-text mb-4">Sources</h3>
          {Object.keys(sources).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(sources).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between text-sm">
                  <span className="text-dash-muted capitalize">{source}</span>
                  <span className="font-medium text-dash-text">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dash-muted">No data yet</p>
          )}
        </Card>
      </div>

      {/* Recent views */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-dash-text mb-4">Recent Views</h3>
        {recentViews.length > 0 ? (
          <div className="space-y-2">
            {recentViews.map((view) => (
              <div
                key={view.id}
                className="flex items-center justify-between border-b border-dash-border pb-2 last:border-0 last:pb-0"
              >
                <div className="text-sm">
                  <span className="text-dash-text">{view.event_type || "page_view"}</span>
                  {view.device_type && (
                    <span className="text-dash-muted ml-2 capitalize">· {view.device_type}</span>
                  )}
                  {view.source && (
                    <span className="text-dash-muted ml-2 capitalize">· {view.source}</span>
                  )}
                </div>
                <span className="text-xs text-dash-muted">
                  {formatDateTime(view.created_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No views yet" description="Share your website to start collecting data." />
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <Card className="p-5">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-dash-text">{value}</div>
      <div className="text-sm text-dash-muted">{label}</div>
    </Card>
  );
}

function StatBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-dash-text">{label}</span>
        <span className="text-dash-muted">{value} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-dash-bg overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
