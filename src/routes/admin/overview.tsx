import { useQuery } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingEvent, type GuestbookEntry, type SharingEvent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { formatDate, formatTime } from "../../lib/utils";
import { Users, Calendar, MessageSquare, Eye, Globe, CheckCircle, Clock } from "lucide-react";

export function OverviewPage() {
  const { data: wedding, isLoading: wLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      return data as Wedding | null;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["overview-stats", wedding?.id],
    queryFn: async () => {
      if (!wedding) return { guests: 0, events: 0, rsvps: 0, messages: 0, visits: 0 };
      const [guests, events, rsvps, messages, visits] = await Promise.all([
        supabase.from("guests").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id),
        supabase.from("rsvps").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id),
        supabase.from("guestbook_entries").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id),
        supabase.from("sharing_events").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id),
      ]);
      return { guests: guests.count || 0, events: events.count || 0, rsvps: rsvps.count || 0, messages: messages.count || 0, visits: visits.count || 0 };
    },
    enabled: !!wedding,
  });

  const { data: recentMessages } = useQuery({
    queryKey: ["recent-messages", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false }).limit(5);
      return (data || []) as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ["upcoming-events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("starts_at", { ascending: true }).limit(5);
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  if (wLoading) return <AdminLayout><div className="flex items-center justify-center py-12 text-gray-500">Loading...</div></AdminLayout>;

  const statCards = [
    { label: "Total Guests", value: stats?.guests ?? 0, icon: Users, color: "text-gray-900" },
    { label: "Events", value: stats?.events ?? 0, icon: Calendar, color: "text-gray-900" },
    { label: "RSVPs", value: stats?.rsvps ?? 0, icon: CheckCircle, color: "text-gray-900" },
    { label: "Messages", value: stats?.messages ?? 0, icon: MessageSquare, color: "text-gray-900" },
    { label: "Published", value: wedding?.is_published ? "Yes" : "No", icon: Globe, color: "text-gray-900" },
    { label: "Visits", value: stats?.visits ?? 0, icon: Eye, color: "text-gray-900" },
  ];

  return (
    <AdminLayout>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Dashboard Overview</h2>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-base font-semibold text-gray-900">Recent Messages</h3>
          {recentMessages && recentMessages.length > 0 ? (
            <div className="space-y-3">
              {recentMessages.map((m) => (
                <div key={m.id} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{m.author_name}</span>
                    <Badge variant={m.status === "approved" ? "success" : m.status === "rejected" ? "error" : "warning"}>{m.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{m.message}</p>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="No messages yet" />}
        </Card>

        <Card>
          <h3 className="mb-4 text-base font-semibold text-gray-900">Upcoming Events</h3>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((e) => (
                <div key={e.id} className="flex items-start gap-3 border-b border-gray-200 pb-3 last:border-0">
                  <div className="rounded-lg bg-gray-100 p-2"><Calendar className="h-4 w-4 text-gray-700" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{e.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(e.starts_at)} {e.starts_at && `at ${formatTime(e.starts_at)}`}</p>
                    {e.venue_name && <p className="text-xs text-gray-400">{e.venue_name}</p>}
                  </div>
                  <Badge variant="info">{e.kind}</Badge>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={<Clock className="h-8 w-8" />} title="No events yet" />}
        </Card>
      </div>
    </AdminLayout>
  );
}
