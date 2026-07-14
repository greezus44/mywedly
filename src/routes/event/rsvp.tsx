import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, Badge, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { formatDateTime, isRsvpClosed } from "../../lib/utils";

const STATUS_VARIANTS: Record<string, "success" | "danger" | "warning" | "default"> = {
  attending: "success",
  declined: "danger",
  pending: "warning",
  maybe: "warning",
};

export function RsvpPage() {
  const { event, eventId } = useEventContext();

  const { data: rsvps, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
    enabled: !!eventId,
  });

  const rsvpClosed = isRsvpClosed(event.draft_rsvp_deadline ?? event.rsvp_deadline);

  const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
  const declined = rsvps?.filter((r) => r.status === "declined").length ?? 0;
  const pending = rsvps?.filter((r) => !r.status || r.status === "pending").length ?? 0;
  const totalPlusOnes = rsvps?.reduce((sum, r) => sum + (r.plus_ones ?? 0), 0) ?? 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load RSVPs"
        message={error instanceof Error ? error.message : "An unexpected error occurred."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">RSVPs</h2>
        <p className="text-sm text-dash-muted">Track guest responses for your event.</p>
      </div>

      {/* RSVP Status */}
      <div className="flex items-center gap-3">
        {rsvpClosed ? (
          <Badge variant="danger">RSVP Closed</Badge>
        ) : (
          <Badge variant="success">RSVP Open</Badge>
        )}
        {event.draft_rsvp_deadline && (
          <span className="text-sm text-dash-muted">
            Deadline: {formatDateTime(event.draft_rsvp_deadline)}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-sm text-dash-muted">Attending</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{attending}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Declined</p>
          <p className="mt-1 text-3xl font-bold text-red-600">{declined}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Pending</p>
          <p className="mt-1 text-3xl font-bold text-amber-600">{pending}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Plus Ones</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{totalPlusOnes}</p>
        </Card>
      </div>

      {/* RSVP List */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">All Responses</h3>
        {!rsvps || rsvps.length === 0 ? (
          <EmptyState
            title="No RSVPs yet"
            description="Once guests respond to your invitation, their RSVPs will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-dash-border text-dash-muted">
                <tr>
                  <th className="pb-2 pr-4 font-medium">Guest</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Plus Ones</th>
                  <th className="pb-2 pr-4 font-medium">Dietary</th>
                  <th className="pb-2 pr-4 font-medium">Message</th>
                  <th className="pb-2 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((rsvp) => (
                  <tr key={rsvp.id} className="border-b border-dash-border/50">
                    <td className="py-3 pr-4 font-medium text-dash-text">
                      {rsvp.guest_name ?? "Unknown"}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={STATUS_VARIANTS[rsvp.status ?? "pending"] ?? "default"}>
                        {rsvp.status ?? "pending"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-dash-muted">{rsvp.plus_ones}</td>
                    <td className="py-3 pr-4 text-dash-muted">{rsvp.dietary ?? "—"}</td>
                    <td className="py-3 pr-4 text-dash-muted">{rsvp.message ?? "—"}</td>
                    <td className="py-3 text-dash-muted">
                      {rsvp.submitted_at ? formatDateTime(rsvp.submitted_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
