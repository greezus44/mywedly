import { useQuery } from "@tanstack/react-query";
import { supabase, type SharingEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, Badge, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";

export function AnalyticsPage() {
  const { eventId } = useEventContext();

  const { data: events, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["sharing-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("wedding_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SharingEvent[];
    },
    enabled: !!eventId,
  });

  const { data: stats } = useQuery({
    queryKey: ["sharing-stats", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("source, device_type")
        .eq("wedding_id", eventId);
      if (error) throw error;
      return data as Pick<SharingEvent, "source" | "device_type">[];
    },
    enabled: !!eventId,
  });

  const totalVisits = events?.length ?? 0;
  const uniqueSources = new Set(stats?.map((s) => s.source ?? "unknown") ?? []).size;
  const deviceCounts = (stats ?? []).reduce<Record<string, number>>((acc, s) => {
    const device = s.device_type ?? "unknown";
    acc[device] = (acc[device] ?? 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load analytics"
        message={error instanceof Error ? error.message : "An unexpected error occurred."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Analytics</h2>
        <p className="text-sm text-dash-muted">Track visits and engagement for your invitation.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-dash-muted">Total Visits</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{totalVisits}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Unique Sources</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{uniqueSources}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Devices</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(deviceCounts).map(([device, count]) => (
              <Badge key={device} variant="primary">
                {device}: {count}
              </Badge>
            ))}
            {Object.keys(deviceCounts).length === 0 && (
              <span className="text-sm text-dash-muted">No data yet</span>
            )}
          </div>
        </Card>
      </div>

      {/* Visit Log */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Recent Visits</h3>
        {!events || events.length === 0 ? (
          <EmptyState
            title="No visits yet"
            description="Once you publish and share your invitation, visits will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-dash-border text-dash-muted">
                <tr>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Source</th>
                  <th className="pb-2 pr-4 font-medium">Device</th>
                  <th className="pb-2 font-medium">Event Type</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 50).map((evt) => (
                  <tr key={evt.id} className="border-b border-dash-border/50">
                    <td className="py-2 pr-4 text-dash-text">{formatDateTime(evt.created_at)}</td>
                    <td className="py-2 pr-4">
                      <Badge variant="default">{evt.source ?? "unknown"}</Badge>
                    </td>
                    <td className="py-2 pr-4 text-dash-muted">{evt.device_type ?? "—"}</td>
                    <td className="py-2 text-dash-muted">{evt.event_type ?? "—"}</td>
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
