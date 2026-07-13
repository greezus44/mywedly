import { useParams, useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type EventRsvp } from "../../lib/supabase";
import { Card, Badge, Skeleton, ErrorState } from "../../components/ui";
import { getEventStatus, formatDate } from "../../lib/utils";
import {
  Users,
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Mail,
} from "lucide-react";

export default function AnalyticsPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const { data: guests, isLoading: guestsLoading, error: guestsError } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return (data || []) as EventGuest[];
    },
    enabled: !!eventId,
  });

  const { data: rsvps, isLoading: rsvpsLoading, error: rsvpsError } = useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return (data || []) as EventRsvp[];
    },
    enabled: !!eventId,
  });

  const isLoading = guestsLoading || rsvpsLoading;
  const error = guestsError || rsvpsError;

  const totalGuests = guests?.length || 0;
  const rsvpsReceived = rsvps?.length || 0;
  const attending = (rsvps || []).filter((r) => r.status === "attending").length;
  const declined = (rsvps || []).filter((r) => r.status === "declined").length;
  const pending = totalGuests - rsvpsReceived;

  const responseRate = totalGuests > 0 ? Math.round((rsvpsReceived / totalGuests) * 100) : 0;
  const attendingRate = rsvpsReceived > 0 ? Math.round((attending / rsvpsReceived) * 100) : 0;

  const eventStatus = getEventStatus(event.draft_event_date || event.event_date);
  const statusVariant = eventStatus === "upcoming" ? "info" : eventStatus === "ongoing" ? "success" : eventStatus === "completed" ? "default" : "warning";

  const stats = [
    {
      label: "Total Guests",
      value: totalGuests,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "RSVPs Received",
      value: rsvpsReceived,
      icon: Mail,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Attending",
      value: attending,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Declined",
      value: declined,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Pending",
      value: pending,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  // Bar chart data
  const maxBar = Math.max(totalGuests, attending, declined, pending, 1);
  const bars = [
    { label: "Invited", value: totalGuests, color: "var(--color-primary)" },
    { label: "Attending", value: attending, color: "#16a34a" },
    { label: "Declined", value: declined, color: "#dc2626" },
    { label: "Pending", value: pending, color: "#d97706" },
  ];

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-12 w-48 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorState message={error.message} onRetry={() => queryClient.invalidateQueries()} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Analytics</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Overview of your event's guest engagement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant as any}>{eventStatus}</Badge>
          {event.draft_event_date && (
            <span className="text-sm text-[var(--color-text-muted)]">
              {formatDate(event.draft_event_date)}
            </span>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex flex-col gap-3">
                <div className={`w-10 h-10 flex items-center justify-center ${stat.bg}`} style={{ borderRadius: "var(--radius)" }}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-heading text-[var(--color-text)]">{stat.value}</p>
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">{stat.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Response Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-[var(--color-text-muted)]" />
            <h3 className="text-sm font-medium text-[var(--color-text)]">Response Rate</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-heading text-[var(--color-text)]">{responseRate}%</span>
            <span className="text-sm text-[var(--color-text-muted)]">
              ({rsvpsReceived} of {totalGuests})
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--color-bg-subtle)]" style={{ borderRadius: "var(--radius)" }}>
            <div
              className="h-full bg-[var(--color-primary)] transition-all"
              style={{ width: `${responseRate}%`, borderRadius: "var(--radius)" }}
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-[var(--color-text-muted)]" />
            <h3 className="text-sm font-medium text-[var(--color-text)]">Attending Rate</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-heading text-[var(--color-text)]">{attendingRate}%</span>
            <span className="text-sm text-[var(--color-text-muted)]">
              ({attending} of {rsvpsReceived} responses)
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--color-bg-subtle)]" style={{ borderRadius: "var(--radius)" }}>
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${attendingRate}%`, borderRadius: "var(--radius)" }}
            />
          </div>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card className="p-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-6">
          RSVP Breakdown
        </h3>
        <div className="space-y-4">
          {bars.map((bar) => (
            <div key={bar.label} className="flex items-center gap-4">
              <div className="w-24 text-sm text-[var(--color-text-muted)] flex-shrink-0">{bar.label}</div>
              <div className="flex-1 h-8 bg-[var(--color-bg-subtle)] relative overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
                <div
                  className="h-full flex items-center justify-end px-3 transition-all duration-500"
                  style={{
                    width: `${Math.max((bar.value / maxBar) * 100, 2)}%`,
                    backgroundColor: bar.color,
                    borderRadius: "var(--radius)",
                  }}
                >
                  <span className="text-xs font-medium text-white">{bar.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <CalendarCheck className="w-5 h-5 text-[var(--color-text-muted)]" />
          <h3 className="text-sm font-medium text-[var(--color-text)]">Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Total Invited</p>
            <p className="text-lg font-heading text-[var(--color-text)]">{totalGuests}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Confirmed Attendees</p>
            <p className="text-lg font-heading text-[var(--color-text)]">
              {attending + (guests || []).reduce((sum, g) => sum + (g.plus_ones || 0), 0)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Yet to Respond</p>
            <p className="text-lg font-heading text-[var(--color-text)]">{pending}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Response Rate</p>
            <p className="text-lg font-heading text-[var(--color-text)]">{responseRate}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
