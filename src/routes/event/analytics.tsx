import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SharingEvent, type EventRsvp } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { formatDate } from "../../lib/utils";

export default function AnalyticsPage() {
  const { event, eventId } = useEventContext();

  const { data: visits, isLoading: visitsLoading, isError: visitsError } = useQuery({
    queryKey: ["analytics-visits", eventId],
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

  const stats = useMemo(() => {
    const totalVisits = visits?.length ?? 0;
    const uniqueGuests = new Set(visits?.map((v) => v.guest_id).filter(Boolean)).size;
    const totalRsvps = rsvps?.length ?? 0;
    const attending = rsvps?.filter((r) => r.status === "attending" || r.status === "yes").length ?? 0;
    const notAttending = rsvps?.filter((r) => r.status === "not_attending" || r.status === "no").length ?? 0;
    const maybe = rsvps?.filter((r) => r.status === "maybe").length ?? 0;
    const totalPlusOnes = rsvps?.reduce((sum, r) => sum + (r.plus_ones || 0), 0) ?? 0;

    return { totalVisits, uniqueGuests, totalRsvps, attending, notAttending, maybe, totalPlusOnes };
  }, [visits, rsvps]);

  const recentVisits = useMemo(() => (visits ?? []).slice(0, 10), [visits]);
  const recentRsvps = useMemo(() => (rsvps ?? []).slice(0, 10), [rsvps]);

  if (visitsLoading || rsvpsLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (visitsError || rsvpsError) {
    return (
      <ErrorState message="Failed to load analytics data." />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-dash-text">Analytics</h1>
        <p className="text-sm text-dash-muted">Track visits and RSVP responses.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-dash-muted">Total Visits</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{stats.totalVisits}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Unique Guests</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{stats.uniqueGuests}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Total RSVPs</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{stats.totalRsvps}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Total Plus Ones</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{stats.totalPlusOnes}</p>
        </Card>
      </div>

      {/* RSVP breakdown */}
      <Card>
        <h2 className="text-lg font-semibold text-dash-text">RSVP Breakdown</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="success">Attending</Badge>
            <span className="text-2xl font-bold text-dash-text">{stats.attending}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="danger">Not Attending</Badge>
            <span className="text-2xl font-bold text-dash-text">{stats.notAttending}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning">Maybe</Badge>
            <span className="text-2xl font-bold text-dash-text">{stats.maybe}</span>
          </div>
        </div>
      </Card>

      {/* Recent visits */}
      <Card>
        <h2 className="text-lg font-semibold text-dash-text">Recent Visits</h2>
        {recentVisits.length === 0 ? (
          <p className="mt-4 text-sm text-dash-muted">No visits recorded yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border text-left text-dash-muted">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Source</th>
                  <th className="pb-2 pr-4 font-medium">Device</th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.map((v) => (
                  <tr key={v.id} className="border-b border-dash-border/50">
                    <td className="py-2 pr-4 text-dash-text">
                      {formatDate(v.created_at)}
                    </td>
                    <td className="py-2 pr-4 text-dash-muted">{v.source ?? "—"}</td>
                    <td className="py-2 pr-4 text-dash-muted">{v.device_type ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Recent RSVPs */}
      <Card>
        <h2 className="text-lg font-semibold text-dash-text">Recent RSVPs</h2>
        {recentRsvps.length === 0 ? (
          <p className="mt-4 text-sm text-dash-muted">No RSVP responses yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border text-left text-dash-muted">
                  <th className="pb-2 pr-4 font-medium">Guest</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Plus Ones</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRsvps.map((r) => (
                  <tr key={r.id} className="border-b border-dash-border/50">
                    <td className="py-2 pr-4 text-dash-text">{r.guest_name}</td>
                    <td className="py-2 pr-4">
                      <Badge
                        variant={
                          r.status === "attending" || r.status === "yes"
                            ? "success"
                            : r.status === "not_attending" || r.status === "no"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 text-dash-muted">{r.plus_ones}</td>
                    <td className="py-2 pr-4 text-dash-muted">{formatDate(r.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
