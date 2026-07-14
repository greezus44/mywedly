import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { formatDateShort, formatTime12 } from "../../lib/utils";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";

export default function Analytics() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();

  const { data: visits, isLoading: visitsLoading, isError: visitsError } = useQuery({
    queryKey: ["analytics", "visits", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sharing_events")
        .select("*")
        .eq("wedding_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const { data: rsvps, isLoading: rsvpsLoading, isError: rsvpsError } = useQuery({
    queryKey: ["analytics", "rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  if (visitsLoading || rsvpsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (visitsError || rsvpsError) {
    return (
      <ErrorState
        title="Failed to load analytics"
        description="Please try again later."
      />
    );
  }

  const totalVisits = visits?.length ?? 0;
  const uniqueVisitors = new Set(visits?.map((v) => v.guest_id).filter(Boolean)).size;
  const totalRsvps = rsvps?.length ?? 0;
  const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
  const declined = rsvps?.filter((r) => r.status === "declined").length ?? 0;

  const stats = [
    { label: "Total Visits", value: totalVisits, icon: "👁" },
    { label: "Unique Visitors", value: uniqueVisitors, icon: "👥" },
    { label: "Total RSVPs", value: totalRsvps, icon: "✉️" },
    { label: "Attending", value: attending, icon: "✅" },
    { label: "Declined", value: declined, icon: "❌" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
        <p className="text-sm text-muted">
          Track visits and RSVP responses for your website.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{stat.icon}</span>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent visits */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Recent Visits
        </h3>
        {visits && visits.length > 0 ? (
          <div className="flex flex-col gap-2">
            {visits.slice(0, 10).map((visit) => (
              <div
                key={visit.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface-alt px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="info">{visit.event_type || "view"}</Badge>
                  <span className="text-sm text-muted">
                    {visit.source || "direct"}
                  </span>
                  {visit.device_type && (
                    <span className="text-xs text-muted">
                      · {visit.device_type}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted">
                  {formatDateShort(visit.created_at)} {formatTime12(
                    visit.created_at.split("T")[1]?.slice(0, 5) ?? null
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No visits yet" description="Share your website to start tracking visits." />
        )}
      </Card>

      {/* Recent RSVPs */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Recent RSVP Responses
        </h3>
        {rsvps && rsvps.length > 0 ? (
          <div className="flex flex-col gap-2">
            {rsvps.slice(0, 10).map((rsvp) => (
              <div
                key={rsvp.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface-alt px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {rsvp.guest_name}
                  </span>
                  <Badge
                    variant={
                      rsvp.status === "attending"
                        ? "success"
                        : rsvp.status === "declined"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {rsvp.status}
                  </Badge>
                  {rsvp.plus_ones > 0 && (
                    <span className="text-xs text-muted">
                      +{rsvp.plus_ones} guests
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted">
                  {formatDateShort(rsvp.submitted_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No RSVPs yet" description="RSVP responses will appear here." />
        )}
      </Card>
    </div>
  );
}
