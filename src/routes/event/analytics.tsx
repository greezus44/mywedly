import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Card, Badge, LoadingSpinner } from "../../components/ui";
import { formatDateShort } from "../../lib/utils";

export function AnalyticsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();

  const { data: guestStats, isLoading: guestsLoading } = useQuery({
    queryKey: ["analytics-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("id, rsvp_status, is_attending")
        .eq("event_id", eventId);
      if (error) throw error;
      const guests = data ?? [];
      const total = guests.length;
      const attending = guests.filter((g) => g.rsvp_status === "attending" || g.is_attending === true).length;
      const declined = guests.filter((g) => g.rsvp_status === "declined" || g.is_attending === false).length;
      const pending = guests.filter((g) => !g.rsvp_status && g.is_attending === null).length;
      return { total, attending, declined, pending };
    },
  });

  const { data: wishCount, isLoading: wishesLoading } = useQuery({
    queryKey: ["analytics-wishes", eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("event_messages")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: sharingEvents, isLoading: sharingLoading } = useQuery({
    queryKey: ["analytics-sharing", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("type, created_at")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const isLoading = guestsLoading || wishesLoading || sharingLoading;

  const stats = [
    {
      label: "Total Guests",
      value: guestStats?.total ?? "—",
      icon: "👥",
      variant: "default" as const,
    },
    {
      label: "Attending",
      value: guestStats?.attending ?? "—",
      icon: "✅",
      variant: "success" as const,
    },
    {
      label: "Declined",
      value: guestStats?.declined ?? "—",
      icon: "❌",
      variant: "danger" as const,
    },
    {
      label: "Pending",
      value: guestStats?.pending ?? "—",
      icon: "⏳",
      variant: "warning" as const,
    },
    {
      label: "Wishes",
      value: wishCount ?? "—",
      icon: "💌",
      variant: "default" as const,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Analytics</h2>
        {event.is_published && (
          <Badge variant="success">Live</Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <Card key={s.label} className="text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold text-dash-text">{s.value}</div>
                <div className="text-xs text-dash-muted mt-1">{s.label}</div>
              </Card>
            ))}
          </div>

          {/* RSVP breakdown */}
          {guestStats && guestStats.total > 0 && (
            <Card>
              <h3 className="font-semibold text-dash-text mb-3">RSVP Breakdown</h3>
              <div className="space-y-2">
                {[
                  { label: "Attending", value: guestStats.attending, colour: "bg-green-500" },
                  { label: "Declined", value: guestStats.declined, colour: "bg-red-400" },
                  { label: "Pending", value: guestStats.pending, colour: "bg-yellow-400" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="w-20 text-sm text-dash-muted">{row.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-dash-border overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.colour} transition-all`}
                        style={{ width: `${guestStats.total > 0 ? Math.round((row.value / guestStats.total) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm text-dash-text">{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Sharing events */}
          {sharingEvents && sharingEvents.length > 0 && (
            <Card>
              <h3 className="font-semibold text-dash-text mb-3">Recent Activity</h3>
              <ul className="space-y-2">
                {sharingEvents.slice(0, 10).map((e: { type: string; created_at: string }, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-dash-text capitalize">{e.type.replace(/_/g, " ")}</span>
                    <span className="text-dash-muted">{formatDateShort(e.created_at)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {(!sharingEvents || sharingEvents.length === 0) && (
            <Card>
              <p className="text-sm text-dash-muted text-center py-4">
                No activity recorded yet. Publish your event and share it with guests.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
