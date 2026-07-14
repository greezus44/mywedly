import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Card, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { formatDate } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function AnalyticsPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();

  const { data: guestStats, isLoading } = useQuery({
    queryKey: ["analytics-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("rsvp_status").eq("event_id", eventId);
      if (error) throw error;
      const guests = data ?? [];
      return {
        total: guests.length,
        attending: guests.filter((g) => g.rsvp_status === "attending").length,
        declined: guests.filter((g) => g.rsvp_status === "declined").length,
        pending: guests.filter((g) => g.rsvp_status === "pending").length,
      };
    },
  });

  const { data: messageCount } = useQuery({
    queryKey: ["analytics-messages", eventId],
    queryFn: async () => {
      const { count } = await supabase.from("event_messages").select("*", { count: "exact", head: true }).eq("event_id", eventId);
      return count ?? 0;
    },
  });

  const { data: pageViews } = useQuery({
    queryKey: ["analytics-views", eventId],
    queryFn: async () => {
      const { count } = await supabase.from("sharing_events").select("*", { count: "exact", head: true }).eq("event_id", eventId);
      return count ?? 0;
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-dash-text">Analytics</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-dash-muted">Total Guests</p>
          <p className="mt-1 text-2xl font-bold text-dash-text">{guestStats?.total ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Attending</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{guestStats?.attending ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Declined</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{guestStats?.declined ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{guestStats?.pending ?? 0}</p>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-dash-muted">Wishes / Messages</p>
          <p className="mt-1 text-2xl font-bold text-dash-text">{messageCount ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Page Views / Shares</p>
          <p className="mt-1 text-2xl font-bold text-dash-text">{pageViews ?? 0}</p>
        </Card>
      </div>
      {event.event_date && (
        <Card>
          <p className="text-sm text-dash-muted">Event Date</p>
          <p className="mt-1 text-lg font-semibold text-dash-text">{formatDate(event.event_date)}</p>
        </Card>
      )}
    </div>
  );
}
