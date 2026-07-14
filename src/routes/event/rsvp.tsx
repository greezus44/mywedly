import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { formatDate } from "../../lib/utils";

export default function RsvpPage() {
  const { eventId } = useEventContext();

  const { data: rsvps, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("responded_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const total = rsvps?.length ?? 0;
  const confirmed = rsvps?.filter((r) => r.status === "confirmed" || r.status === "attending").length ?? 0;
  const declined = rsvps?.filter((r) => r.status === "declined").length ?? 0;
  const pending = rsvps?.filter((r) => r.status === "pending").length ?? 0;
  const totalGuests = rsvps?.reduce((sum, r) => sum + (r.guest_count ?? 1), 0) ?? 0;

  const stats = [
    { label: "Total Responses", value: total, color: "text-dash-text" },
    { label: "Confirmed", value: confirmed, color: "text-green-600" },
    { label: "Declined", value: declined, color: "text-red-600" },
    { label: "Pending", value: pending, color: "text-amber-600" },
    { label: "Total Guests", value: totalGuests, color: "text-dash-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-dash-text">RSVP Responses</h2>
        <p className="text-sm text-dash-muted">View and track guest RSVP responses.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-xs text-dash-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* RSVP List */}
      {rsvps && rsvps.length > 0 ? (
        <Card>
          <h3 className="text-sm font-semibold text-dash-text mb-3">All Responses</h3>
          <div className="space-y-2">
            {rsvps.map((rsvp) => (
              <div
                key={rsvp.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border border-dash-border bg-dash-bg px-4 py-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        rsvp.status === "confirmed" || rsvp.status === "attending"
                          ? "success"
                          : rsvp.status === "declined"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {rsvp.status}
                    </Badge>
                    <span className="text-sm font-medium text-dash-text">
                      {rsvp.guest_count ?? 1} guest(s)
                    </span>
                  </div>
                  {rsvp.dietary_notes && (
                    <p className="text-xs text-dash-muted">
                      🍽 Dietary: {rsvp.dietary_notes}
                    </p>
                  )}
                  {rsvp.message && (
                    <p className="text-sm text-dash-text italic">"{rsvp.message}"</p>
                  )}
                </div>
                <span className="text-xs text-dash-muted whitespace-nowrap">
                  {formatDate(rsvp.responded_at)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No RSVP responses yet"
          description="RSVP responses from your guests will appear here."
          icon={<span className="text-5xl">📋</span>}
        />
      )}
    </div>
  );
}
