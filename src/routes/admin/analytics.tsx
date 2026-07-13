import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Wedding, type SharingEvent, type Guest, type Rsvp } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { formatDate, formatTime } from "../../lib/utils";
import { BarChart3, Eye, MousePointerClick, QrCode, Monitor, Tablet, Smartphone, CheckCircle2, TrendingUp, Activity } from "lucide-react";

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  const { data: wedding, isLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["sharing-events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("sharing_events").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as SharingEvent[];
    },
    enabled: !!wedding,
  });

  const { data: guests } = useQuery({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id);
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  const { data: rsvps } = useQuery({
    queryKey: ["rsvps", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("rsvps").select("*").eq("wedding_id", wedding.id);
      return (data || []) as Rsvp[];
    },
    enabled: !!wedding,
  });

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (timeRange === "all") return events;
    const cutoff = Date.now() - (timeRange === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000;
    return events.filter((e) => new Date(e.created_at).getTime() > cutoff);
  }, [events, timeRange]);

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Loading...</div></div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="p-6 text-gray-500">Wedding not found</div></AdminLayout>;

  const visits = filteredEvents.filter((e) => e.event_type === "visit");
  const scans = filteredEvents.filter((e) => e.event_type === "qr_scan");
  const clicks = filteredEvents.filter((e) => e.event_type === "click");

  // Device breakdown
  const deviceCounts = { desktop: 0, tablet: 0, mobile: 0 };
  filteredEvents.forEach((e) => {
    if (e.device_type === "mobile") deviceCounts.mobile++;
    else if (e.device_type === "tablet") deviceCounts.tablet++;
    else if (e.device_type === "desktop") deviceCounts.desktop++;
  });
  const totalDevices = deviceCounts.desktop + deviceCounts.tablet + deviceCounts.mobile;

  // Source breakdown
  const sourceMap: Record<string, number> = {};
  filteredEvents.forEach((e) => {
    const src = e.source || "direct";
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  const sources = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]);

  // Daily chart data (last 14 days)
  const dailyData: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const count = filteredEvents.filter((e) => {
      const ed = new Date(e.created_at);
      return ed >= d && ed < next;
    }).length;
    dailyData.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count });
  }
  const maxDaily = Math.max(...dailyData.map((d) => d.count), 1);

  // RSVP conversion
  const totalGuests = guests?.length || 0;
  const totalRsvps = rsvps?.length || 0;
  const acceptedRsvps = rsvps?.filter((r) => r.status === "accepted").length || 0;
  const conversionRate = totalGuests > 0 ? (totalRsvps / totalGuests) * 100 : 0;
  const acceptanceRate = totalRsvps > 0 ? (acceptedRsvps / totalRsvps) * 100 : 0;

  const stats = [
    { label: "Total Visits", value: visits.length, icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "QR Scans", value: scans.length, icon: QrCode, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Link Clicks", value: clicks.length, icon: MousePointerClick, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "RSVP Rate", value: `${conversionRate.toFixed(0)}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-600" />
              <h1 className="font-ui text-xl font-bold text-gray-900">Analytics</h1>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {([
                { key: "7d", label: "7 Days" },
                { key: "30d", label: "30 Days" },
                { key: "all", label: "All Time" },
              ] as const).map((r) => (
                <button key={r.key} onClick={() => setTimeRange(r.key)} className={`px-3 py-1.5 font-ui text-xs font-medium rounded-md transition-all ${timeRange === r.key ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}>{r.label}</button>
              ))}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${stat.bg}`}><Icon size={18} className={stat.color} /></div>
                  </div>
                  <div className="font-ui text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="font-ui text-xs text-gray-500">{stat.label}</div>
                </Card>
              );
            })}
          </div>

          {/* Daily activity chart */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-indigo-600" />
              <h3 className="font-ui text-sm font-semibold text-gray-900">Activity (Last 14 Days)</h3>
            </div>
            <div className="flex items-end gap-1 h-40">
              {dailyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full bg-gray-100 rounded-t-md relative overflow-hidden flex items-end" style={{ height: "100%" }}>
                    <div className="w-full bg-indigo-500 rounded-t-md transition-all group-hover:bg-indigo-600" style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count > 0 ? "4px" : "0" }} />
                  </div>
                  <span className="font-ui text-[10px] text-gray-400 whitespace-nowrap">{d.date}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Device breakdown */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Monitor size={16} className="text-indigo-600" />
                <h3 className="font-ui text-sm font-semibold text-gray-900">Device Breakdown</h3>
              </div>
              {totalDevices > 0 ? (
                <div className="space-y-4">
                  {[
                    { label: "Desktop", count: deviceCounts.desktop, icon: Monitor, color: "bg-blue-500" },
                    { label: "Tablet", count: deviceCounts.tablet, icon: Tablet, color: "bg-purple-500" },
                    { label: "Mobile", count: deviceCounts.mobile, icon: Smartphone, color: "bg-indigo-500" },
                  ].map((d) => {
                    const Icon = d.icon;
                    const pct = totalDevices > 0 ? (d.count / totalDevices) * 100 : 0;
                    return (
                      <div key={d.label}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Icon size={14} className="text-gray-400" />
                            <span className="font-ui text-xs text-gray-500">{d.label}</span>
                          </div>
                          <span className="font-ui text-xs font-semibold text-gray-900">{d.count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${d.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="font-ui text-sm text-gray-400 text-center py-4">No data yet</p>
              )}
            </Card>

            {/* Source breakdown */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-indigo-600" />
                <h3 className="font-ui text-sm font-semibold text-gray-900">Traffic Sources</h3>
              </div>
              {sources.length > 0 ? (
                <div className="space-y-3">
                  {sources.map(([source, count]) => {
                    const pct = (count / filteredEvents.length) * 100;
                    return (
                      <div key={source}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-ui text-xs text-gray-500 capitalize">{source}</span>
                          <span className="font-ui text-xs font-semibold text-gray-900">{count}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="font-ui text-sm text-gray-400 text-center py-4">No data yet</p>
              )}
            </Card>
          </div>

          {/* RSVP conversion */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={16} className="text-indigo-600" />
              <h3 className="font-ui text-sm font-semibold text-gray-900">RSVP Conversion</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="font-ui text-3xl font-bold text-gray-900 mb-1">{totalGuests}</div>
                <div className="font-ui text-xs text-gray-500">Total Guests</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="font-ui text-3xl font-bold text-indigo-600 mb-1">{totalRsvps}</div>
                <div className="font-ui text-xs text-gray-500">RSVPs Received</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="font-ui text-3xl font-bold text-emerald-600 mb-1">{acceptedRsvps}</div>
                <div className="font-ui text-xs text-gray-500">Accepted ({acceptanceRate.toFixed(0)}%)</div>
              </div>
            </div>
          </Card>

          {/* Recent activity */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-indigo-600" />
              <h3 className="font-ui text-sm font-semibold text-gray-900">Recent Activity</h3>
            </div>
            {filteredEvents.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredEvents.slice(0, 20).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      {event.event_type === "visit" && <Eye size={14} className="text-blue-500" />}
                      {event.event_type === "qr_scan" && <QrCode size={14} className="text-indigo-500" />}
                      {event.event_type === "click" && <MousePointerClick size={14} className="text-purple-500" />}
                      <div>
                        <div className="font-ui text-xs font-medium text-gray-900 capitalize">{event.event_type.replace("_", " ")}</div>
                        <div className="font-ui text-xs text-gray-400">
                          {event.source && <span className="capitalize">{event.source}</span>}
                          {event.device_type && <span> • {event.device_type}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="font-ui text-xs text-gray-400">{formatDate(event.created_at)} {formatTime(event.created_at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Activity size={48} />} title="No activity yet" description="Sharing events, QR scans, and visits will appear here." />
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
