import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { formatDate } from "../../lib/utils";
import {
  Card,
  Badge,
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "../../components/ui";

export default function RsvpPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: rsvps, isLoading, isError, refetch } = useQuery({
    queryKey: ["event_rsvps", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState message="Failed to load RSVPs." onRetry={() => refetch()} />;
  }

  const rsvpList = rsvps ?? [];
  const attending = rsvpList.filter(
    (r) => r.status === "attending" || r.status === "yes"
  );
  const declined = rsvpList.filter(
    (r) => r.status === "declined" || r.status === "no"
  );
  const pending = rsvpList.filter((r) => r.status === "pending");
  const totalGuests = attending.reduce((sum, r) => sum + 1 + (r.plus_ones || 0), 0);

  const stats = [
    { label: "Total RSVPs", value: rsvpList.length, variant: "info" as const },
    { label: "Attending", value: attending.length, variant: "success" as const },
    { label: "Declined", value: declined.length, variant: "danger" as const },
    { label: "Pending", value: pending.length, variant: "warning" as const },
    { label: "Total Guests", value: totalGuests, variant: "info" as const },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-dash-text">RSVP Responses</h2>
        <p className="text-sm text-dash-muted">View and track RSVP responses from your guests.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <div className="text-2xl font-bold text-dash-text">{stat.value}</div>
            <div className="mt-1">
              <Badge variant={stat.variant}>{stat.label}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* RSVP List */}
      {rsvpList.length === 0 ? (
        <EmptyState
          title="No RSVP responses yet"
          description="RSVP responses from your guests will appear here."
          icon={<span className="text-4xl">📝</span>}
        />
      ) : (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-dash-text">All Responses</h3>
          <div className="space-y-3">
            {rsvpList.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-dash-border bg-dash-bg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-dash-text">{r.guest_name}</span>
                      <Badge
                        variant={
                          r.status === "attending" || r.status === "yes"
                            ? "success"
                            : r.status === "declined" || r.status === "no"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {r.status}
                      </Badge>
                      {r.plus_ones > 0 && (
                        <span className="text-xs text-dash-muted">
                          +{r.plus_ones} guest{r.plus_ones > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {r.dietary && (
                      <p className="mt-1 text-sm text-dash-muted">
                        <span className="font-medium">Dietary:</span> {r.dietary}
                      </p>
                    )}
                    {r.message && (
                      <p className="mt-1 text-sm text-dash-muted">
                        <span className="font-medium">Message:</span> {r.message}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-dash-muted whitespace-nowrap">
                    {formatDate(r.submitted_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
