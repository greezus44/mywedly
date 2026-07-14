import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp, type EventGuest } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { formatDate } from "../../lib/utils";

export function AnalyticsPage() {
  const { eventId } = useEventContext();

  const { data: guests, isLoading: guestsLoading, isError: guestsError } = useQuery({
    queryKey: ["analytics-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const { data: rsvps, isLoading: rsvpsLoading, isError: rsvpsError } = useQuery({
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

  const { data: messages } = useQuery({
    queryKey: ["analytics-messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (guestsLoading || rsvpsLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (guestsError || rsvpsError) {
    return <ErrorState message="Failed to load analytics." />;
  }

  const totalGuests = guests?.length ?? 0;
  const totalRsvps = rsvps?.length ?? 0;
  const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
  const notAttending = rsvps?.filter((r) => r.status === "not_attending").length ?? 0;
  const pending = rsvps?.filter((r) => r.status === "pending").length ?? 0;
  const totalMessages = messages?.length ?? 0;
  const responseRate = totalGuests > 0 ? Math.round((totalRsvps / totalGuests) * 100) : 0;

  const stats = [
    { label: "Total Guests", value: totalGuests, variant: "default" as const },
    { label: "RSVPs Received", value: totalRsvps, variant: "primary" as const },
    { label: "Attending", value: attending, variant: "success" as const },
    { label: "Not Attending", value: notAttending, variant: "danger" as const },
    { label: "Pending", value: pending, variant: "warning" as const },
    { label: "Messages", value: totalMessages, variant: "default" as const },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dash-text">Analytics</h1>
        <p className="mt-1 text-sm text-dash-muted">
          Track guest engagement and RSVP responses.
        </p>
      </div>

      {/* Response Rate */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-dash-text">Response Rate</h2>
            <p className="mt-1 text-3xl font-bold text-dash-primary">{responseRate}%</p>
          </div>
          <div className="text-right text-sm text-dash-muted">
            <p>{totalRsvps} of {totalGuests} guests responded</p>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-dash-border">
          <div
            className="h-full rounded-full bg-dash-primary transition-all"
            style={{ width: `${responseRate}%` }}
          />
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-dash-muted">{stat.label}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-bold text-dash-text">{stat.value}</span>
              <Badge variant={stat.variant}>{stat.label}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent RSVPs */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-dash-text">Recent RSVPs</h2>
        {rsvps && rsvps.length > 0 ? (
          <div className="space-y-2">
            {rsvps.slice(0, 10).map((rsvp) => {
              const guest = guests?.find((g) => g.id === rsvp.guest_id);
              return (
                <div
                  key={rsvp.id}
                  className="flex items-center justify-between rounded-lg border border-dash-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-dash-text">
                      {guest?.name ?? "Unknown Guest"}
                    </p>
                    <p className="text-xs text-dash-muted">
                      {formatDate(rsvp.created_at)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      rsvp.status === "attending"
                        ? "success"
                        : rsvp.status === "not_attending"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {rsvp.status === "attending"
                      ? "Attending"
                      : rsvp.status === "not_attending"
                      ? "Not Attending"
                      : "Pending"}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-dash-muted">No RSVPs yet.</p>
        )}
      </Card>
    </div>
  );
}
