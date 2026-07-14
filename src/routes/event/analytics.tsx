import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SharingEvent, type EventRsvp } from "../../lib/supabase";
import { Card, Badge, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { formatDate, formatDateTime } from "../../lib/utils";
import type { EventOutletContext } from "./event-layout";

export default function Analytics() {
  const { event, eventId } = useOutletContext<EventOutletContext>();

  const { data: sharingEvents, isLoading: sLoading, error: sError } = useQuery({
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

  const { data: rsvps, isLoading: rLoading, error: rError } = useQuery({
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
    const totalVisits = sharingEvents?.length ?? 0;
    const uniqueVisitors = new Set(
      (sharingEvents ?? []).map((s) => s.guest_id).filter(Boolean)
    ).size;
    const totalRsvps = rsvps?.length ?? 0;
    const attending = (rsvps ?? []).filter((r) => r.status === "yes").length;
    const notAttending = (rsvps ?? []).filter((r) => r.status === "no").length;
    const maybe = (rsvps ?? []).filter((r) => r.status === "maybe").length;
    const totalPlusOnes = (rsvps ?? [])
      .filter((r) => r.status === "yes")
      .reduce((sum, r) => sum + (r.plus_ones ?? 0), 0);
    return {
      totalVisits,
      uniqueVisitors,
      totalRsvps,
      attending,
      notAttending,
      maybe,
      totalPlusOnes,
    };
  }, [sharingEvents, rsvps]);

  const deviceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of sharingEvents ?? []) {
      const device = s.device_type ?? "unknown";
      counts[device] = (counts[device] ?? 0) + 1;
    }
    return counts;
  }, [sharingEvents]);

  if (sLoading || rLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (sError || rError) {
    return (
      <div className="p-4">
        <ErrorState
          title="Failed to load analytics"
          message={sError?.message ?? rError?.message ?? "Unknown error"}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Analytics</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Track visits and RSVP responses for {event.draft_name ?? event.name}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-dash-muted">Total Visits</p>
            <p className="mt-1 text-2xl font-bold text-dash-text">
              {stats.totalVisits}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-dash-muted">Unique Visitors</p>
            <p className="mt-1 text-2xl font-bold text-dash-text">
              {stats.uniqueVisitors}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-dash-muted">RSVPs</p>
            <p className="mt-1 text-2xl font-bold text-dash-text">
              {stats.totalRsvps}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-dash-muted">Total Guests</p>
            <p className="mt-1 text-2xl font-bold text-dash-text">
              {stats.attending + stats.totalPlusOnes}
            </p>
          </Card>
        </div>

        {/* RSVP breakdown */}
        <Card>
          <h3 className="text-sm font-semibold text-dash-text">RSVP Breakdown</h3>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-xs font-medium text-green-700">Attending</p>
              <p className="mt-1 text-2xl font-bold text-green-800">
                {stats.attending}
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-xs font-medium text-amber-700">Maybe</p>
              <p className="mt-1 text-2xl font-bold text-amber-800">
                {stats.maybe}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-xs font-medium text-red-700">Not Attending</p>
              <p className="mt-1 text-2xl font-bold text-red-800">
                {stats.notAttending}
              </p>
            </div>
          </div>
        </Card>

        {/* Device breakdown */}
        {Object.keys(deviceBreakdown).length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-dash-text">Device Breakdown</h3>
            <div className="mt-4 space-y-2">
              {Object.entries(deviceBreakdown).map(([device, count]) => (
                <div
                  key={device}
                  className="flex items-center justify-between rounded-lg bg-dash-bg px-3 py-2"
                >
                  <span className="text-sm text-dash-text capitalize">{device}</span>
                  <Badge>{count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent visits */}
        <Card>
          <h3 className="text-sm font-semibold text-dash-text">Recent Visits</h3>
          {sharingEvents && sharingEvents.length > 0 ? (
            <div className="mt-4 space-y-2">
              {sharingEvents.slice(0, 10).map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between rounded-lg bg-dash-bg px-3 py-2"
                >
                  <div>
                    <span className="text-sm text-dash-text">
                      {visit.source ?? "Direct"}
                    </span>
                    {visit.device_type && (
                      <span className="ml-2 text-xs text-dash-muted capitalize">
                        {visit.device_type}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-dash-muted">
                    {formatDateTime(visit.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No visits yet"
                description="Share your invitation website to start tracking visits."
              />
            </div>
          )}
        </Card>

        {/* Recent RSVPs */}
        <Card>
          <h3 className="text-sm font-semibold text-dash-text">Recent RSVPs</h3>
          {rsvps && rsvps.length > 0 ? (
            <div className="mt-4 space-y-2">
              {rsvps.slice(0, 10).map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="flex items-center justify-between rounded-lg bg-dash-bg px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-medium text-dash-text">
                      {rsvp.guest_name}
                    </span>
                    {rsvp.plus_ones != null && rsvp.plus_ones > 0 && (
                      <span className="ml-2 text-xs text-dash-muted">
                        +{rsvp.plus_ones} guests
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        rsvp.status === "yes"
                          ? "success"
                          : rsvp.status === "no"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {rsvp.status}
                    </Badge>
                    <span className="text-xs text-dash-muted">
                      {formatDate(rsvp.submitted_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No RSVPs yet"
                description="RSVP responses will appear here once guests start responding."
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
