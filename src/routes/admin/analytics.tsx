import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest, type GuestToken, type SharingEvent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle, ColorInput } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { generateQRDataURL, downloadQRPNG, downloadQRSVG, downloadQRHighRes, downloadAllGuestQRsAsZip, downloadAllGuestQRsAsPDF, copyToClipboard, getShareUrl } from "../../lib/qr";
import { generateToken, cn } from "../../lib/utils";
import { formatDate } from "../../lib/utils";
import {
  QrCode, Download, Copy, Share2, MessageCircle, Send, Mail, Smartphone,
  Globe, Link2, RefreshCw, Users, BarChart3, Eye,
  MousePointerClick, CheckCircle2, Monitor, Tablet,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Analytics page                                                     */
/* ------------------------------------------------------------------ */

export function AnalyticsPage() {
  /* ---------------- wedding ---------------- */
  const { data: wedding, isLoading: wLoading, error: wError } = useQuery<Wedding>({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("created_by", user.user.id)
        .single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  /* ---------------- sharing events ---------------- */
  const { data: events = [], isLoading: eLoading, error: eError } = useQuery<SharingEvent[]>({
    queryKey: ["sharing-events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SharingEvent[];
    },
    enabled: !!wedding,
  });

  /* ---------------- rsvps (for conversion) ---------------- */
  const { data: rsvps = [] } = useQuery({
    queryKey: ["rsvps", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase
        .from("rsvps")
        .select("*")
        .eq("wedding_id", wedding.id);
      return (data || []) as Array<{ id: string; status: string }>;
    },
    enabled: !!wedding,
  });

  /* ---------------- aggregations ---------------- */
  const totalVisits = events.filter((e) => e.event_type === "page_view").length;
  const qrScans = events.filter((e) => e.event_type === "qr_scan").length;
  const linkClicks = events.filter((e) => e.event_type === "link_click").length;
  const rsvpConversions = rsvps.filter((r) => r.status === "accepted").length;
  const conversionRate = totalVisits > 0 ? ((rsvpConversions / totalVisits) * 100).toFixed(1) : "0.0";

  /* visits over last 7 days */
  const last7Days = (() => {
    const days: { label: string; date: Date; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d,
        count: 0,
      });
    }
    for (const ev of events) {
      if (ev.event_type !== "page_view") continue;
      const evDate = new Date(ev.created_at);
      evDate.setHours(0, 0, 0, 0);
      for (const d of days) {
        if (d.date.getTime() === evDate.getTime()) {
          d.count++;
          break;
        }
      }
    }
    return days;
  })();
  const maxDayCount = Math.max(1, ...last7Days.map((d) => d.count));

  /* sharing methods breakdown */
  const sourceCounts = (() => {
    const map = new Map<string, number>();
    for (const ev of events) {
      if (ev.event_type !== "link_click") continue;
      const src = ev.source || "unknown";
      map.set(src, (map.get(src) || 0) + 1);
    }
    const arr = Array.from(map.entries()).map(([source, count]) => ({ source, count }));
    arr.sort((a, b) => b.count - a.count);
    return arr;
  })();
  const maxSourceCount = Math.max(1, ...sourceCounts.map((s) => s.count));

  /* device types breakdown */
  const deviceCounts = (() => {
    const map = new Map<string, number>();
    for (const ev of events) {
      const dt = ev.device_type || "unknown";
      map.set(dt, (map.get(dt) || 0) + 1);
    }
    const arr = Array.from(map.entries()).map(([device, count]) => ({ device, count }));
    arr.sort((a, b) => b.count - a.count);
    return arr;
  })();
  const maxDeviceCount = Math.max(1, ...deviceCounts.map((d) => d.count));

  /* recent activity (latest 15) */
  const recentActivity = events.slice(0, 15);

  /* ---------------- loading / error ---------------- */
  if (wLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-gray-500">Loading analytics...</p>
        </div>
      </AdminLayout>
    );
  }

  if (wError || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data.</p>
        </div>
      </AdminLayout>
    );
  }

  /* ---------------- helpers ---------------- */
  const SOURCE_LABELS: Record<string, { label: string; icon: typeof Share2; color: string }> = {
    whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "bg-green-500" },
    telegram: { label: "Telegram", icon: Send, color: "bg-sky-500" },
    facebook: { label: "Facebook", icon: Globe, color: "bg-blue-600" },
    messenger: { label: "Messenger", icon: MessageCircle, color: "bg-blue-500" },
    twitter: { label: "X (Twitter)", icon: Globe, color: "bg-gray-900" },
    instagram: { label: "Instagram", icon: Share2, color: "bg-pink-500" },
    email: { label: "Email", icon: Mail, color: "bg-indigo-500" },
    sms: { label: "SMS", icon: Smartphone, color: "bg-purple-500" },
    copy: { label: "Copy Link", icon: Link2, color: "bg-gray-500" },
    unknown: { label: "Unknown", icon: Link2, color: "bg-gray-400" },
  };

  const DEVICE_META: Record<string, { label: string; icon: typeof Monitor; color: string }> = {
    mobile: { label: "Mobile", icon: Smartphone, color: "bg-indigo-500" },
    tablet: { label: "Tablet", icon: Tablet, color: "bg-amber-500" },
    desktop: { label: "Desktop", icon: Monitor, color: "bg-gray-700" },
    unknown: { label: "Unknown", icon: Monitor, color: "bg-gray-400" },
  };

  const sourceMeta = (src: string) => SOURCE_LABELS[src] || SOURCE_LABELS.unknown;
  const deviceMeta = (dt: string) => DEVICE_META[dt] || DEVICE_META.unknown;

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 overflow-y-auto">
        {/* header */}
        <div className="mb-6">
          <h1 className="font-ui text-xl font-bold text-gray-900">Analytics</h1>
          <p className="font-ui text-sm text-gray-500 mt-1">
            Track visits, QR scans, sharing activity, and RSVP conversions.
          </p>
        </div>

        {/* ============ Overview Stats ============ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Visits"
            value={totalVisits}
            icon={Eye}
            hint="Page views"
            accent="indigo"
          />
          <StatCard
            label="QR Scans"
            value={qrScans}
            icon={QrCode}
            hint="QR code scans"
            accent="purple"
          />
          <StatCard
            label="Link Clicks"
            value={linkClicks}
            icon={MousePointerClick}
            hint="Shared link clicks"
            accent="blue"
          />
          <StatCard
            label="RSVP Conversions"
            value={rsvpConversions}
            icon={CheckCircle2}
            hint={`${conversionRate}% conversion rate`}
            accent="green"
          />
        </div>

        {eLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="font-ui text-sm text-gray-500">Loading analytics data...</p>
          </div>
        ) : eError ? (
          <Card className="p-6">
            <p className="font-ui text-sm text-red-500">Failed to load sharing events.</p>
          </Card>
        ) : events.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={<BarChart3 size={40} />}
              title="No analytics data yet"
              description="Sharing events will appear here once guests start visiting your wedding website or scanning QR codes."
            />
          </Card>
        ) : (
          <>
            {/* ============ Charts ============ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Visits over last 7 days */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={18} className="text-indigo-600" />
                  <h3 className="font-ui text-sm font-semibold text-gray-900">Visits — Last 7 Days</h3>
                </div>
                <div className="flex items-end justify-between gap-2 h-40">
                  {last7Days.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full bg-indigo-500 rounded-t-md transition-all hover:bg-indigo-600 relative group"
                          style={{ height: `${(d.count / maxDayCount) * 100}%`, minHeight: d.count > 0 ? "8px" : "2px" }}
                        >
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-ui text-xs font-medium text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                            {d.count}
                          </span>
                        </div>
                      </div>
                      <span className="font-ui text-xs text-gray-400">{d.label}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Sharing methods breakdown */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Share2 size={18} className="text-indigo-600" />
                  <h3 className="font-ui text-sm font-semibold text-gray-900">Sharing Methods</h3>
                </div>
                {sourceCounts.length === 0 ? (
                  <p className="font-ui text-xs text-gray-400">No sharing activity yet.</p>
                ) : (
                  <div className="space-y-3">
                    {sourceCounts.map((s) => {
                      const meta = sourceMeta(s.source);
                      const Icon = meta.icon;
                      return (
                        <div key={s.source}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Icon size={14} className="text-gray-500" />
                              <span className="font-ui text-xs font-medium text-gray-700">{meta.label}</span>
                            </div>
                            <span className="font-ui text-xs font-medium text-gray-900">{s.count}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", meta.color)}
                              style={{ width: `${(s.count / maxSourceCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Device types breakdown */}
              <Card className="p-5 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone size={18} className="text-indigo-600" />
                  <h3 className="font-ui text-sm font-semibold text-gray-900">Device Types</h3>
                </div>
                {deviceCounts.length === 0 ? (
                  <p className="font-ui text-xs text-gray-400">No device data yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {deviceCounts.map((d) => {
                      const meta = deviceMeta(d.device);
                      const Icon = meta.icon;
                      const pct = events.length > 0 ? Math.round((d.count / events.length) * 100) : 0;
                      return (
                        <div key={d.device} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <div className={cn("p-1.5 rounded-md", meta.color)}>
                              <Icon size={14} className="text-white" />
                            </div>
                            <span className="font-ui text-xs font-medium text-gray-700">{meta.label}</span>
                          </div>
                          <div className="flex items-end justify-between mb-2">
                            <span className="font-ui text-2xl font-bold text-gray-900">{d.count}</span>
                            <span className="font-ui text-xs text-gray-400">{pct}%</span>
                          </div>
                          <div className="h-2 bg-white rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", meta.color)}
                              style={{ width: `${(d.count / maxDeviceCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* ============ RSVP Conversion ============ */}
            <Card className="p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-indigo-600" />
                <h3 className="font-ui text-sm font-semibold text-gray-900">RSVP Conversion</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-ui text-xs font-medium text-gray-500">Total Visits</p>
                  <p className="font-ui text-xl font-bold text-gray-900 mt-1">{totalVisits}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-ui text-xs font-medium text-gray-500">RSVPs Accepted</p>
                  <p className="font-ui text-xl font-bold text-gray-900 mt-1">{rsvpConversions}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="font-ui text-xs font-medium text-indigo-600">Conversion Rate</p>
                  <p className="font-ui text-xl font-bold text-indigo-700 mt-1">{conversionRate}%</p>
                </div>
              </div>
              {/* conversion bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-ui text-xs text-gray-500">Visits → RSVPs</span>
                  <span className="font-ui text-xs font-medium text-gray-700">{conversionRate}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all"
                    style={{ width: `${Math.min(parseFloat(conversionRate), 100)}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* ============ Recent Activity ============ */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Eye size={18} className="text-indigo-600" />
                  <h3 className="font-ui text-sm font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <Badge variant="default">{events.length} total events</Badge>
              </div>
              {recentActivity.length === 0 ? (
                <p className="font-ui text-xs text-gray-400">No recent activity.</p>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((ev) => {
                    const meta = sourceMeta(ev.source || "unknown");
                    const SourceIcon = meta.icon;
                    const dmeta = deviceMeta(ev.device_type || "unknown");
                    const DeviceIcon = dmeta.icon;
                    return (
                      <div
                        key={ev.id}
                        className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0 p-2 bg-indigo-50 rounded-lg">
                          <SourceIcon size={14} className="text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-ui text-xs font-medium text-gray-900 capitalize">
                              {ev.event_type.replace(/_/g, " ")}
                            </span>
                            {ev.source && (
                              <Badge variant="default">{meta.label}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <DeviceIcon size={11} className="text-gray-400" />
                            <span className="font-ui text-xs text-gray-400 capitalize">
                              {dmeta.label}
                            </span>
                          </div>
                        </div>
                        <span className="font-ui text-xs text-gray-400 whitespace-nowrap">
                          {formatTimestamp(ev.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                           */
/* ------------------------------------------------------------------ */

const ACCENT_CLASSES: Record<string, { bg: string; text: string }> = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  green: { bg: "bg-green-50", text: "text-green-600" },
};

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "indigo",
}: {
  label: string;
  value: string | number;
  icon: typeof Eye;
  hint?: string;
  accent?: keyof typeof ACCENT_CLASSES;
}) {
  const a = ACCENT_CLASSES[accent] || ACCENT_CLASSES.indigo;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-ui text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="font-ui text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {hint && <p className="font-ui text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
        <div className={cn("p-2.5 rounded-lg", a.bg)}>
          <Icon size={20} className={a.text} />
        </div>
      </div>
    </Card>
  );
}
