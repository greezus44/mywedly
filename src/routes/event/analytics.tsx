import React from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Card, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { formatDate } from "../../lib/utils";

export default function Analytics() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: views, isLoading: viewsLoading, isError: viewsError, refetch: refetchViews } = useQuery({
    queryKey: ["analytics-views", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("wedding_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: rsvps, isLoading: rsvpsLoading, isError: rsvpsError, refetch: refetchRsvps } = useQuery({
    queryKey: ["analytics-rsvps", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalViews = views?.length ?? 0;
  const totalRsvps = rsvps?.length ?? 0;
  const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
  const declined = rsvps?.filter((r) => r.status === "declined").length ?? 0;
  const pending = rsvps?.filter((r) => r.status === "pending").length ?? 0;

  const viewsBySource: Record<string, number> = {};
  views?.forEach((v) => {
    const src = v.source ?? "unknown";
    viewsBySource[src] = (viewsBySource[src] ?? 0) + 1;
  });

  const viewsByDevice: Record<string, number> = {};
  views?.forEach((v) => {
    const dev = v.device_type ?? "unknown";
    viewsByDevice[dev] = (viewsByDevice[dev] ?? 0) + 1;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Analytics</h2>
        <p className="mt-1 text-sm text-dash-muted">Track views and RSVP responses.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Views" value={totalViews} loading={viewsLoading} />
        <StatCard label="Total RSVPs" value={totalRsvps} loading={rsvpsLoading} />
        <StatCard label="Attending" value={attending} loading={rsvpsLoading} />
        <StatCard label="Declined" value={declined} loading={rsvpsLoading} />
      </div>

      {/* RSVP Breakdown */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-dash-text">RSVP Breakdown</h3>
        {rsvpsLoading ? (
          <div className="mt-4"><LoadingSpinner /></div>
        ) : rsvpsError ? (
          <div className="mt-4"><ErrorState onRetry={() => refetchRsvps()} /></div>
        ) : (
          <div className="mt-4 space-y-2">
            <StatBar label="Attending" value={attending} total={totalRsvps} color="bg-green-500" />
            <StatBar label="Declined" value={declined} total={totalRsvps} color="bg-red-500" />
            <StatBar label="Pending" value={pending} total={totalRsvps} color="bg-amber-500" />
          </div>
        )}
      </Card>

      {/* Views by Source */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-dash-text">Views by Source</h3>
        {viewsLoading ? (
          <div className="mt-4"><LoadingSpinner /></div>
        ) : viewsError ? (
          <div className="mt-4"><ErrorState onRetry={() => refetchViews()} /></div>
        ) : Object.keys(viewsBySource).length === 0 ? (
          <p className="mt-4 text-sm text-dash-muted">No views yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {Object.entries(viewsBySource).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between text-sm">
                <span className="capitalize text-dash-text">{source}</span>
                <Badge>{count}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Views by Device */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-dash-text">Views by Device</h3>
        {viewsLoading ? (
          <div className="mt-4"><LoadingSpinner /></div>
        ) : Object.keys(viewsByDevice).length === 0 ? (
          <p className="mt-4 text-sm text-dash-muted">No views yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {Object.entries(viewsByDevice).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between text-sm">
                <span className="capitalize text-dash-text">{device}</span>
                <Badge>{count}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Views */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-dash-text">Recent Views</h3>
        {viewsLoading ? (
          <div className="mt-4"><LoadingSpinner /></div>
        ) : !views || views.length === 0 ? (
          <p className="mt-4 text-sm text-dash-muted">No views yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {views.slice(0, 10).map((v) => (
              <div key={v.id} className="flex items-center justify-between border-b border-dash-border pb-2 text-sm last:border-0">
                <span className="text-dash-text">{formatDate(v.created_at)}</span>
                <div className="flex gap-2">
                  {v.source && <Badge variant="info">{v.source}</Badge>}
                  {v.device_type && <Badge>{v.device_type}</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase text-dash-muted">{label}</p>
      {loading ? (
        <div className="mt-2"><LoadingSpinner className="h-4 w-4" /></div>
      ) : (
        <p className="mt-1 text-2xl font-bold text-dash-text">{value}</p>
      )}
    </Card>
  );
}

function StatBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-dash-text">{label}</span>
        <span className="text-dash-muted">{value} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-dash-border">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
