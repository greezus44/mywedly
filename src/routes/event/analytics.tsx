import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp, type EventGuest } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, LoadingSpinner, ErrorState, Badge } from "../../components/ui";

export function AnalyticsPage() {
  const { eventId, event } = useEventContext();

  const { data: guests, isLoading: guestsLoading, isError: guestsError, error: guestsErr, refetch: refetchGuests } = useQuery({
    queryKey: ["analytics-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("id, name, username")
        .eq("event_id", eventId);
      if (error) throw error;
      return data as Pick<EventGuest, "id" | "name" | "username">[];
    },
  });

  const { data: rsvps, isLoading: rsvpsLoading, isError: rsvpsError, error: rsvpsErr, refetch: refetchRsvps } = useQuery({
    queryKey: ["analytics-rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const { data: pageViews } = useQuery({
    queryKey: ["analytics-page-views", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_page_views")
        .select("id, viewed_at")
        .eq("event_id", eventId);
      if (error) throw error;
      return data as { id: string; viewed_at: string }[];
    },
  });

  if (guestsLoading || rsvpsLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (guestsError || rsvpsError) {
    return (
      <ErrorState
        title="Failed to load analytics"
        message={guestsErr instanceof Error ? guestsErr.message : rsvpsErr instanceof Error ? rsvpsErr.message : "An error occurred."}
        onRetry={() => { refetchGuests(); refetchRsvps(); }}
      />
    );
  }

  const totalGuests = guests?.length ?? 0;
  const rsvpList = rsvps ?? [];
  const attending = rsvpList.filter((r) => r.status === "attending").length;
  const notAttending = rsvpList.filter((r) => r.status === "not_attending").length;
  const maybe = rsvpList.filter((r) => r.status === "maybe").length;
  const noResponse = totalGuests - rsvpList.length;
  const plusOnes = rsvpList.filter((r) => r.plus_one).length;
  const totalAttendees = attending + plusOnes;
  const views = pageViews?.length ?? 0;

  const stats = [
    { label: "Total Guests", value: totalGuests, color: "text-dash-text" },
    { label: "Attending", value: attending, color: "text-green-600" },
    { label: "Not Attending", value: notAttending, color: "text-red-600" },
    { label: "Maybe", value: maybe, color: "text-amber-600" },
    { label: "No Response", value: noResponse, color: "text-dash-muted" },
    { label: "Plus Ones", value: plusOnes, color: "text-blue-600" },
    { label: "Total Attendees", value: totalAttendees, color: "text-dash-primary" },
    { label: "Page Views", value: views, color: "text-dash-text" },
  ];

  const responseRate = totalGuests > 0 ? Math.round((rsvpList.length / totalGuests) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Analytics</h2>
        <p className="text-sm text-dash-muted">
          Track RSVPs and engagement for {event.draft_name || event.name || "your event"}.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-dash-muted">{stat.label}</p>
            <p className={`mt-1 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Response rate */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Response Rate</h3>
        <div className="flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-dash-bg">
            <div
              className="h-full rounded-full bg-dash-primary transition-all"
              style={{ width: `${responseRate}%` }}
            />
          </div>
          <span className="text-sm font-medium text-dash-text">{responseRate}%</span>
        </div>
        <p className="mt-2 text-xs text-dash-muted">
          {rsvpList.length} of {totalGuests} guests have responded.
        </p>
      </Card>

      {/* RSVP breakdown */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">RSVP Breakdown</h3>
        <div className="space-y-2">
          {[
            { label: "Attending", count: attending, variant: "success" as const },
            { label: "Not Attending", count: notAttending, variant: "danger" as const },
            { label: "Maybe", count: maybe, variant: "warning" as const },
            { label: "No Response", count: noResponse, variant: "default" as const },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <Badge variant={item.variant}>{item.label}</Badge>
              <span className="text-sm font-medium text-dash-text">{item.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
