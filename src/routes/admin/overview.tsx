import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users, UsersRound, Calendar, MessageSquare, Check, X, Clock,
  Plus, CalendarPlus, Image, Palette, FileText, ArrowRight, TrendingUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Guest, GuestGroup, WeddingEvent, Rsvp } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Card, Badge, EmptyState, SectionTitle } from "@/components/ui";
import { formatDateShort, formatTime, daysUntil, cn } from "@/lib/utils";

type SummaryCard = {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
};

type QuickAction = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  description: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Add Guest", icon: Plus, to: "/admin/guests", description: "Invite someone new" },
  { label: "Create Event", icon: CalendarPlus, to: "/admin/events", description: "Add a ceremony or reception" },
  { label: "Edit Cover Page", icon: Image, to: "/admin/cover", description: "Customize the hero" },
  { label: "Change Theme", icon: Palette, to: "/admin/theme", description: "Colors & fonts" },
  { label: "Edit Website", icon: FileText, to: "/admin/content", description: "Sections & content" },
];

export function AdminOverview() {
  const { wedding, loading } = useHostWedding();
  const navigate = useNavigate();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [fetching, setFetching] = useState(true);

  const weddingId = wedding?.id ?? "";

  const loadAll = useCallback(async () => {
    if (!weddingId) { setFetching(false); return; }
    setFetching(true);
    const [g, gr, ev, r] = await Promise.all([
      supabase.from("guests").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
      supabase.from("guest_groups").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
      supabase.from("events").select("*").eq("wedding_id", weddingId).order("starts_at", { ascending: true }),
      supabase.from("rsvps").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
    ]);
    if (g.data) setGuests(g.data as Guest[]);
    if (gr.data) setGroups(gr.data as GuestGroup[]);
    if (ev.data) setEvents(ev.data as WeddingEvent[]);
    if (r.data) setRsvps(r.data as Rsvp[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => { if (weddingId) loadAll(); }, [weddingId, loadAll]);

  // ─── Derived stats ───
  const stats = useMemo(() => {
    const accepted = rsvps.filter((r) => r.status === "accepted").length;
    const declined = rsvps.filter((r) => r.status === "declined").length;
    const tentative = rsvps.filter((r) => r.status === "tentative").length;
    const pending = guests.length - accepted - declined - tentative;
    return {
      totalGuests: guests.length,
      totalGroups: groups.length,
      totalEvents: events.length,
      pending,
      accepted,
      declined,
      tentative,
    };
  }, [guests, groups, events, rsvps]);

  const rsvpRate = useMemo(() => {
    if (guests.length === 0) return 0;
    return Math.round(((stats.accepted + stats.declined + stats.tentative) / guests.length) * 100);
  }, [guests.length, stats]);

  const recentRsvps = useMemo(() => rsvps.slice(0, 5), [rsvps]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => e.starts_at && new Date(e.starts_at) >= now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
      .slice(0, 3);
  }, [events]);

  const countdown = useMemo(() => daysUntil(wedding?.wedding_date ?? null), [wedding?.wedding_date]);

  const summaryCards: SummaryCard[] = [
    { label: "Total Guests", value: stats.totalGuests, icon: Users, accent: "text-onyx" },
    { label: "Guest Groups", value: stats.totalGroups, icon: UsersRound, accent: "text-sepia" },
    { label: "Events", value: stats.totalEvents, icon: Calendar, accent: "text-sepia" },
    { label: "Pending RSVPs", value: stats.pending, icon: MessageSquare, accent: "text-yellow-600" },
    { label: "Accepted RSVPs", value: stats.accepted, icon: Check, accent: "text-green-600" },
    { label: "Declined RSVPs", value: stats.declined, icon: X, accent: "text-red-600" },
  ];

  // ─── Render ───
  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading dashboard…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to view your dashboard." />;
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Dashboard"
        subtitle={
          countdown !== null && countdown > 0
            ? `${countdown} days until the big day`
            : wedding.wedding_date
              ? formatDateShort(wedding.wedding_date)
              : "Set your wedding date in settings"
        }
      />

      {/* ─── Summary cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <card.icon className={cn("w-5 h-5", card.accent)} />
            </div>
            <div className="text-2xl font-serif text-onyx">{card.value}</div>
            <div className="text-xs text-sepia/70 uppercase tracking-widest mt-0.5">{card.label}</div>
          </Card>
        ))}
      </div>

      {/* ─── RSVP progress ─── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sepia" />
            <h3 className="font-serif text-lg text-onyx">RSVP Progress</h3>
          </div>
          <span className="text-sm text-sepia">{rsvpRate}% responded</span>
        </div>
        <div className="h-3 rounded-full bg-mist overflow-hidden">
          <div
            className="h-full bg-onyx transition-all duration-500"
            style={{ width: `${rsvpRate}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-sepia/70">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />{stats.accepted} accepted</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />{stats.tentative} tentative</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />{stats.declined} declined</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sand" />{stats.pending} pending</span>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ─── Recent activity ─── */}
        <Card className="p-6">
          <h3 className="font-serif text-lg text-onyx mb-4">Recent Activity</h3>
          {recentRsvps.length === 0 ? (
            <p className="text-sm text-sepia/60 py-6 text-center">No RSVPs yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentRsvps.map((rsvp) => {
                const statusColor =
                  rsvp.status === "accepted" ? "success" :
                  rsvp.status === "declined" ? "danger" :
                  rsvp.status === "tentative" ? "warning" : "default";
                return (
                  <li key={rsvp.id} className="flex items-center justify-between gap-3 py-2 border-b border-sand last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-onyx truncate">{rsvp.guest_name}</p>
                      <p className="text-xs text-sepia/60">
                        {formatDateShort(rsvp.created_at)} · {rsvp.event_id ? "Event RSVP" : "General"}
                      </p>
                    </div>
                    <Badge variant={statusColor as "success" | "danger" | "warning" | "default"} className="capitalize">
                      {rsvp.status}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* ─── Upcoming events ─── */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg text-onyx">Upcoming Events</h3>
            <Link to="/admin/events" className="text-xs text-sepia hover:text-onyx flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-sepia/60 py-6 text-center">No upcoming events scheduled.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="flex items-start gap-3 py-2 border-b border-sand last:border-0">
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="text-xs text-sepia/60 uppercase">
                      {new Date(event.starts_at).toLocaleDateString("en-US", { month: "short" })}
                    </div>
                    <div className="text-lg font-serif text-onyx">
                      {new Date(event.starts_at).getDate()}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-onyx truncate">{event.name}</p>
                    <p className="text-xs text-sepia/60 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {formatTime(event.starts_at)}
                      {event.venue_name && <span>· {event.venue_name}</span>}
                    </p>
                  </div>
                  <Badge>{event.kind}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ─── Quick actions ─── */}
      <div>
        <h3 className="font-serif text-lg text-onyx mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="group text-left p-4 rounded-xl border border-sand bg-card hover:border-sepia/40 hover:shadow-md transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-mist flex items-center justify-center mb-3 group-hover:bg-sand/50 transition-colors">
                <action.icon className="w-4 h-4 text-sepia" />
              </div>
              <p className="text-sm font-medium text-onyx">{action.label}</p>
              <p className="text-xs text-sepia/60 mt-0.5">{action.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminOverview;
