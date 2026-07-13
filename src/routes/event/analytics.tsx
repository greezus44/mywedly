import { useMemo } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type EventRsvp, type EventMessage, type ScheduleItem } from "../../lib/supabase";
import { formatDate, getCountdown, getEventStatus } from "../../lib/utils";
import { Card, Badge, EmptyState, Skeleton } from "../../components/ui";
import { BarChart3, Users, CalendarCheck, MessageSquare, Clock, TrendingUp, Eye, Mail } from "lucide-react";

function AnalyticsPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: guests, isLoading: guestsLoading } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId);
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const { data: rsvps, isLoading: rsvpsLoading } = useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId);
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_messages").select("*").eq("event_id", eventId);
      if (error) throw error;
      return data as EventMessage[];
    },
  });

  const { data: scheduleItems, isLoading: scheduleLoading } = useQuery({
    queryKey: ["schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("schedule_items").select("*").eq("event_id", eventId);
      if (error) throw error;
      return data as ScheduleItem[];
    },
  });

  const stats = useMemo(() => {
    const totalGuests = guests?.length ?? 0;
    const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
    const declined = rsvps?.filter((r) => r.status === "declined").length ?? 0;
    const pending = (guests?.filter((g) => g.rsvp_status === "pending").length ?? 0);
    const totalRsvps = rsvps?.length ?? 0;
    const totalPlusOnes = rsvps?.filter((r) => r.status === "attending").reduce((sum, r) => sum + (r.plus_ones || 0), 0) ?? 0;
    const totalAttendees = attending + totalPlusOnes;
    const responseRate = totalGuests > 0 ? Math.round((totalRsvps / totalGuests) * 100) : 0;
    const attendingRate = totalRsvps > 0 ? Math.round((attending / totalRsvps) * 100) : 0;

    return {
      totalGuests,
      attending,
      declined,
      pending,
      totalRsvps,
      totalPlusOnes,
      totalAttendees,
      responseRate,
      attendingRate,
      totalMessages: messages?.length ?? 0,
      totalScheduleItems: scheduleItems?.length ?? 0,
    };
  }, [guests, rsvps, messages, scheduleItems]);

  const countdown = useMemo(() => {
    const dateStr = event.draft_event_date || event.event_date;
    return getCountdown(dateStr);
  }, [event]);

  const eventStatus = getEventStatus(event.draft_event_date || event.event_date);

  // RSVP bar chart data
  const rsvpBars = useMemo(() => {
    const max = Math.max(stats.attending, stats.declined, stats.pending, 1);
    return [
      { label: "Attending", value: stats.attending, color: "#16a34a", pct: (stats.attending / max) * 100 },
      { label: "Declined", value: stats.declined, color: "#dc2626", pct: (stats.declined / max) * 100 },
      { label: "Pending", value: stats.pending, color: "#d97706", pct: (stats.pending / max) * 100 },
    ];
  }, [stats]);

  const isLoading = guestsLoading || rsvpsLoading || messagesLoading || scheduleLoading;

  const statCards = [
    { label: "Total Guests", value: stats.totalGuests, icon: Users, color: "var(--color-text)" },
    { label: "Attending", value: stats.attending, icon: CalendarCheck, color: "#16a34a" },
    { label: "Total Attendees", value: stats.totalAttendees, icon: TrendingUp, color: "#0ea5e9", hint: `incl. ${stats.totalPlusOnes} plus ones` },
    { label: "Messages", value: stats.totalMessages, icon: MessageSquare, color: "#8b5cf6" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="font-heading text-2xl text-[var(--color-text)] flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> Analytics
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Track your event's performance</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {statCards.map((s) => (
              <Card key={s.label} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">{s.label}</p>
                </div>
                <p className="text-2xl font-heading" style={{ color: s.color }}>{s.value}</p>
                {s.hint && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{s.hint}</p>}
              </Card>
            ))}
          </div>

          {/* Event Status & Countdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Event Status</h3>
                <Badge variant={eventStatus === "upcoming" ? "info" : eventStatus === "ongoing" ? "success" : eventStatus === "completed" ? "default" : "warning"}>
                  {eventStatus}
                </Badge>
              </div>
              {event.draft_event_date || event.event_date ? (
                <p className="text-sm text-[var(--color-text)]">{formatDate(event.draft_event_date || event.event_date)}</p>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">No date set</p>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Countdown</h3>
              {countdown.isPast ? (
                <p className="text-sm text-[var(--color-text-muted)]">Event has passed</p>
              ) : (
                <div className="flex gap-4">
                  {[
                    { label: "Days", value: countdown.days },
                    { label: "Hours", value: countdown.hours },
                    { label: "Mins", value: countdown.minutes },
                    { label: "Secs", value: countdown.seconds },
                  ].map((u) => (
                    <div key={u.label}>
                      <span className="text-2xl font-heading text-[var(--color-text)]">{u.value}</span>
                      <span className="text-xs text-[var(--color-text-muted)] ml-1 uppercase tracking-wider">{u.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* RSVP Breakdown */}
          <Card className="p-5 mb-6">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-4">RSVP Breakdown</h3>

            {stats.totalGuests === 0 ? (
              <EmptyState icon={<Users className="w-10 h-10" />} title="No data yet" description="Add guests to see RSVP analytics" />
            ) : (
              <>
                {/* Bar Chart */}
                <div className="space-y-3 mb-6">
                  {rsvpBars.map((bar) => (
                    <div key={bar.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[var(--color-text)]">{bar.label}</span>
                        <span className="text-sm font-medium text-[var(--color-text)]">{bar.value}</span>
                      </div>
                      <div className="h-6 bg-[var(--color-bg-subtle)] overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${bar.pct}%`,
                            backgroundColor: bar.color,
                            borderRadius: "var(--radius)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rates */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Response Rate</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-[var(--color-bg-subtle)] overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
                        <div
                          className="h-full bg-[var(--color-primary)] transition-all duration-500"
                          style={{ width: `${stats.responseRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text)]">{stats.responseRate}%</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{stats.totalRsvps} of {stats.totalGuests} responded</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Attending Rate</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-[var(--color-bg-subtle)] overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
                        <div
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{ width: `${stats.attendingRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text)]">{stats.attendingRate}%</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{stats.attending} of {stats.totalRsvps} attending</p>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Summary */}
          <Card className="p-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Invited</p>
                  <p className="text-sm font-medium text-[var(--color-text)]">{stats.totalGuests}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Schedule Items</p>
                  <p className="text-sm font-medium text-[var(--color-text)]">{stats.totalScheduleItems}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Guest Messages</p>
                  <p className="text-sm font-medium text-[var(--color-text)]">{stats.totalMessages}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Pending RSVPs</p>
                  <p className="text-sm font-medium text-[var(--color-text)]">{stats.pending}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Total Attendees</p>
                  <p className="text-sm font-medium text-[var(--color-text)]">{stats.totalAttendees}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Published</p>
                  <p className="text-sm font-medium text-[var(--color-text)]">{event.is_published ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default AnalyticsPage;
