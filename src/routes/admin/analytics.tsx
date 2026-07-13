import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Wedding, type SharingEvent, type Rsvp, type GuestbookEntry } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import { Eye, QrCode, MousePointerClick, Heart, Smartphone, Monitor, Tablet, TrendingUp, Activity } from "lucide-react";

export function AnalyticsPage() {
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: wedding } = useQuery({
    queryKey: ["wedding", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.id).maybeSingle();
      return data as Wedding | null;
    },
    enabled: !!user,
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["sharing-events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("sharing_events").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as SharingEvent[];
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

  const { data: messages } = useQuery({
    queryKey: ["guestbook", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id);
      return (data || []) as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  const stats = useMemo(() => {
    const all = events || [];
    const visits = all.filter((e) => e.event_type === "visit");
    const scans = all.filter((e) => e.event_type === "qr_scan");
    const clicks = all.filter((e) => e.event_type === "link_click");

    // 14-day bar chart data
    const days: { date: string; count: number; label: string }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = all.filter((e) => e.created_at.slice(0, 10) === dateStr).length;
      days.push({ date: dateStr, count, label: d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }) });
    }
    const maxCount = Math.max(...days.map((d) => d.count), 1);

    // Device breakdown
    const deviceCounts: Record<string, number> = {};
    all.forEach((e) => {
      const dt = e.device_type || "unknown";
      deviceCounts[dt] = (deviceCounts[dt] || 0) + 1;
    });
    const totalDevices = Object.values(deviceCounts).reduce((a, b) => a + b, 0) || 1;

    // Traffic sources
    const sourceCounts: Record<string, number> = {};
    all.forEach((e) => {
      sourceCounts[e.event_type] = (sourceCounts[e.event_type] || 0) + 1;
    });

    // RSVP conversion
    const totalVisits = visits.length || 1;
    const rsvpCount = (rsvps || []).length;
    const conversionRate = ((rsvpCount / totalVisits) * 100).toFixed(1);

    return {
      visits: visits.length,
      scans: scans.length,
      clicks: clicks.length,
      rsvps: rsvpCount,
      messages: (messages || []).length,
      days,
      maxCount,
      deviceCounts,
      totalDevices,
      sourceCounts,
      conversionRate,
    };
  }, [events, rsvps, messages]);

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    { label: "Total Visits", value: stats.visits, icon: Eye, color: "text-gray-900" },
    { label: "QR Scans", value: stats.scans, icon: QrCode, color: "text-gray-900" },
    { label: "Link Clicks", value: stats.clicks, icon: MousePointerClick, color: "text-gray-900" },
    { label: "RSVPs", value: stats.rsvps, icon: Heart, color: "text-gray-900" },
  ];

  const deviceIcons: Record<string, typeof Monitor> = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
    unknown: Monitor,
  };

  const sourceLabels: Record<string, string> = {
    visit: "Direct Visits",
    qr_scan: "QR Scans",
    link_click: "Link Clicks",
    rsvp: "RSVP Actions",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Track visits, scans, and engagement for your wedding invitation.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="rounded-lg bg-gray-100 p-3">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* RSVP Conversion */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <TrendingUp className="h-5 w-5 text-gray-900" />
              </div>
              <div>
                <p className="text-sm text-gray-500">RSVP Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{stats.rsvps} RSVPs from {stats.visits} visits</p>
            </div>
          </div>
          {/* Conversion bar */}
          <div className="mt-4">
            <div className="h-3 w-full rounded-full bg-gray-100">
              <div
                className="h-3 rounded-full bg-gray-900 transition-all"
                style={{ width: `${Math.min(Number(stats.conversionRate), 100)}%` }}
              />
            </div>
          </div>
        </Card>

        {/* 14-Day Bar Chart */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Activity (Last 14 Days)</h2>
          </div>
          {isLoading ? (
            <div className="text-gray-500">Loading chart...</div>
          ) : (
            <div>
              <div className="flex items-end gap-1.5" style={{ height: "200px" }}>
                {stats.days.map((day) => (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t bg-gray-900 transition-all hover:bg-gray-700"
                        style={{
                          height: `${(day.count / stats.maxCount) * 100}%`,
                          minHeight: day.count > 0 ? "4px" : "0px",
                        }}
                        title={`${day.count} events on ${day.date}`}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">{day.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>14 days ago</span>
                <span>Today</span>
              </div>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Device Breakdown */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Device Breakdown</h2>
            </div>
            {stats.totalDevices <= 1 ? (
              <EmptyState title="No data yet" description="Device data will appear as guests visit." />
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.deviceCounts).map(([device, count]) => {
                  const Icon = deviceIcons[device] || Monitor;
                  const pct = ((count / stats.totalDevices) * 100).toFixed(1);
                  return (
                    <div key={device}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-gray-700">
                          <Icon className="h-4 w-4" /> {device}
                        </span>
                        <span className="text-gray-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-gray-900"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Traffic Sources */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Traffic Sources</h2>
            </div>
            {Object.keys(stats.sourceCounts).length === 0 ? (
              <EmptyState title="No data yet" description="Traffic source data will appear here." />
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.sourceCounts).map(([source, count]) => {
                  const total = Object.values(stats.sourceCounts).reduce((a, b) => a + b, 0) || 1;
                  const pct = ((count / total) * 100).toFixed(1);
                  return (
                    <div key={source}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-gray-700">{sourceLabels[source] || source}</span>
                        <span className="text-gray-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-gray-900"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          {isLoading ? (
            <div className="text-gray-500">Loading activity...</div>
          ) : (events || []).length === 0 ? (
            <EmptyState icon={<Activity className="h-8 w-8" />} title="No activity yet" description="Visitor activity will appear here." />
          ) : (
            <div className="space-y-2">
              {(events || []).slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    {event.event_type === "visit" && <Eye className="h-4 w-4 text-gray-500" />}
                    {event.event_type === "qr_scan" && <QrCode className="h-4 w-4 text-gray-500" />}
                    {event.event_type === "link_click" && <MousePointerClick className="h-4 w-4 text-gray-500" />}
                    {event.event_type === "rsvp" && <Heart className="h-4 w-4 text-gray-500" />}
                    <span className="text-sm font-medium text-gray-900">{sourceLabels[event.event_type] || event.event_type}</span>
                    {event.device_type && (
                      <Badge variant="default">{event.device_type}</Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(event.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
