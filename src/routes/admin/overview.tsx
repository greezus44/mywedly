import { useQuery } from "@tanstack/react-query";
import { supabase, type Wedding, type GuestbookEntry, type WeddingEvent, type Rsvp, type Guest, type SharingEvent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { formatDate, formatTime } from "../../lib/utils";
import { Users, Calendar, Heart, MessageSquare, Globe, Eye, CheckCircle2, Clock } from "lucide-react";

export function OverviewPage() {
  const { data: wedding, isLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      return data as Wedding | null;
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["guests"],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id);
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("starts_at", { ascending: true });
      return (data || []) as WeddingEvent[];
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
    queryKey: ["messages"],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false }).limit(5);
      return (data || []) as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  const { data: visits } = useQuery({
    queryKey: ["sharing-events"],
    queryFn: async () => {
      if (!wedding) return [];
      const { count } = await supabase.from("sharing_events").select("*", { count: "exact", head: true }).eq("wedding_id", wedding.id).eq("event_type", "visit");
      return count || 0;
    },
    enabled: !!wedding,
  });

  const upcomingEvents = (events || [])
    .filter((e) => e.starts_at && new Date(e.starts_at) > new Date())
    .slice(0, 5);

  const stats = [
    { label: "Total Guests", value: guests?.length || 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Events", value: events?.length || 0, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "RSVPs", value: rsvps?.length || 0, icon: Heart, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "Messages", value: messages?.length || 0, icon: MessageSquare, color: "text-green-600", bg: "bg-green-50" },
    {
      label: "Published",
      value: wedding?.is_published ? "Yes" : "No",
      icon: wedding?.is_published ? CheckCircle2 : Globe,
      color: wedding?.is_published ? "text-green-600" : "text-gray-500",
      bg: wedding?.is_published ? "bg-green-50" : "bg-gray-100",
    },
    { label: "Visits", value: visits || 0, icon: Eye, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!wedding) {
    return (
      <AdminLayout>
        <Card>
          <EmptyState icon={<Heart className="h-12 w-12" />} title="No wedding found" description="Create a wedding to get started." />
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with {wedding.couple_name_one} & {wedding.couple_name_two}'s wedding.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-semibold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent Messages */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Messages</h3>
            <Badge variant="info">{messages?.length || 0}</Badge>
          </div>
          {messages && messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{msg.author_name}</span>
                    <Badge variant={msg.status === "approved" ? "success" : msg.status === "pending" ? "warning" : "error"}>
                      {msg.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="No messages yet" description="Guest messages will appear here." />
          )}
        </Card>

        {/* Upcoming Events */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
            <Badge variant="info">{upcomingEvents.length}</Badge>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{event.name}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      {event.starts_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
                        </span>
                      )}
                      {event.venue_name && <span>{event.venue_name}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Calendar className="h-8 w-8" />} title="No upcoming events" description="Add events to see them here." />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
