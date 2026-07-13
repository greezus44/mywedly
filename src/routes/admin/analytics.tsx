import { useState, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Eye, Mail, Users, Calendar, Share2, MousePointerClick } from "lucide-react";
import { supabase, Wedding, Guest, Rsvp } from "../../lib/supabase";
import { Card, Badge, EmptyState, ErrorState, Skeleton } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";

type OutletContext = { wedding: Wedding | null };

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxBars?: number;
}

function SimpleBarChart({ data, maxBars = 7 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-40">
      {data.slice(0, maxBars).map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-gray-600">{d.value}</span>
          <div className="w-full flex-1 flex items-end">
            <div className={`w-full rounded-t-md transition-all ${d.color || "bg-gray-900"}`} style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? "4px" : "0" }} />
          </div>
          <span className="text-xs text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const { data: guests, isLoading: guestsLoading } = useQuery<Guest[]>({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id);
      if (error) throw error;
      return data as Guest[];
    },
    enabled: !!wedding,
  });

  const { data: rsvps, isLoading: rsvpsLoading } = useQuery<Rsvp[]>({
    queryKey: ["rsvps", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase.from("rsvps").select("*").eq("wedding_id", wedding.id);
      if (error) throw error;
      return data as Rsvp[];
    },
    enabled: !!wedding,
  });

  const isLoading = guestsLoading || rsvpsLoading;

  const stats = useMemo(() => {
    const totalGuests = guests?.length || 0;
    const totalRsvps = rsvps?.length || 0;
    const attending = rsvps?.filter((r) => r.status === "attending").length || 0;
    const rsvpRate = totalGuests > 0 ? Math.round((totalRsvps / totalGuests) * 100) : 0;
    const attendingRate = totalRsvps > 0 ? Math.round((attending / totalRsvps) * 100) : 0;
    return { totalGuests, totalRsvps, attending, rsvpRate, attendingRate };
  }, [guests, rsvps]);

  // Mock page views data
  const pageViewsData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({
      label: day,
      value: Math.floor(Math.random() * 80) + 20,
      color: "bg-blue-500",
    }));
  }, [wedding?.id]);

  const rsvpStatusData = useMemo(() => {
    const attending = rsvps?.filter((r) => r.status === "attending").length || 0;
    const notAttending = rsvps?.filter((r) => r.status === "not_attending").length || 0;
    const maybe = rsvps?.filter((r) => r.status === "maybe").length || 0;
    const pending = (guests?.length || 0) - (rsvps?.length || 0);
    return [
      { label: "Attending", value: attending, color: "bg-green-500" },
      { label: "Not Att.", value: notAttending, color: "bg-red-500" },
      { label: "Maybe", value: maybe, color: "bg-yellow-500" },
      { label: "Pending", value: Math.max(0, pending), color: "bg-gray-300" },
    ];
  }, [guests, rsvps]);

  const engagementData = useMemo(() => {
    return [
      { label: "Views", value: 342, color: "bg-blue-500" },
      { label: "Logins", value: 189, color: "bg-purple-500" },
      { label: "RSVPs", value: stats.totalRsvps, color: "bg-green-500" },
      { label: "Shares", value: 47, color: "bg-orange-500" },
      { label: "Messages", value: 23, color: "bg-pink-500" },
    ];
  }, [stats.totalRsvps]);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Track your wedding website performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></>
        ) : (
          <>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2"><Eye className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Page Views</span></div>
              <p className="text-2xl font-bold text-gray-900">342</p>
              <p className="text-xs text-green-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +12% this week</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2"><Mail className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">RSVP Rate</span></div>
              <p className="text-2xl font-bold text-gray-900">{stats.rsvpRate}%</p>
              <p className="text-xs text-gray-400">{stats.totalRsvps} of {stats.totalGuests}</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-purple-500" /><span className="text-xs text-gray-500">Attending</span></div>
              <p className="text-2xl font-bold text-gray-900">{stats.attending}</p>
              <p className="text-xs text-gray-400">{stats.attendingRate}% of RSVPs</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2"><Share2 className="w-4 h-4 text-orange-500" /><span className="text-xs text-gray-500">Shares</span></div>
              <p className="text-2xl font-bold text-gray-900">47</p>
              <p className="text-xs text-green-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +5 this week</p>
            </Card>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Page Views (This Week)</h3>
          </div>
          {isLoading ? <Skeleton className="h-40" /> : <SimpleBarChart data={pageViewsData} />}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">RSVP Status</h3>
          </div>
          {isLoading ? <Skeleton className="h-40" /> : stats.totalGuests > 0 ? <SimpleBarChart data={rsvpStatusData} /> : <EmptyState icon={<Mail className="w-8 h-8" />} title="No data yet" />}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <MousePointerClick className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Guest Engagement</h3>
          </div>
          {isLoading ? <Skeleton className="h-40" /> : <SimpleBarChart data={engagementData} maxBars={5} />}
        </Card>
      </div>

      {/* Summary */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-gray-600">Wedding Date:</span> <span className="font-medium text-gray-900">{formatDate(wedding.draft_wedding_date || wedding.wedding_date) || "Not set"}</span></div>
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" /><span className="text-gray-600">Total Guests:</span> <span className="font-medium text-gray-900">{stats.totalGuests}</span></div>
          <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span className="text-gray-600">RSVPs:</span> <span className="font-medium text-gray-900">{stats.totalRsvps}</span></div>
          <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-gray-400" /><span className="text-gray-600">Attending:</span> <span className="font-medium text-gray-900">{stats.attending}</span></div>
        </div>
      </Card>
    </div>
  );
}
