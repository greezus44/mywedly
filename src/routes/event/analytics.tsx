import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SharingEvent, type EventRsvp } from "../../lib/supabase";
import { useOutletContext } from "./event-layout";
import {
  Card,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { formatDateTime } from "../../lib/utils";

export default function Analytics() {
  const { event, eventId } = useOutletContext();

  const { data: sharingEvents, isLoading: sLoading, isError: sError } = useQuery({
    queryKey: ["sharing_events", eventId],
    enabled: !!eventId,
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

  const { data: rsvps, isLoading: rLoading, isError: rError } = useQuery({
    queryKey: ["event_rsvps", eventId],
    enabled: !!eventId,
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
    const views = sharingEvents?.length ?? 0;
    const uniqueGuests = new Set(
      sharingEvents?.filter((s) => s.guest_id).map((s) => s.guest_id)
    ).size;
    const rsvpCount = rsvps?.length ?? 0;
    const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
    const notAttending = rsvps?.filter((r) => r.status === "not_attending").length ?? 0;
    const pending = rsvps?.filter((r) => r.status === "pending").length ?? 0;
    const totalPlusOnes = rsvps?.reduce((sum, r) => sum + (r.plus_ones ?? 0), 0) ?? 0;
    return { views, uniqueGuests, rsvpCount, attending, notAttending, pending, totalPlusOnes };
  }, [sharingEvents, rsvps]);

  const deviceBreakdown = useMemo(() => {
    const devices: Record<string, number> = {};
    sharingEvents?.forEach((s) => {
      const dt = s.device_type ?? "unknown";
      devices[dt] = (devices[dt] ?? 0) + 1;
    });
    return devices;
  }, [sharingEvents]);

  if (sLoading || rLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (sError || rError) {
    return (
      <ErrorState description="Failed to load analytics data" />
    );
  }

  const statCards = [
    { label: "Page Views", value: stats.views, icon: "👁" },
    { label: "Unique Guests", value: stats.uniqueGuests, icon: "👥" },
    { label: "RSVPs Received", value: stats.rsvpCount, icon: "✅" },
    { label: "Attending", value: stats.attending, icon: "🎉" },
    { label: "Not Attending", value: stats.notAttending, icon: "❌" },
    { label: "Total Plus Ones", value: stats.totalPlusOnes, icon: "➕" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-6 text-lg font-semibold text-dash-text">Analytics</h2>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dash-muted">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-dash-text">
                  {stat.value}
                </p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Device breakdown */}
      <Card className="mb-6 p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">
          Device Breakdown
        </h3>
        {Object.keys(deviceBreakdown).length === 0 ? (
          <p className="text-sm text-dash-muted">No data yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {Object.entries(deviceBreakdown).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between">
                <span className="text-sm text-dash-text capitalize">{device}</span>
                <Badge variant="info">{count}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent views */}
      <Card className="mb-6 p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">
          Recent Page Views
        </h3>
        {!sharingEvents || sharingEvents.length === 0 ? (
          <EmptyState title="No views yet" description="Share your link to get views." />
        ) : (
          <div className="max-h-64 overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-dash-surface">
                <tr className="text-left text-dash-muted">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Source</th>
                  <th className="pb-2">Device</th>
                </tr>
              </thead>
              <tbody>
                {sharingEvents.slice(0, 20).map((s) => (
                  <tr key={s.id} className="border-t border-dash-border">
                    <td className="py-2 text-dash-text">
                      {formatDateTime(s.created_at)}
                    </td>
                    <td className="py-2 text-dash-muted">{s.source ?? "—"}</td>
                    <td className="py-2 text-dash-muted capitalize">
                      {s.device_type ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Recent RSVPs */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">
          Recent RSVPs
        </h3>
        {!rsvps || rsvps.length === 0 ? (
          <EmptyState title="No RSVPs yet" description="RSVPs will appear here once guests respond." />
        ) : (
          <div className="max-h-64 overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-dash-surface">
                <tr className="text-left text-dash-muted">
                  <th className="pb-2">Guest</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Plus Ones</th>
                  <th className="pb-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.slice(0, 20).map((r) => (
                  <tr key={r.id} className="border-t border-dash-border">
                    <td className="py-2 text-dash-text">{r.guest_name}</td>
                    <td className="py-2">
                      <Badge
                        variant={
                          r.status === "attending"
                            ? "success"
                            : r.status === "not_attending"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-dash-muted">{r.plus_ones}</td>
                    <td className="py-2 text-dash-muted">
                      {formatDateTime(r.submitted_at)}
                    </td>
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
