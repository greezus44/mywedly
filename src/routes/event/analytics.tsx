import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SharingEvent, type EventRsvp } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, LoadingSpinner, ErrorState } from "../../components/ui";
import { formatDate } from "../../lib/utils";

export const AnalyticsPage: React.FC = () => {
  const { eventId } = useEventContext();

  const { data: sharingEvents, isLoading: sharingLoading, isError: sharingError, refetch: refetchSharing } = useQuery({
    queryKey: ["sharing-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SharingEvent[];
    },
  });

  const { data: rsvps, isLoading: rsvpLoading, isError: rsvpError } = useQuery({
    queryKey: ["event-rsvps-analytics", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventRsvp[];
    },
  });

  const stats = useMemo(() => {
    const totalVisits = sharingEvents?.length ?? 0;
    const uniqueGuests = new Set(
      (sharingEvents ?? []).filter((e) => e.guest_id).map((e) => e.guest_id),
    ).size;
    const bySource: Record<string, number> = {};
    for (const e of sharingEvents ?? []) {
      const src = e.source ?? "unknown";
      bySource[src] = (bySource[src] ?? 0) + 1;
    }
    const byDevice: Record<string, number> = {};
    for (const e of sharingEvents ?? []) {
      const dev = e.device_type ?? "unknown";
      byDevice[dev] = (byDevice[dev] ?? 0) + 1;
    }

    const rsvpList = rsvps ?? [];
    const totalRsvps = rsvpList.length;
    const attending = rsvpList.filter((r) => r.status === "attending").length;
    const declined = rsvpList.filter((r) => r.status === "declined").length;
    const pending = rsvpList.filter((r) => r.status === "pending" || !r.status).length;
    const totalGuests = rsvpList.reduce((sum, r) => sum + (r.guest_count || 0), 0);

    return {
      totalVisits,
      uniqueGuests,
      bySource,
      byDevice,
      totalRsvps,
      attending,
      declined,
      pending,
      totalGuests,
    };
  }, [sharingEvents, rsvps]);

  const recentVisits = useMemo(() => {
    return (sharingEvents ?? []).slice(0, 10);
  }, [sharingEvents]);

  if (sharingLoading || rsvpLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" label="Loading analytics..." />
      </div>
    );
  }

  if (sharingError || rsvpError) {
    return (
      <ErrorState
        title="Failed to load analytics"
        message="We couldn't load your analytics data."
        onRetry={() => {
          refetchSharing();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Analytics</h2>
        <p className="text-sm text-dash-muted">Track visits and RSVP responses.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-dash-muted">Total Visits</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{stats.totalVisits}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Unique Guests Visited</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{stats.uniqueGuests}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Total RSVPs</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{stats.totalRsvps}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Total Guests Attending</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{stats.totalGuests}</p>
        </Card>
      </div>

      {/* RSVP Breakdown */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">RSVP Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-700">Attending</p>
            <p className="mt-1 text-2xl font-bold text-green-800">{stats.attending}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">Declined</p>
            <p className="mt-1 text-2xl font-bold text-red-800">{stats.declined}</p>
          </div>
          <div className="rounded-lg border border-dash-border bg-dash-bg p-4">
            <p className="text-sm text-dash-muted">Pending</p>
            <p className="mt-1 text-2xl font-bold text-dash-text">{stats.pending}</p>
          </div>
        </div>
      </Card>

      {/* Visit Sources & Devices */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-dash-text">Visit Sources</h3>
          {Object.keys(stats.bySource).length === 0 ? (
            <p className="text-sm text-dash-muted">No visit data yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.bySource).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-dash-text">{source}</span>
                  <span className="text-sm font-medium text-dash-muted">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-dash-text">Device Types</h3>
          {Object.keys(stats.byDevice).length === 0 ? (
            <p className="text-sm text-dash-muted">No device data yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.byDevice).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-dash-text">{device}</span>
                  <span className="text-sm font-medium text-dash-muted">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Visits */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Recent Visits</h3>
        {recentVisits.length === 0 ? (
          <p className="text-sm text-dash-muted">No visits recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {recentVisits.map((visit) => (
              <div
                key={visit.id}
                className="flex items-center justify-between rounded-md border border-dash-border bg-dash-bg px-3 py-2"
              >
                <div>
                  <span className="text-sm font-medium text-dash-text">
                    {visit.source ?? "Direct"}
                  </span>
                  <span className="ml-2 text-xs text-dash-muted">
                    {visit.device_type ?? "unknown"}
                  </span>
                </div>
                <span className="text-xs text-dash-muted">
                  {formatDate(visit.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
