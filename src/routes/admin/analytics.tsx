import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Wedding, type SharingEvent, type Rsvp, type GuestbookEntry } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import { Eye, QrCode, MousePointerClick, Heart, Monitor, Tablet, Smartphone, BarChart3, Users, MessageSquare } from "lucide-react";

export function AnalyticsPage() {
  const [range, setRange] = useState<7 | 14 | 30>(14);

  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      return data as Wedding | null;
    },
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["sharing-events-all"],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("sharing_events").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as SharingEvent[];
    },
    enabled: !!wedding,
  });

  const { data: rsvps } = useQuery({
    queryKey: ["rsvps"],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("rsvps").select("*").eq("wedding_id", wedding.id);
      return (data || []) as Rsvp[];
    },
    enabled: !!wedding,
  });

  const { data: messages } = useQuery({
    queryKey: ["guestbook-entries"],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id);
      return (data || []) as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  const stats = useMemo(() => {
    const allEvents = events || [];
    const visits = allEvents.filter((e) => e.event_type === "visit");
    const scans = allEvents.filter((e) => e.event_type === "qr_scan");
    const clicks = allEvents.filter((e) => e.event_type === "link_click");

    // 14-day bar chart data
    const days: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayStr = d.toISOString().split("T")[0];
      const count = visits.filter((v) => v.created_at.split("T")[0] === dayStr).length;
      days.push({ date: dayStr, count });
    }
    const maxCount = Math.max(...days.map((d) => d.count), 1);

    // Device breakdown
    const deviceCounts: Record<string, number> = {};
    allEvents.forEach((e) => {
      const dt = e.device_type || "unknown";
      deviceCounts[dt] = (deviceCounts[dt] || 0) + 1;
    });

    // Traffic sources
    const sourceCounts: Record<string, number> = {};
    allEvents.forEach((e) => {
      sourceCounts[e.event_type] = (sourceCounts[e.event_type] || 0) + 1;
    });

    // RSVP conversion
    const totalVisits = visits.length;
    const totalRsvps = (rsvps || []).length;
    const conversionRate = totalVisits > 0 ? ((totalRsvps / totalVisits) * 100).toFixed(1) : "0";

    // Recent activity
    const recent = allEvents.slice(0, 10);

    return {
      visits: visits.length,
      scans: scans.length,
      clicks: clicks.length,
      rsvpCount: totalRsvps,
      messageCount: (messages || []).length,
      days,
      maxCount,
      deviceCounts,
      sourceCounts,
      conversionRate,
      recent,
    };
  }, [events, rsvps, messages, range]);

  const deviceIcons: Record<string, typeof Monitor> = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
  };

  const sourceLabels: Record<string, string> = {
    visit: "Direct Visit",
    qr_scan: "QR Scan",
    link_click: "Link Click",
    rsvp: "RSVP",
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20 text-gray-500">Loading analytics...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">Track visits, scans, and engagement for your wedding site.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-gray-200 p-1">
          {([7, 14, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${range === r ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <Eye className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.visits}</p>
              <p className="text-sm text-gray-500">Total Visits</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <QrCode className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.scans}</p>
              <p className="text-sm text-gray-500">QR Scans</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <MousePointerClick className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.clicks}</p>
              <p className="text-sm text-gray-500">Link Clicks</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50">
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.conversionRate}%</p>
              <p className="text-sm text-gray-500">RSVP Rate</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <Card className="lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <BarChart3 className="h-4 w-4 text-indigo-600" /> Visits Over Time ({range} days)
          </h3>
          <div className="flex items-end gap-1" style={{ height: "200px" }}>
            {stats.days.map((day) => {
              const heightPct = (day.count / stats.maxCount) * 100;
              return (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-indigo-500 transition-all hover:bg-indigo-600"
                      style={{ height: `${Math.max(heightPct, day.count > 0 ? 4 : 0)}%` }}
                      title={`${formatDate(day.date)}: ${day.count} visits`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{new Date(day.date).getDate()}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <h3 className="mb-4 font-semibold text-gray-900">Device Breakdown</h3>
          {Object.keys(stats.deviceCounts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.deviceCounts).map(([device, count]) => {
                const total = Object.values(stats.deviceCounts).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                const Icon = deviceIcons[device] || Monitor;
                return (
                  <div key={device}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-700 capitalize">
                        <Icon className="h-4 w-4" /> {device}
                      </span>
                      <span className="text-gray-500">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No data" description="Device data will appear here." />
          )}
        </Card>

        {/* Traffic Sources */}
        <Card>
          <h3 className="mb-4 font-semibold text-gray-900">Traffic Sources</h3>
          {Object.keys(stats.sourceCounts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.sourceCounts).map(([source, count]) => {
                const total = Object.values(stats.sourceCounts).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={source}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-700">{sourceLabels[source] || source}</span>
                      <span className="text-gray-500">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No data" description="Traffic source data will appear here." />
          )}
        </Card>

        {/* RSVP Conversion */}
        <Card>
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <Heart className="h-4 w-4 text-pink-600" /> RSVP Conversion
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.visits}</p>
              <p className="text-xs text-gray-500">Visits</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.rsvpCount}</p>
              <p className="text-xs text-gray-500">RSVPs</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-indigo-600">{stats.conversionRate}%</p>
              <p className="text-xs text-gray-500">Rate</p>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <h3 className="mb-4 font-semibold text-gray-900">Recent Activity</h3>
          {stats.recent.length > 0 ? (
            <div className="space-y-2">
              {stats.recent.map((event) => (
                <div key={event.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{sourceLabels[event.event_type] || event.event_type}</Badge>
                    <span className="text-sm text-gray-600 capitalize">{event.device_type || "unknown"}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(event.created_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No activity yet" description="Activity will appear here once guests visit your site." />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
