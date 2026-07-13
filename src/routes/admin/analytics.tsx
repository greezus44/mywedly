import { useQuery } from "@tanstack/react-query";
import { supabase, type Wedding, type SharingEvent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import { Eye, QrCode, MousePointerClick, Heart, Monitor, Tablet, Smartphone, Globe, Activity } from "lucide-react";

export function AnalyticsPage() {
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
    queryKey: ["analytics-events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("sharing_events").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false }).limit(500);
      return (data || []) as SharingEvent[];
    },
    enabled: !!wedding,
  });

  const stats = {
    visits: events?.filter((e) => e.event_type === "visit").length || 0,
    scans: events?.filter((e) => e.event_type === "qr_scan").length || 0,
    clicks: events?.filter((e) => e.event_type === "link_click").length || 0,
    rsvps: events?.filter((e) => e.event_type === "rsvp").length || 0,
  };

  const statCards = [
    { label: "Total Visits", value: stats.visits, icon: Eye, color: "text-gray-900" },
    { label: "QR Scans", value: stats.scans, icon: QrCode, color: "text-gray-900" },
    { label: "Link Clicks", value: stats.clicks, icon: MousePointerClick, color: "text-gray-900" },
    { label: "RSVP Conversions", value: stats.rsvps, icon: Heart, color: "text-gray-900" },
  ];

  // 14-day bar chart data
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d;
  });
  const dayLabels = last14Days.map((d) => d.toLocaleDateString("en-US", { day: "numeric", month: "short" }));
  const dayKeys = last14Days.map((d) => d.toISOString().split("T")[0]);
  const dailyCounts = dayKeys.map((key) => {
    const dayEvents = events?.filter((e) => e.created_at.split("T")[0] === key) || [];
    return dayEvents.length;
  });
  const maxDaily = Math.max(...dailyCounts, 1);

  // Device breakdown
  const deviceCounts = {
    desktop: events?.filter((e) => e.device_type === "desktop").length || 0,
    tablet: events?.filter((e) => e.device_type === "tablet").length || 0,
    mobile: events?.filter((e) => e.device_type === "mobile").length || 0,
    unknown: events?.filter((e) => !e.device_type).length || 0,
  };
  const totalDevices = deviceCounts.desktop + deviceCounts.tablet + deviceCounts.mobile + deviceCounts.unknown;
  const deviceCards = [
    { label: "Desktop", value: deviceCounts.desktop, icon: Monitor, pct: totalDevices ? Math.round((deviceCounts.desktop / totalDevices) * 100) : 0 },
    { label: "Tablet", value: deviceCounts.tablet, icon: Tablet, pct: totalDevices ? Math.round((deviceCounts.tablet / totalDevices) * 100) : 0 },
    { label: "Mobile", value: deviceCounts.mobile, icon: Smartphone, pct: totalDevices ? Math.round((deviceCounts.mobile / totalDevices) * 100) : 0 },
  ];

  // Traffic sources (event types as proxy)
  const totalEvents = events?.length || 0;
  const trafficSources = [
    { label: "Direct Visits", value: stats.visits, pct: totalEvents ? Math.round((stats.visits / totalEvents) * 100) : 0 },
    { label: "QR Scans", value: stats.scans, pct: totalEvents ? Math.round((stats.scans / totalEvents) * 100) : 0 },
    { label: "Link Clicks", value: stats.clicks, pct: totalEvents ? Math.round((stats.clicks / totalEvents) * 100) : 0 },
  ];

  // RSVP conversion rate
  const conversionRate = stats.visits > 0 ? Math.round((stats.rsvps / stats.visits) * 100) : 0;

  // Recent activity
  const recentActivity = events?.slice(0, 10) || [];

  return (
    <AdminLayout>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Analytics</h2>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
            <div className="rounded-lg bg-gray-100 p-3"><s.icon className="h-6 w-6 text-gray-700" /></div>
          </Card>
        ))}
      </div>

      <div className="mb-6">
        <Card>
          <h3 className="mb-4 text-base font-semibold text-gray-900">Activity (Last 14 Days)</h3>
          {isLoading ? <p className="text-sm text-gray-500">Loading...</p> : (
            <div className="flex items-end justify-between gap-1" style={{ height: "200px" }}>
              {dailyCounts.map((count, i) => (
                <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs font-medium text-gray-500">{count > 0 ? count : ""}</span>
                  <div className="w-full rounded-t bg-gray-900 transition-all" style={{ height: `${(count / maxDaily) * 160}px`, minHeight: count > 0 ? "4px" : "0px" }} />
                  <span className="text-[10px] text-gray-400 rotate-45 origin-left whitespace-nowrap">{dayLabels[i].split(" ")[0]}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-base font-semibold text-gray-900">Device Breakdown</h3>
          <div className="space-y-3">
            {deviceCards.map((d) => (
              <div key={d.label}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <d.icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{d.label}</span>
                  </div>
                  <span className="text-sm text-gray-500">{d.value} ({d.pct}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-gray-900" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-base font-semibold text-gray-900">Traffic Sources</h3>
          <div className="space-y-3">
            {trafficSources.map((t) => (
              <div key={t.label}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{t.label}</span>
                  </div>
                  <span className="text-sm text-gray-500">{t.value} ({t.pct}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-gray-900" style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-base font-semibold text-gray-900">RSVP Conversion</h3>
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{conversionRate}%</div>
              <p className="mt-2 text-sm text-gray-500">{stats.rsvps} RSVPs from {stats.visits} visits</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-base font-semibold text-gray-900">Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentActivity.map((e) => (
                <div key={e.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    {e.event_type === "visit" && <Eye className="h-4 w-4 text-gray-400" />}
                    {e.event_type === "qr_scan" && <QrCode className="h-4 w-4 text-gray-400" />}
                    {e.event_type === "link_click" && <MousePointerClick className="h-4 w-4 text-gray-400" />}
                    {e.event_type === "rsvp" && <Heart className="h-4 w-4 text-gray-400" />}
                    <span className="text-sm text-gray-700">{e.event_type.replace("_", " ")}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(e.created_at)}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={<Activity className="h-8 w-8" />} title="No activity yet" />}
        </Card>
      </div>
    </AdminLayout>
  );
}
