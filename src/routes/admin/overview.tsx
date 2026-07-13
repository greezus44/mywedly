import { useState, useEffect } from "react";
import { supabase, type Wedding, type WeddingEvent, type Guest, type Rsvp, type GuestbookEntry, type SharingEvent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { formatDate, formatTime } from "../../lib/utils";
import { Users, Calendar, Heart, MessageSquare, Globe, Eye, TrendingUp, Clock } from "lucide-react";

export function OverviewPage() {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [messages, setMessages] = useState<GuestbookEntry[]>([]);
  const [visits, setVisits] = useState<SharingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Not authenticated"); setLoading(false); return; }
        const { data: wed, error: wErr } = await supabase.from("weddings").select("*").eq("created_by", user.id).maybeSingle();
        if (wErr) throw wErr;
        if (!wed) { setLoading(false); return; }
        setWedding(wed as Wedding);
        const [evRes, guRes, rsRes, msRes, shRes] = await Promise.all([
          supabase.from("events").select("*").eq("wedding_id", wed.id).order("starts_at", { ascending: true }),
          supabase.from("guests").select("*").eq("wedding_id", wed.id),
          supabase.from("rsvps").select("*").eq("wedding_id", wed.id),
          supabase.from("guestbook").select("*").eq("wedding_id", wed.id).order("created_at", { ascending: false }),
          supabase.from("sharing_events").select("*").eq("wedding_id", wed.id).order("created_at", { ascending: false }),
        ]);
        setEvents((evRes.data || []) as WeddingEvent[]);
        setGuests((guRes.data || []) as Guest[]);
        setRsvps((rsRes.data || []) as Rsvp[]);
        setMessages((msRes.data || []) as GuestbookEntry[]);
        setVisits((shRes.data || []) as SharingEvent[]);
      } catch (e) { setError(e instanceof Error ? e.message : "Failed to load data"); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <AdminLayout><div className="flex items-center justify-center py-20 text-gray-500">Loading dashboard…</div></AdminLayout>;
  if (error) return <AdminLayout><div className="py-20 text-center text-red-600">{error}</div></AdminLayout>;
  if (!wedding) return <AdminLayout><EmptyState icon={<Calendar className="h-10 w-10" />} title="No wedding found" description="Create a wedding to get started." /></AdminLayout>;

  const attending = rsvps.filter((r) => r.status === "attending").length;
  const declined = rsvps.filter((r) => r.status === "declined").length;
  const pendingMessages = messages.filter((m) => m.status === "pending").length;
  const recentMessages = messages.slice(0, 5);
  const upcomingEvents = events.filter((e) => !e.starts_at || new Date(e.starts_at) >= new Date()).slice(0, 5);

  const stats = [
    { label: "Total Guests", value: guests.length, icon: Users, color: "text-gray-900" },
    { label: "Events", value: events.length, icon: Calendar, color: "text-gray-900" },
    { label: "RSVPs", value: rsvps.length, icon: Heart, color: "text-gray-900", sub: `${attending} attending · ${declined} declined` },
    { label: "Guestbook Messages", value: messages.length, icon: MessageSquare, color: "text-gray-900", sub: pendingMessages > 0 ? `${pendingMessages} pending` : undefined },
    { label: "Published", value: wedding.is_published ? "Live" : "Draft", icon: Globe, color: wedding.is_published ? "text-green-600" : "text-gray-500" },
    { label: "Total Visits", value: visits.length, icon: Eye, color: "text-gray-900" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
          <p className="text-sm text-gray-500">Welcome to your wedding invitation dashboard.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{s.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
                  {s.sub && <p className="mt-1 text-xs text-gray-500">{s.sub}</p>}
                </div>
                <div className="rounded-lg bg-gray-100 p-3"><s.icon className="h-6 w-6 text-gray-700" /></div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">Recent Messages</h3>
            </div>
            {recentMessages.length === 0 ? (
              <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="No messages yet" />
            ) : (
              <ul className="space-y-3">
                {recentMessages.map((m) => (
                  <li key={m.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{m.author_name}</span>
                      <Badge variant={m.status === "approved" ? "success" : m.status === "rejected" ? "error" : "warning"}>{m.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{m.message}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatDate(m.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">Upcoming Events</h3>
            </div>
            {upcomingEvents.length === 0 ? (
              <EmptyState icon={<Calendar className="h-8 w-8" />} title="No upcoming events" />
            ) : (
              <ul className="space-y-3">
                {upcomingEvents.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0">
                    <div className="rounded-lg bg-gray-100 p-2"><Calendar className="h-4 w-4 text-gray-700" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{e.name}</p>
                      <p className="text-xs text-gray-500">{formatDate(e.starts_at)} {e.starts_at && `· ${formatTime(e.starts_at)}`}</p>
                      {e.venue_name && <p className="text-xs text-gray-400">{e.venue_name}</p>}
                    </div>
                    <Badge variant={e.visibility === "public" ? "info" : "default"}>{e.visibility}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
