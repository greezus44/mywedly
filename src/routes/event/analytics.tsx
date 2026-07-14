import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SharingEvent, type EventRsvp, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { formatDateShort } from "../../lib/utils";

async function fetchAnalytics(eventId: string) {
  // Fetch sharing events (page views, opens, etc.)
  const { data: sharingEvents, error: sharingError } = await supabase
    .from("sharing_events")
    .select("*")
    .eq("event_id", eventId);
  if (sharingError) throw sharingError;

  // Fetch RSVPs
  const { data: rsvps, error: rsvpError } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId);
  if (rsvpError) throw rsvpError;

  // Fetch sub-events for grouping
  const { data: subEvents, error: subError } = await supabase
    .from("sub_events")
    .select("*")
    .eq("parent_event_id", eventId);
  if (subError) throw subError;

  return {
    sharingEvents: (sharingEvents ?? []) as SharingEvent[],
    rsvps: (rsvps ?? []) as EventRsvp[],
    subEvents: (subEvents ?? []) as SubEvent[],
  };
}

export function AnalyticsPage() {
  const { eventId } = useEventContext();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["analytics", eventId],
    queryFn: () => fetchAnalytics(eventId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load analytics"}
        onRetry={() => refetch()}
      />
    );
  }

  const sharingEvents = data?.sharingEvents ?? [];
  const rsvps = data?.rsvps ?? [];
  const subEvents = data?.subEvents ?? [];

  // Compute stats
  const totalViews = sharingEvents.length;
  const uniqueGuests = new Set(sharingEvents.filter((e) => e.guest_id).map((e) => e.guest_id!)).size;
  const totalRsvps = rsvps.length;
  const attending = rsvps.filter((r) => r.status === "attending").length;
  const notAttending = rsvps.filter((r) => r.status === "not_attending").length;
  const pending = rsvps.filter((r) => r.status === "pending" || !r.status).length;

  // Views by source
  const viewsBySource = sharingEvents.reduce<Record<string, number>>((acc, e) => {
    const source = e.source ?? "direct";
    acc[source] = (acc[source] ?? 0) + 1;
    return acc;
  }, {});

  // Views by device
  const viewsByDevice = sharingEvents.reduce<Record<string, number>>((acc, e) => {
    const device = e.device_type ?? "unknown";
    acc[device] = (acc[device] ?? 0) + 1;
    return acc;
  }, {});

  // RSVPs by sub-event
  const rsvpsBySubEvent = subEvents.map((sub) => {
    const subRsvps = rsvps.filter((r) => r.sub_event_id === sub.id);
    return {
      name: sub.name,
      total: subRsvps.length,
      attending: subRsvps.filter((r) => r.status === "attending").length,
      notAttending: subRsvps.filter((r) => r.status === "not_attending").length,
      pending: subRsvps.filter((r) => r.status === "pending" || !r.status).length,
    };
  });

  // Recent activity
  const recentViews = [...sharingEvents]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-dash-text">Analytics</h1>
        <p className="mt-1 text-sm text-dash-muted">
          Track views, RSVPs, and engagement for your website
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Views" value={totalViews} icon="👁" />
        <StatCard label="Unique Guests" value={uniqueGuests} icon="👥" />
        <StatCard label="Total RSVPs" value={totalRsvps} icon="💌" />
        <StatCard
          label="Attending"
          value={attending}
          icon="✓"
          color="success"
        />
      </div>

      {/* RSVP Breakdown */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">RSVP Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          <RsvpStat label="Attending" count={attending} color="success" />
          <RsvpStat label="Not Attending" count={notAttending} color="danger" />
          <RsvpStat label="Pending" count={pending} color="warning" />
        </div>
      </Card>

      {/* RSVPs by Event */}
      {rsvpsBySubEvent.length > 0 && (
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-dash-text">RSVPs by Event</h3>
          <div className="space-y-3">
            {rsvpsBySubEvent.map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b border-dash-border pb-2 last:border-0">
                <span className="text-sm font-medium text-dash-text">{item.name}</span>
                <div className="flex gap-2">
                  <Badge color="success">{item.attending} attending</Badge>
                  <Badge color="danger">{item.notAttending} declined</Badge>
                  <Badge color="warning">{item.pending} pending</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Views by Source & Device */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-dash-text">Views by Source</h3>
          {Object.keys(viewsBySource).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(viewsBySource).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-dash-text">{source}</span>
                  <span className="text-sm font-medium text-dash-muted">{count as number}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dash-muted">No views yet</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-dash-text">Views by Device</h3>
          {Object.keys(viewsByDevice).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(viewsByDevice).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-dash-text">{device}</span>
                  <span className="text-sm font-medium text-dash-muted">{count as number}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dash-muted">No views yet</p>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Recent Activity</h3>
        {recentViews.length > 0 ? (
          <div className="space-y-2">
            {recentViews.map((view) => (
              <div key={view.id} className="flex items-center justify-between border-b border-dash-border pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <Badge color="default">{view.event_type}</Badge>
                  {view.source && <span className="text-sm text-dash-muted">via {view.source}</span>}
                </div>
                <span className="text-xs text-dash-muted">{formatDateShort(view.created_at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dash-muted">No recent activity</p>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color?: "success" | "danger" | "warning";
}) {
  return (
    <Card className="text-center">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 text-2xl font-bold text-dash-text">{value}</div>
      <div className="mt-1 text-sm text-dash-muted">{label}</div>
    </Card>
  );
}

function RsvpStat({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "success" | "danger" | "warning";
}) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-dash-text">{count}</div>
      <div className="mt-1">
        <Badge color={color}>{label}</Badge>
      </div>
    </div>
  );
}
