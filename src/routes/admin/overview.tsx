import { useQuery } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingEvent, type Guest, type Rsvp, type GuestbookEntry } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import { CalendarDays, Users, MessageSquare, MailCheck, Heart, Eye } from "lucide-react";

function StatCard({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon: typeof CalendarDays; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-ui text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="font-ui text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {hint && <p className="font-ui text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
        <div className="p-2.5 bg-indigo-50 rounded-lg">
          <Icon size={20} className="text-indigo-600" />
        </div>
      </div>
    </Card>
  );
}

export function OverviewPage() {
  const { data: wedding, isLoading: wLoading, error: wError } = useQuery<Wedding>({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: events } = useQuery<WeddingEvent[]>({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("sort_order", { ascending: true });
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const { data: guests } = useQuery<Guest[]>({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id);
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  const { data: rsvps } = useQuery<Rsvp[]>({
    queryKey: ["rsvps", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("rsvps").select("*").eq("wedding_id", wedding.id);
      return (data || []) as Rsvp[];
    },
    enabled: !!wedding,
  });

  const { data: messages } = useQuery<GuestbookEntry[]>({
    queryKey: ["messages", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guestbook").select("*").eq("wedding_id", wedding.id);
      return (data || []) as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  if (wLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-gray-500">Loading dashboard...</p>
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

  const acceptedRsvps = (rsvps || []).filter((r) => r.status === "accepted").length;
  const pendingMessages = (messages || []).filter((m) => !m.is_approved).length;

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="font-ui text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="font-ui text-sm text-gray-500 mt-1">
            {wedding.couple_name_one} & {wedding.couple_name_two}
            {wedding.wedding_date && ` · ${formatDate(wedding.wedding_date)}`}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard label="Wedding Date" value={wedding.wedding_date ? formatDate(wedding.wedding_date) : "Not set"} icon={CalendarDays} hint={wedding.location || "No location set"} />
          <StatCard label="Total Events" value={(events || []).length} icon={Eye} hint="Ceremonies & receptions" />
          <StatCard label="Total Guests" value={(guests || []).length} icon={Users} hint="Invited people" />
          <StatCard label="RSVPs Accepted" value={acceptedRsvps} icon={MailCheck} hint={`of ${(rsvps || []).length} responses`} />
          <StatCard label="Guestbook Messages" value={(messages || []).length} icon={MessageSquare} hint={`${pendingMessages} pending approval`} />
          <StatCard label="Published" value={wedding.is_published ? "Yes" : "No"} icon={Heart} hint={wedding.is_published ? "Website is live" : "Not yet published"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-ui text-sm font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            {(events || []).length === 0 ? (
              <p className="font-ui text-sm text-gray-400">No events created yet.</p>
            ) : (
              <div className="space-y-3">
                {(events || []).slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-ui text-sm font-medium text-gray-900">{event.name}</p>
                      <p className="font-ui text-xs text-gray-500">{formatDate(event.starts_at)} · {event.venue_name || "No venue"}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full font-ui text-xs font-medium capitalize">{event.kind}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-ui text-sm font-semibold text-gray-900 mb-4">Recent Messages</h3>
            {(messages || []).length === 0 ? (
              <p className="font-ui text-sm text-gray-400">No messages yet.</p>
            ) : (
              <div className="space-y-3">
                {(messages || []).slice(0, 5).map((msg) => (
                  <div key={msg.id} className="py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-ui text-sm font-medium text-gray-900">{msg.author_name}</p>
                      {!msg.is_approved && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-ui text-xs">Pending</span>}
                    </div>
                    <p className="font-ui text-xs text-gray-500 line-clamp-2">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
