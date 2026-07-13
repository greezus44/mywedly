import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Wedding, type SharingEvent, type Rsvp, type Guest } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { formatDate, formatTime } from "../../lib/utils";
import { Eye, QrCode, MousePointerClick, Heart, Monitor, Tablet, Smartphone, TrendingUp, Users, Clock } from "lucide-react";

export function AnalyticsPage() {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<SharingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });

  const { data: wed, isLoading, error } = useQuery({
    queryKey: ["wedding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user!.id).maybeSingle();
      if (error) throw error;
      return data as Wedding | null;
    },
  });

  const { data: eventData } = useQuery({
    queryKey: ["sharing-events", wed?.id],
    enabled: !!wed,
    queryFn: async () => {
      const { data, error } = await supabase.from("sharing_events").select("*").eq("wedding_id", wed!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SharingEvent[];
    },
  });

  const { data: rsvpData } = useQuery({
    queryKey: ["rsvps-analytics", wed?.id],
    enabled: !!wed,
    queryFn: async () => {
      const { data, error } = await supabase.from("rsvps").select("*").eq("wedding_id", wed!.id);
      if (error) throw error;
      return (data || []) as Rsvp[];
    },
  });

  const { data: guestData } = useQuery({
    queryKey: ["guests-analytics", wed?.id],
    enabled: !!wed,
    queryFn: async () => {
      const { data, error } = await supabase.from("guests").select("*").eq("wedding_id", wed!.id);
      if (error) throw error;
      return (data || []) as Guest[];
    },
  });

  useEffect(() => { if (wed) setWedding(wed); }, [wed]);
  useEffect(() => { if (eventData) setEvents(eventData); }, [eventData]);
  useEffect(() => { if (rsvpData) setRsvps(rsvpData); }, [rsvpData]);
  useEffect(() => { if (guestData) setGuests(guestData); }, [guestData]);

  const stats = useMemo(() => {
    const visits = events.filter((e) => e.event_type === "visit").length;
    const qrScans = events.filter((e) => e.event_type === "qr_scan").length;
    const linkClicks = events.filter((e) => e.event_type === "link_click").length;
    const rsvpCount = events.filter((e) => e.event_type === "rsvp").length;

    const last14Days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = events.filter((e) => e.created_at.slice(0, 10) === dateStr).length;
      last14Days.push({ date: dateStr, count });
    }
    const maxCount = Math.max(...last14Days.map((d) => d.count), 1);

    const deviceCounts: Record<string, number> = {};
    events.forEach((e) => {
      const dt = e.device_type || "unknown";
      deviceCounts[dt] = (deviceCounts[dt] || 0) + 1;
    });

    const trafficSources = {
      qr_scan: qrScans,
      link_click: linkClicks,
      direct: visits - qrScans - linkClicks < 0 ? 0 : visits - qrScans - linkClicks,
    };

    const attending = rsvps.filter((r) => r.status === "attending").length;
    const conversionRate = guests.length > 0 ? Math.round((rsvps.length / guests.length) * 100) : 0;

    return { visits, qrScans, linkClicks, rsvpCount, last14Days, maxCount, deviceCounts, trafficSources, attending, conversionRate };
  }, [events, rsvps, guests]);

  if (isLoading) return <AdminLayout><div className="py-20 text-center text-gray-500">Loading…</div></AdminLayout>;
  if (error) return <AdminLayout><div className="py-20 text-center text-red-600">{error.message}</div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="py-20 text-center text-gray-500">No wedding found.</div></AdminLayout>;

  const statCards = [
    { label: "Total Visits", value: stats.visits, icon: Eye, color: "text-gray-900", bg: "bg-gray-100" },
    { label: "QR Scans", value: stats.qrScans, icon: QrCode, color: "text-gray-900", bg: "bg-gray-100" },
    { label: "Link Clicks", value: stats.linkClicks, icon: MousePointerClick, color: "text-gray-900", bg: "bg-gray-100" },
    { label: "RSVP Actions", value: stats.rsvpCount, icon: Heart, color: "text-gray-900", bg: "bg-gray-100" },
  ];

  const deviceIcons: Record<string, typeof Monitor> = { desktop: Monitor, tablet: Tablet, mobile: Smartphone, unknown: Monitor };
  const totalDevices = Object.values(stats.deviceCounts).reduce((a, b) => a + b, 0) || 1;

  const recentActivity = events.slice(0, 10);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-500">Track visits, scans, and engagement.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2.5 ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                <div>
                  <p className="text-xs font-medium text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-900">Activity (Last 14 Days)</h3>
          </div>
          <div className="flex items-end justify-between gap-1.5" style={{ height: "180px" }}>
            {stats.last14Days.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center" style={{ height: "140px" }}>
                  <div
                    className="w-full max-w-[28px] rounded-t bg-gray-900 transition-all hover:bg-gray-700"
                    style={{ height: `${(d.count / stats.maxCount) * 100}%`, minHeight: d.count > 0 ? "4px" : "2px" }}
                    title={`${d.count} events on ${formatDate(d.date)}`}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{new Date(d.date).getDate()}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">Device Breakdown</h3>
            </div>
            {Object.keys(stats.deviceCounts).length === 0 ? (
              <EmptyState icon={<Monitor className="h-8 w-8" />} title="No data yet" />
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.deviceCounts).map(([device, count]) => {
                  const Icon = deviceIcons[device] || Monitor;
                  const pct = Math.round((count / totalDevices) * 100);
                  return (
                    <div key={device} className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize text-gray-700">{device}</span>
                          <span className="text-gray-500">{count} ({pct}%)</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                          <div className="h-2 rounded-full bg-gray-900" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">Traffic Sources</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(stats.trafficSources).map(([source, count]) => {
                const total = Object.values(stats.trafficSources).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={source} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize text-gray-700">{source.replace("_", " ")}</span>
                        <span className="text-gray-500">{count} ({pct}%)</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-gray-900" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-900">RSVP Conversion</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <Users className="mx-auto h-6 w-6 text-gray-500" />
              <p className="mt-2 text-2xl font-bold text-gray-900">{guests.length}</p>
              <p className="text-xs text-gray-500">Total Guests</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <Heart className="mx-auto h-6 w-6 text-gray-500" />
              <p className="mt-2 text-2xl font-bold text-gray-900">{rsvps.length}</p>
              <p className="text-xs text-gray-500">RSVPs Received</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <TrendingUp className="mx-auto h-6 w-6 text-gray-500" />
              <p className="mt-2 text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
              <p className="text-xs text-gray-500">Conversion Rate</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
          </div>
          {recentActivity.length === 0 ? (
            <EmptyState icon={<Clock className="h-8 w-8" />} title="No activity yet" description="Visitor events will appear here." />
          ) : (
            <ul className="space-y-2">
              {recentActivity.map((e) => (
                <li key={e.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    {e.event_type === "visit" && <Eye className="h-4 w-4 text-gray-400" />}
                    {e.event_type === "qr_scan" && <QrCode className="h-4 w-4 text-gray-400" />}
                    {e.event_type === "link_click" && <MousePointerClick className="h-4 w-4 text-gray-400" />}
                    {e.event_type === "rsvp" && <Heart className="h-4 w-4 text-gray-400" />}
                    <span className="text-sm text-gray-700 capitalize">{e.event_type.replace("_", " ")}</span>
                    {e.device_type && <Badge variant="default">{e.device_type}</Badge>}
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(e.created_at)} {formatTime(e.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
