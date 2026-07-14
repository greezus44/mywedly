import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Card, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";

interface EventContextValue { event: UserEvent; eventId: string; }

export function AnalyticsPage() {
  const { eventId } = useOutletContext<EventContextValue>();

  const { data: guests, isLoading, isError, error } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("id, rsvp_status")
        .eq("event_id", eventId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["event-messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("id")
        .eq("event_id", eventId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: rsvps } = useQuery({
    queryKey: ["event-rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("id, status")
        .eq("event_id", eventId);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load analytics" message={error instanceof Error ? error.message : "Unknown error"} />;

  const totalGuests = guests?.length ?? 0;
  const attending = guests?.filter((g) => g.rsvp_status === "attending").length ?? 0;
  const declined = guests?.filter((g) => g.rsvp_status === "declined").length ?? 0;
  const pending = guests?.filter((g) => g.rsvp_status === "pending").length ?? 0;
  const totalMessages = messages?.length ?? 0;

  const stats = [
    { label: "Total Guests", value: totalGuests, color: "text-dash-text" },
    { label: "Attending", value: attending, color: "text-green-600" },
    { label: "Declined", value: declined, color: "text-red-600" },
    { label: "Pending", value: pending, color: "text-amber-600" },
    { label: "Wishes Received", value: totalMessages, color: "text-dash-primary" },
  ];

  const rsvpRate = totalGuests > 0 ? Math.round(((attending + declined) / totalGuests) * 100) : 0;

  if (totalGuests === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-dash-text">Analytics</h2>
        <EmptyState title="No data yet" description="Add guests to see analytics." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dash-text">Analytics</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-dash-muted">{stat.label}</p>
            <p className={`mt-1 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">RSVP Rate</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dash-muted">Response rate</span>
            <span className="font-medium text-dash-text">{rsvpRate}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-dash-bg">
            <div
              className="h-full rounded-full bg-dash-primary transition-all"
              style={{ width: `${rsvpRate}%` }}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">RSVP Breakdown</h3>
        <div className="space-y-3">
          {[
            { label: "Attending", count: attending, color: "bg-green-500" },
            { label: "Declined", count: declined, color: "bg-red-500" },
            { label: "Pending", count: pending, color: "bg-amber-500" },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-dash-text">{item.label}</span>
                <span className="text-dash-muted">{item.count} ({totalGuests > 0 ? Math.round((item.count / totalGuests) * 100) : 0}%)</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-dash-bg">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${totalGuests > 0 ? (item.count / totalGuests) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
