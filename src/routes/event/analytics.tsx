import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SharingEvent, type EventRsvp } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";

export function AnalyticsPage() {
  const { eventId } = useEventContext();

  const {
    data: sharingEvents,
    isLoading: sharingLoading,
    isError: sharingError,
    error: sharingErr,
  } = useQuery({
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

  const {
    data: rsvps,
    isLoading: rsvpLoading,
    isError: rsvpError,
    error: rsvpErr,
  } = useQuery({
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

  const isLoading = sharingLoading || rsvpLoading;
  const isError = sharingError || rsvpError;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    const msg = sharingErr?.message || rsvpErr?.message || "Failed to load analytics";
    return <ErrorState message={msg} />;
  }

  const totalViews = sharingEvents?.length ?? 0;
  const uniqueGuests = new Set(sharingEvents?.map((e) => e.guest_id).filter(Boolean)).size;
  const deviceBreakdown: Record<string, number> = {};
  for (const ev of sharingEvents ?? []) {
    const dt = ev.device_type ?? "unknown";
    deviceBreakdown[dt] = (deviceBreakdown[dt] ?? 0) + 1;
  }

  const totalRsvps = rsvps?.length ?? 0;
  const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
  const notAttending = rsvps?.filter((r) => r.status === "not_attending").length ?? 0;
  const pending = rsvps?.filter((r) => r.status === "pending").length ?? 0;

  const recentViews = (sharingEvents ?? []).slice(0, 10);
  const recentRsvps = (rsvps ?? []).slice(0, 10);

  if (totalViews === 0 && totalRsvps === 0) {
    return (
      <EmptyState
        title="No analytics yet"
        description="Share your invitation website to start collecting analytics."
        icon={<span className="text-4xl">📊</span>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-dash-text">Analytics</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Track views and RSVP responses for your invitation website.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-dash-muted">Total Views</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{totalViews}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Unique Guests</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{uniqueGuests}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Total RSVPs</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{totalRsvps}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Attending</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{attending}</p>
        </Card>
      </div>

      {/* RSVP breakdown */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text">RSVP Breakdown</h3>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="success">Attending</Badge>
            <span className="text-sm font-medium text-dash-text">{attending}</span>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="danger">Not Attending</Badge>
            <span className="text-sm font-medium text-dash-text">{notAttending}</span>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="warning">Pending</Badge>
            <span className="text-sm font-medium text-dash-text">{pending}</span>
          </div>
        </div>
      </Card>

      {/* Device breakdown */}
      {Object.keys(deviceBreakdown).length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-dash-text">Device Breakdown</h3>
          <div className="mt-4 space-y-2">
            {Object.entries(deviceBreakdown).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between">
                <span className="text-sm capitalize text-dash-text">{device}</span>
                <span className="text-sm font-medium text-dash-text">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent views */}
      {recentViews.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-dash-text">Recent Views</h3>
          <div className="mt-4 space-y-2">
            {recentViews.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between border-b border-dash-border pb-2 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="default">{ev.source ?? "link"}</Badge>
                  {ev.device_type && (
                    <span className="text-sm capitalize text-dash-muted">
                      {ev.device_type}
                    </span>
                  )}
                </div>
                <span className="text-sm text-dash-muted">
                  {new Date(ev.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent RSVPs */}
      {recentRsvps.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-dash-text">Recent RSVPs</h3>
          <div className="mt-4 space-y-2">
            {recentRsvps.map((rsvp) => (
              <div
                key={rsvp.id}
                className="flex items-center justify-between border-b border-dash-border pb-2 last:border-0"
              >
                <span className="text-sm font-medium text-dash-text">
                  {rsvp.guest_name}
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      rsvp.status === "attending"
                        ? "success"
                        : rsvp.status === "not_attending"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {rsvp.status}
                  </Badge>
                  <span className="text-sm text-dash-muted">
                    {new Date(rsvp.submitted_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
