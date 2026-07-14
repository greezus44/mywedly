import React from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SharingEvent, type EventRsvp } from "../../lib/supabase";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { formatDate } from "../../lib/utils";

export function AnalyticsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();

  const { data: sharingEvents, isLoading: sharingLoading, isError: sharingError } = useQuery({
    queryKey: ["analytics-sharing", eventId],
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

  const isLoading = sharingLoading || rsvpsLoading;
  const isError = sharingError || rsvpsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20">
        <ErrorState message="Failed to load analytics data" />
      </div>
    );
  }

  // Compute stats
  const totalVisits = sharingEvents?.length ?? 0;
  const uniqueVisitors = new Set(
    (sharingEvents ?? []).map((e) => e.guest_id).filter(Boolean),
  ).size;
  const sourceCounts: Record<string, number> = {};
  for (const e of sharingEvents ?? []) {
    const src = e.source || "direct";
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
  }

  const totalRsvps = rsvps?.length ?? 0;
  const attending = (rsvps ?? []).filter((r) => r.status === "attending").length;
  const declined = (rsvps ?? []).filter((r) => r.status === "declined").length;
  const pending = (rsvps ?? []).filter(
    (r) => r.status === "pending" || !r.status,
  ).length;
  const totalPlusOnes = (rsvps ?? []).reduce((sum, r) => sum + (r.plus_ones ?? 0), 0);

  const recentVisits = (sharingEvents ?? []).slice(0, 10);
  const recentRsvps = (rsvps ?? []).slice(0, 10);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Analytics</h2>
        <p className="text-sm text-dash-muted mt-1">
          Track visits and RSVP responses for your website.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-dash-primary">{totalVisits}</div>
          <div className="text-sm text-dash-muted mt-1">Total Visits</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-dash-primary">{uniqueVisitors}</div>
          <div className="text-sm text-dash-muted mt-1">Unique Guests</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600">{attending}</div>
          <div className="text-sm text-dash-muted mt-1">Attending</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-red-600">{declined}</div>
          <div className="text-sm text-dash-muted mt-1">Declined</div>
        </Card>
      </div>

      {/* RSVP Summary */}
      <Card>
        <h3 className="text-sm font-semibold text-dash-text mb-4">RSVP Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-lg font-semibold text-dash-text">{totalRsvps}</div>
            <div className="text-xs text-dash-muted">Total Responses</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">{attending}</div>
            <div className="text-xs text-dash-muted">Attending</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600">{declined}</div>
            <div className="text-xs text-dash-muted">Declined</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-dash-text">{totalPlusOnes}</div>
            <div className="text-xs text-dash-muted">Plus Ones</div>
          </div>
        </div>
      </Card>

      {/* Recent Visits */}
      <Card>
        <h3 className="text-sm font-semibold text-dash-text mb-4">Recent Visits</h3>
        {recentVisits.length > 0 ? (
          <div className="space-y-2">
            {recentVisits.map((visit) => (
              <div
                key={visit.id}
                className="flex items-center justify-between py-2 border-b border-dash-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="primary">{visit.source || "direct"}</Badge>
                  <span className="text-sm text-dash-muted">
                    {visit.device_type || "Unknown device"}
                  </span>
                </div>
                <span className="text-xs text-dash-muted">
                  {formatDate(visit.created_at?.slice(0, 10))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No visits yet" description="Visits will appear here once guests view your site." />
        )}
      </Card>

      {/* Recent RSVPs */}
      <Card>
        <h3 className="text-sm font-semibold text-dash-text mb-4">Recent RSVPs</h3>
        {recentRsvps.length > 0 ? (
          <div className="space-y-2">
            {recentRsvps.map((rsvp) => (
              <div
                key={rsvp.id}
                className="flex items-center justify-between py-2 border-b border-dash-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-dash-text">
                    {rsvp.guest_name}
                  </span>
                  <Badge
                    variant={
                      rsvp.status === "attending"
                        ? "success"
                        : rsvp.status === "declined"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {rsvp.status || "pending"}
                  </Badge>
                  {rsvp.plus_ones > 0 && (
                    <span className="text-xs text-dash-muted">
                      +{rsvp.plus_ones} guest{rsvp.plus_ones > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <span className="text-xs text-dash-muted">
                  {formatDate(rsvp.submitted_at?.slice(0, 10))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No RSVPs yet" description="RSVP responses will appear here once guests respond." />
        )}
      </Card>
    </div>
  );
}
