import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { WeddingEvent, Rsvp } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { formatDate, daysUntil } from "@/lib/utils";
import { Card, Badge, SectionTitle, EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { Calendar, Users, MessageSquare, UsersRound, MapPin } from "lucide-react";

type RsvpBadgeVariant = "success" | "danger" | "warning" | "info";

function rsvpBadge(status: Rsvp["status"]): { label: string; variant: RsvpBadgeVariant } {
  switch (status) {
    case "accepted": return { label: "Accepted", variant: "success" };
    case "declined": return { label: "Declined", variant: "danger" };
    case "tentative": return { label: "Tentative", variant: "warning" };
    default: return { label: "Pending", variant: "info" };
  }
}

export function AdminOverview() {
  const { wedding, loading } = useHostWedding();

  const [guestCount, setGuestCount] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [rsvpCount, setRsvpCount] = useState<number | null>(null);
  const [groupCount, setGroupCount] = useState<number | null>(null);
  const [recentRsvps, setRecentRsvps] = useState<Rsvp[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<WeddingEvent[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!wedding) return;
    const id = wedding.id;
    let active = true;
    setDataLoading(true);

    (async () => {
      const [guests, events, rsvps, groups] = await Promise.all([
        supabase.from("guests").select("*", { count: "exact", head: true }).eq("wedding_id", id),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("wedding_id", id),
        supabase.from("rsvps").select("*", { count: "exact", head: true }).eq("wedding_id", id),
        supabase.from("guest_groups").select("*", { count: "exact", head: true }).eq("wedding_id", id),
      ]);

      if (!active) return;
      setGuestCount(guests.count ?? 0);
      setEventCount(events.count ?? 0);
      setRsvpCount(rsvps.count ?? 0);
      setGroupCount(groups.count ?? 0);

      const [recent, upcoming] = await Promise.all([
        supabase
          .from("rsvps")
          .select("*")
          .eq("wedding_id", id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("events")
          .select("*")
          .eq("wedding_id", id)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true })
          .limit(3),
      ]);

      if (!active) return;
      setRecentRsvps((recent.data as Rsvp[]) ?? []);
      setUpcomingEvents((upcoming.data as WeddingEvent[]) ?? []);
      setDataLoading(false);
    })();

    return () => { active = false; };
  }, [wedding]);

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-sepia">Loading…</div>;
  }

  if (!wedding) {
    return (
      <EmptyState
        title="No wedding found"
        description="Create a wedding to see your dashboard overview."
      />
    );
  }

  const countdown = daysUntil(wedding.wedding_date);
  const weddingName = `${wedding.couple_name_one} & ${wedding.couple_name_two}`;

  const stats = [
    { label: "Total Guests", value: guestCount, icon: Users, href: "/admin/guests" },
    { label: "Total Events", value: eventCount, icon: Calendar, href: "/admin/events" },
    { label: "RSVPs Received", value: rsvpCount, icon: MessageSquare, href: "/admin/rsvps" },
    { label: "Groups", value: groupCount, icon: UsersRound, href: "/admin/groups" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Wedding header */}
      <Card className="bg-gradient-to-br from-parchment to-cream border-sand">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="font-serif text-3xl text-onyx">{weddingName}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-sepia">
              {wedding.wedding_date && (
                <span className="inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(wedding.wedding_date)}
                </span>
              )}
              {wedding.location && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {wedding.location}
                </span>
              )}
            </div>
          </div>

          {/* Countdown */}
          {countdown !== null && (
            <div className="flex flex-col items-center md:items-end">
              {countdown > 0 ? (
                <>
                  <span className="text-xs uppercase tracking-widest text-sepia/60">Countdown</span>
                  <span className="font-serif text-5xl text-onyx leading-none mt-1">
                    {countdown}
                  </span>
                  <span className="text-xs text-sepia/70 mt-1">
                    {countdown === 1 ? "day to go" : "days to go"}
                  </span>
                </>
              ) : countdown === 0 ? (
                <span className="font-serif text-2xl text-onyx">Today's the day!</span>
              ) : (
                <span className="font-serif text-2xl text-sepia">The big day has passed</span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-sepia/70">{s.label}</span>
              <s.icon className="w-4 h-4 text-sepia/50" />
            </div>
            <span className="font-serif text-3xl text-onyx">
              {dataLoading ? "—" : (s.value ?? 0)}
            </span>
          </Card>
        ))}
      </div>

      {/* Recent RSVPs + Upcoming events */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent RSVPs */}
        <div>
          <SectionTitle
            title="Recent RSVPs"
            subtitle="The latest responses from your guests"
            action={
              <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/admin/rsvps")}>
                View all
              </Button>
            }
          />
          <Card className="p-0">
            {dataLoading ? (
              <div className="p-6 text-sm text-sepia/70">Loading…</div>
            ) : recentRsvps.length === 0 ? (
              <EmptyState
                title="No RSVPs yet"
                description="RSVPs from your guests will appear here."
              />
            ) : (
              <ul className="divide-y divide-sand">
                {recentRsvps.map((rsvp) => {
                  const badge = rsvpBadge(rsvp.status);
                  return (
                    <li key={rsvp.id} className="flex items-center justify-between px-6 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-onyx truncate">
                          {rsvp.guest_name}
                        </p>
                        <p className="text-xs text-sepia/60 mt-0.5">
                          {formatDate(rsvp.created_at)}
                        </p>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Upcoming events */}
        <div>
          <SectionTitle
            title="Upcoming Events"
            subtitle="The next events on your wedding timeline"
            action={
              <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/admin/events")}>
                View all
              </Button>
            }
          />
          <Card className="p-0">
            {dataLoading ? (
              <div className="p-6 text-sm text-sepia/70">Loading…</div>
            ) : upcomingEvents.length === 0 ? (
              <EmptyState
                title="No upcoming events"
                description="Future events will appear here once scheduled."
              />
            ) : (
              <ul className="divide-y divide-sand">
                {upcomingEvents.map((event) => (
                  <li key={event.id} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-onyx truncate">{event.name}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-sepia/70">
                          {event.starts_at && (
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(event.starts_at)}
                            </span>
                          )}
                          {event.venue_name && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {event.venue_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="default" className="capitalize">
                        {event.kind}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminOverview;
