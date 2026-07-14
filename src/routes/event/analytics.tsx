import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SharingEvent, type EventRsvp } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, Badge, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { formatDate, formatDateTime } from "../../lib/utils";

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

  const { data: rsvps, isLoading: rsvpsLoading, isError: rsvpsError, refetch: refetchRsvps } = useQuery({
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

  const stats = useMemo(() => {
    const totalViews = sharingEvents?.length ?? 0;
    const uniqueGuests = new Set(sharingEvents?.map((e) => e.guest_id).filter(Boolean) as string[]).size;
    const rsvpCount = rsvps?.length ?? 0;
    const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
    const notAttending = rsvps?.filter((r) => r.status === "not_attending").length ?? 0;
    const pending = rsvps?.filter((r) => r.status === "pending").length ?? 0;
    return { totalViews, uniqueGuests, rsvpCount, attending, notAttending, pending };
  }, [sharingEvents, rsvps]);

  const deviceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    sharingEvents?.forEach((e) => {
      const device = e.device_type || "unknown";
      counts[device] = (counts[device] || 0) + 1;
    });
    return counts;
  }, [sharingEvents]);

  const sourceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    sharingEvents?.forEach((e) => {
      const source = e.source || "unknown";
      counts[source] = (counts[source] || 0) + 1;
    });
    return counts;
  }, [sharingEvents]);

  const recentEvents = useMemo(() => {
    return (sharingEvents ?? []).slice(0, 10);
  }, [sharingEvents]);

  if (sharingLoading || rsvpsLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (sharingError || rsvpsError) {
    return (
      <ErrorState
        title="Failed to load analytics"
        onRetry={() => {
          refetchSharing();
          refetchRsvps();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-dash-text">Analytics</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <p className="text-sm text-dash-muted">Total Views</p>
          <p className="mt-1 text-2xl font-bold text-dash-text">{stats.totalViews}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Unique Guests</p>
          <p className="mt-1 text-2xl font-bold text-dash-text">{stats.uniqueGuests}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Total RSVPs</p>
          <p className="mt-1 text-2xl font-bold text-dash-text">{stats.rsvpCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Attending</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.attending}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Not Attending</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats.notAttending}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{stats.pending}</p>
        </Card>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-dash-text">Device Breakdown</h3>
          {Object.keys(deviceBreakdown).length === 0 ? (
            <p className="text-sm text-dash-muted">No data yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(deviceBreakdown).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <span className="text-sm text-dash-text capitalize">{device}</span>
                  <Badge>{count}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-dash-text">Source Breakdown</h3>
          {Object.keys(sourceBreakdown).length === 0 ? (
            <p className="text-sm text-dash-muted">No data yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(sourceBreakdown).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm text-dash-text capitalize">{source}</span>
                  <Badge>{count}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Recent Activity</h3>
        {recentEvents.length === 0 ? (
          <EmptyState title="No activity yet" description="Sharing events will appear here." />
        ) : (
          <div className="space-y-2">
            {recentEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between border-b border-dash-border pb-2 last:border-0"
              >
                <div>
                  <span className="text-sm font-medium text-dash-text">
                    {e.event_type || "view"}
                  </span>
                  {e.source && (
                    <span className="ml-2 text-xs text-dash-muted">
                      via {e.source}
                    </span>
                  )}
                </div>
                <span className="text-xs text-dash-muted">
                  {formatDateTime(e.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
