import { useQuery } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest, type Rsvp, type GuestbookEntry, type WeddingEvent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import { Users, Calendar, MessageCircle, CheckCircle2, BarChart3, Eye, Heart, Clock, MapPin } from "lucide-react";

export function OverviewPage() {
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

  const { data: messages } = useQuery({
    queryKey: ["messages", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id);
      return (data || []) as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  const { data: events } = useQuery({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("sort_order");
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Loading...</div></div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="p-6 text-gray-500">Wedding not found</div></AdminLayout>;

  const totalGuests = guests?.length || 0;
  const acceptedRsvps = rsvps?.filter((r) => r.status === "accepted").length || 0;
  const declinedRsvps = rsvps?.filter((r) => r.status === "declined").length || 0;
  const pendingRsvps = rsvps?.filter((r) => r.status === "pending").length || 0;
  const approvedMessages = messages?.filter((m) => m.is_approved).length || 0;
  const pendingMessages = (messages?.length || 0) - approvedMessages;
  const totalEvents = events?.length || 0;

  const stats = [
    { label: "Total Guests", value: totalGuests, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Events", value: totalEvents, icon: Calendar, color: "text-green-600", bg: "bg-green-50" },
    { label: "RSVPs Accepted", value: acceptedRsvps, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending RSVPs", value: pendingRsvps, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Guestbook Messages", value: messages?.length || 0, icon: MessageCircle, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Page Views", value: 0, icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={18} className="text-indigo-600" />
              <span className="font-ui text-xs font-medium text-indigo-600 uppercase tracking-wider">Dashboard</span>
            </div>
            <h1 className="font-ui text-2xl font-bold text-gray-900 mb-1">
              {wedding.couple_name_one} & {wedding.couple_name_two}
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              {wedding.wedding_date && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 font-ui">
                  <Calendar size={14} />
                  {formatDate(wedding.wedding_date)}
                </div>
              )}
              {wedding.location && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 font-ui">
                  <MapPin size={14} />
                  {wedding.location}
                </div>
              )}
              <Badge variant={wedding.is_published ? "success" : "warning"}>
                {wedding.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                      <Icon size={20} className={stat.color} />
                    </div>
                  </div>
                  <div className="font-ui text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="font-ui text-sm text-gray-500">{stat.label}</div>
                </Card>
              );
            })}
          </div>

          {/* Two-column section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RSVP summary */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-indigo-600" />
                <h3 className="font-ui text-sm font-semibold text-gray-900">RSVP Summary</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Accepted", count: acceptedRsvps, color: "bg-emerald-500" },
                  { label: "Declined", count: declinedRsvps, color: "bg-red-400" },
                  { label: "Pending", count: pendingRsvps, color: "bg-amber-400" },
                ].map((item) => {
                  const total = rsvps?.length || 0;
                  const pct = total > 0 ? (item.count / total) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-ui text-xs text-gray-500">{item.label}</span>
                        <span className="font-ui text-xs font-semibold text-gray-900">{item.count}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {(!rsvps || rsvps.length === 0) && (
                  <p className="font-ui text-sm text-gray-400 text-center py-4">No RSVPs yet</p>
                )}
              </div>
            </Card>

            {/* Recent messages */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle size={18} className="text-indigo-600" />
                <h3 className="font-ui text-sm font-semibold text-gray-900">Recent Guestbook Messages</h3>
                {pendingMessages > 0 && <Badge variant="warning">{pendingMessages} pending</Badge>}
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages && messages.length > 0 ? (
                  messages.slice(0, 5).map((msg) => (
                    <div key={msg.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-ui text-xs font-semibold text-gray-900">{msg.author_name}</span>
                        <Badge variant={msg.is_approved ? "success" : "warning"}>
                          {msg.is_approved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <p className="font-ui text-xs text-gray-500 line-clamp-2">{msg.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="font-ui text-sm text-gray-400 text-center py-4">No messages yet</p>
                )}
              </div>
            </Card>
          </div>

          {/* Upcoming events */}
          <Card className="p-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-indigo-600" />
              <h3 className="font-ui text-sm font-semibold text-gray-900">Events</h3>
            </div>
            <div className="space-y-3">
              {events && events.length > 0 ? (
                events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <div className="font-ui text-sm font-medium text-gray-900">{event.name}</div>
                      <div className="font-ui text-xs text-gray-500">
                        {event.starts_at ? formatDate(event.starts_at) : "Date TBD"}
                        {event.venue_name ? ` • ${event.venue_name}` : ""}
                      </div>
                    </div>
                    <Badge variant="default">{event.kind}</Badge>
                  </div>
                ))
              ) : (
                <p className="font-ui text-sm text-gray-400 text-center py-4">No events created yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
