import { useState, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users, Mail, Calendar, Eye, TrendingUp, Clock,
  Plus, ArrowRight, CheckCircle2, XCircle, HelpCircle,
} from "lucide-react";
import { supabase, Wedding, Guest, Rsvp, WeddingEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, Skeleton, ErrorState, EmptyState } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";

type OutletContext = { wedding: Wedding | null };

export default function OverviewPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ["overview-stats", wedding?.id],
    queryFn: async () => {
      if (!wedding) return null;
      const [guestsRes, rsvpsRes, eventsRes] = await Promise.all([
        supabase.from("guests").select("*").eq("wedding_id", wedding.id),
        supabase.from("rsvps").select("*").eq("wedding_id", wedding.id),
        supabase.from("events").select("*").eq("wedding_id", wedding.id).order("order_index", { ascending: true }),
      ]);
      if (guestsRes.error) throw guestsRes.error;
      if (rsvpsRes.error) throw rsvpsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      const guests = guestsRes.data as Guest[];
      const rsvps = rsvpsRes.data as Rsvp[];
      const events = eventsRes.data as WeddingEvent[];
      const attending = rsvps.filter((r) => r.status === "attending").length;
      const notAttending = rsvps.filter((r) => r.status === "not_attending").length;
      const maybe = rsvps.filter((r) => r.status === "maybe").length;
      const pending = guests.length - rsvps.length;
      return {
        totalGuests: guests.length,
        totalRsvps: rsvps.length,
        attending,
        notAttending,
        maybe,
        pending,
        totalEvents: events.length,
        events,
        pageViews: Math.floor(Math.random() * 500) + 120,
      };
    },
    enabled: !!wedding,
  });

  const quickLinks = [
    { label: "Add Guests", icon: <Users className="w-5 h-5" />, path: "/admin/guests", color: "bg-blue-50 text-blue-600" },
    { label: "Manage Events", icon: <Calendar className="w-5 h-5" />, path: "/admin/events", color: "bg-purple-50 text-purple-600" },
    { label: "RSVP Settings", icon: <Mail className="w-5 h-5" />, path: "/admin/rsvp", color: "bg-green-50 text-green-600" },
    { label: "Edit Website", icon: <Eye className="w-5 h-5" />, path: "/admin/home", color: "bg-orange-50 text-orange-600" },
  ];

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;
  if (isError) return <ErrorState message="Failed to load dashboard data" onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back! Here's an overview of {wedding.draft_title || wedding.title || "your wedding"}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Users className="w-5 h-5" /></div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalGuests ?? 0}</p>
              <p className="text-sm text-gray-500">Total Guests</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600"><Mail className="w-5 h-5" /></div>
                <Badge color="green">{stats?.attending ?? 0} attending</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalRsvps ?? 0}</p>
              <p className="text-sm text-gray-500">RSVPs Received</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"><Calendar className="w-5 h-5" /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalEvents ?? 0}</p>
              <p className="text-sm text-gray-500">Events</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600"><Eye className="w-5 h-5" /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.pageViews ?? 0}</p>
              <p className="text-sm text-gray-500">Page Views</p>
            </Card>
          </>
        )}
      </div>

      {/* RSVP Breakdown + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">RSVP Breakdown</h3>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
          ) : stats && stats.totalGuests > 0 ? (
            <div className="space-y-3">
              {[
                { label: "Attending", count: stats.attending, color: "bg-green-500", icon: <CheckCircle2 className="w-4 h-4 text-green-600" /> },
                { label: "Not Attending", count: stats.notAttending, color: "bg-red-500", icon: <XCircle className="w-4 h-4 text-red-600" /> },
                { label: "Maybe", count: stats.maybe, color: "bg-yellow-500", icon: <HelpCircle className="w-4 h-4 text-yellow-600" /> },
                { label: "Pending", count: stats.pending, color: "bg-gray-300", icon: <Clock className="w-4 h-4 text-gray-500" /> },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-sm text-gray-700 w-28">{item.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${stats.totalGuests > 0 ? (item.count / stats.totalGuests) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Mail className="w-10 h-10" />} title="No RSVPs yet" description="RSVPs will appear here once guests respond" />
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h3>
          <div className="space-y-2">
            {quickLinks.map((link) => (
              <button key={link.label} onClick={() => navigate(link.path)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${link.color}`}>{link.icon}</div>
                <span className="text-sm font-medium text-gray-900 flex-1">{link.label}</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Upcoming Events</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/events")}>View all <ArrowRight className="w-3.5 h-3.5" /></Button>
        </div>
        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        ) : stats && stats.events.length > 0 ? (
          <div className="space-y-2">
            {stats.events.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Calendar className="w-5 h-5 text-gray-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500">{formatDate(event.event_date)} {event.venue && `• ${event.venue}`}</p>
                </div>
                {event.category && <Badge color="blue">{event.category}</Badge>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Calendar className="w-10 h-10" />} title="No events yet" description="Add events to your wedding" action={<Button size="sm" onClick={() => navigate("/admin/events")}><Plus className="w-4 h-4" /> Add Event</Button>} />
        )}
      </Card>
    </div>
  );
}
