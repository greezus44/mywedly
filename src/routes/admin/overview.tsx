import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, UsersRound, Calendar, Mail, Check, X, Clock,
  Plus, Pencil, Palette, FileText, Eye, TrendingUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Guest, GuestGroup, WeddingEvent, Rsvp } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { formatDate, formatDateShort, formatTime, daysUntil, cn } from "@/lib/utils";
import { Card, Badge, EmptyState, SectionTitle } from "@/components/ui";

type QuickAction = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Add Guest", to: "/admin/guests", icon: Plus, description: "Invite someone new" },
  { label: "Create Event", to: "/admin/events", icon: Calendar, description: "Add a wedding event" },
  { label: "Edit Cover", to: "/admin/cover", icon: Eye, description: "Customize the cover page" },
  { label: "Change Theme", to: "/admin/theme", icon: Palette, description: "Colors, fonts & style" },
  { label: "Edit Website", to: "/admin/content", icon: FileText, description: "Manage content sections" },
];

export function AdminOverview() {
  const { wedding, loading } = useHostWedding();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [fetching, setFetching] = useState(true);

  const weddingId = wedding?.id ?? null;

  const fetchAll = useCallback(async () => {
    if (!weddingId) return;
    setFetching(true);
    const [g, gr, ev, rs] = await Promise.all([
      supabase.from("guests").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
      supabase.from("guest_groups").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
      supabase.from("events").select("*").eq("wedding_id", weddingId).order("starts_at", { ascending: true }),
      supabase.from("rsvps").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
    ]);
    if (g.data) setGuests(g.data as Guest[]);
    if (gr.data) setGroups(gr.data as GuestGroup[]);
    if (ev.data) setEvents(ev.data as WeddingEvent[]);
    if (rs.data) setRsvps(rs.data as Rsvp[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => {
    if (weddingId) fetchAll();
  }, [weddingId, fetchAll]);

  if (loading || fetching) {
    return <div className="flex items-center justify-center py-24 text-sepia">Loading dashboard…</div>;
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to get started." />;
  }

  // ─── Derived stats ───
  const totalGuests = guests.length;
  const totalGroups = groups.length;
  const totalEvents = events.length;

  const rsvpPending = guests.filter((g) => !g.rsvp_status || g.rsvp_status === "pending").length;
  const rsvpAccepted = guests.filter((g) => g.rsvp_status === "accepted" || g.rsvp_status === "attending").length;
  const rsvpDeclined = guests.filter((g) => g.rsvp_status === "declined").length;
  const rsvpTentative = guests.filter((g) => g.rsvp_status === "tentative").length;
  const rsvpResponded = rsvpAccepted + rsvpDeclined + rsvpTentative;
  const rsvpResponseRate = totalGuests > 0 ? Math.round((rsvpResponded / totalGuests) * 100) : 0;

  // Recent activity — last 5 RSVPs
  const recentRsvps = rsvps.slice(0, 5);

  // Upcoming events — next 3 (events with starts_at in the future or all, sorted)
  const now = new Date();
  const upcomingEvents = events
    .filter((e) => e.starts_at && new Date(e.starts_at) >= now)
    .slice(0, 3);
  const displayEvents = upcomingEvents.length > 0 ? upcomingEvents : events.slice(0, 3);

  const countdown = daysUntil(wedding.wedding_date);

  // ─── Summary cards data ───
  const summaryCards = [
    { label: "Total Guests", value: totalGuests, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Guest Groups", value: totalGroups, icon: UsersRound, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Events", value: totalEvents, icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Pending RSVPs", value: rsvpPending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Accepted", value: rsvpAccepted, icon: Check, color: "text-green-600", bg: "bg-green-50" },
    { label: "Declined", value: rsvpDeclined, icon: X, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div>
      <SectionTitle
        title="Dashboard"
        subtitle={
          countdown !== null
            ? countdown > 0
              ? `${countdown} days until the big day!`
              : countdown === 0
                ? "The wedding is today!"
                : "The wedding day has passed."
            : "Welcome to your wedding admin."
        }
      />

      {/* ─── Countdown banner ─── */}
      {wedding.wedding_date && (
        <Card className="p-6 mb-6 bg-gradient-to-br from-mist to-parchment border-sand">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-sepia/60 mb-1">
                {wedding.couple_name_one} & {wedding.couple_name_two}
              </p>
              <h2 className="text-2xl font-serif text-onyx">{formatDate(wedding.wedding_date)}</h2>
              {wedding.location && (
                <p className="text-sm text-sepia/70 mt-1">{wedding.location}</p>
              )}
            </div>
            {countdown !== null && countdown > 0 && (
              <div className="text-center shrink-0">
                <div className="text-4xl font-serif text-onyx">{countdown}</div>
                <div className="text-xs uppercase tracking-widest text-sepia/60">Days to go</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ─── Summary cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((card) => (
          <Card key={card.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-sepia/60 mb-1">
                  {card.label}
                </p>
                <p className="text-3xl font-serif text-onyx">{card.value}</p>
              </div>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", card.bg)}>
                <card.icon className={cn("w-6 h-6", card.color)} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ─── RSVP Progress ─── */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sepia" />
            <h3 className="text-sm font-medium text-onyx">RSVP Response Rate</h3>
          </div>
          <span className="text-sm text-sepia/70">
            {rsvpResponded} of {totalGuests} responded
          </span>
        </div>
        <div className="w-full h-3 bg-sand/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
            style={{ width: `${rsvpResponseRate}%` }}
          />
        </div>
        <div className="flex items-center gap-5 mt-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-sepia/70">Accepted: {rsvpAccepted}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="text-sepia/70">Tentative: {rsvpTentative}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-sepia/70">Declined: {rsvpDeclined}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sand" />
            <span className="text-sepia/70">Pending: {rsvpPending}</span>
          </span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* ─── Recent Activity ─── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-sepia" />
            <h3 className="text-sm font-medium text-onyx">Recent RSVP Activity</h3>
          </div>
          {recentRsvps.length === 0 ? (
            <p className="text-sm text-sepia/50 py-8 text-center">No RSVPs yet.</p>
          ) : (
            <div className="space-y-3">
              {recentRsvps.map((rsvp) => (
                <div key={rsvp.id} className="flex items-center justify-between py-2 border-b border-sand/50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-onyx truncate">{rsvp.guest_name}</p>
                    <p className="text-xs text-sepia/50">
                      {formatDateShort(rsvp.created_at)} · {formatTime(rsvp.created_at)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      rsvp.status === "accepted" || rsvp.status === "attending"
                        ? "success"
                        : rsvp.status === "declined"
                          ? "danger"
                          : rsvp.status === "tentative"
                            ? "warning"
                            : "default"
                    }
                  >
                    {rsvp.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ─── Upcoming Events ─── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-sepia" />
            <h3 className="text-sm font-medium text-onyx">Upcoming Events</h3>
          </div>
          {displayEvents.length === 0 ? (
            <p className="text-sm text-sepia/50 py-8 text-center">No events scheduled.</p>
          ) : (
            <div className="space-y-3">
              {displayEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 py-2 border-b border-sand/50 last:border-0">
                  <div className="w-10 h-10 rounded-lg bg-mist flex flex-col items-center justify-center shrink-0">
                    {event.starts_at && (
                      <>
                        <span className="text-[10px] uppercase text-sepia/60 leading-none">
                          {new Date(event.starts_at).toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="text-sm font-serif text-onyx leading-none mt-0.5">
                          {new Date(event.starts_at).getDate()}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-onyx truncate">{event.name}</p>
                    <div className="flex items-center gap-2 text-xs text-sepia/60 mt-0.5">
                      {event.starts_at && <span>{formatTime(event.starts_at)}</span>}
                      {event.venue_name && (
                        <>
                          <span>·</span>
                          <span className="truncate">{event.venue_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="info">{event.kind}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ─── Quick Actions ─── */}
      <Card className="p-6">
        <h3 className="text-sm font-medium text-onyx mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-sand hover:border-sepia/30 hover:bg-mist/50 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-mist group-hover:bg-sand/50 flex items-center justify-center transition-colors">
                <action.icon className="w-5 h-5 text-sepia" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-onyx">{action.label}</p>
                <p className="text-xs text-sepia/50 mt-0.5">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
