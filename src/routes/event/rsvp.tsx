import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { LoadingSpinner, ErrorState, EmptyState, Card, Badge } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";

const STATUS_VARIANTS: Record<string, "success" | "danger" | "warning" | "default"> = {
  attending: "success", yes: "success",
  not_attending: "danger", no: "danger",
  maybe: "warning",
  pending: "default",
};

export default function Rsvp() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: rsvps, isLoading, error } = useQuery({
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

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (error) return <ErrorState message="Failed to load RSVP responses." />;

  const total = rsvps?.length ?? 0;
  const attending = rsvps?.filter((r) => r.status === "attending" || r.status === "yes").length ?? 0;
  const notAttending = rsvps?.filter((r) => r.status === "not_attending" || r.status === "no").length ?? 0;
  const maybe = rsvps?.filter((r) => r.status === "maybe").length ?? 0;
  const totalPlusOnes = rsvps?.reduce((sum, r) => sum + (r.plus_ones || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">RSVP Responses</h2>
        <p className="mt-1 text-sm text-dash-muted">View and track RSVP responses from your guests.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-dash-primary">{total}</div>
          <div className="mt-1 text-sm text-dash-muted">Total Responses</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600">{attending}</div>
          <div className="mt-1 text-sm text-dash-muted">Attending</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-red-600">{notAttending}</div>
          <div className="mt-1 text-sm text-dash-muted">Not Attending</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-amber-600">{totalPlusOnes}</div>
          <div className="mt-1 text-sm text-dash-muted">Plus Ones</div>
        </Card>
      </div>

      {/* Response list */}
      {!rsvps || rsvps.length === 0 ? (
        <EmptyState title="No RSVP responses yet" description="RSVP responses will appear here once guests start responding." />
      ) : (
        <div className="space-y-3">
          {rsvps.map((rsvp) => (
            <Card key={rsvp.id} className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-dash-text">{rsvp.guest_name}</h3>
                  <Badge variant={STATUS_VARIANTS[rsvp.status] || "default"}>
                    {rsvp.status || "pending"}
                  </Badge>
                  {rsvp.plus_ones > 0 && (
                    <Badge variant="info">+{rsvp.plus_ones} guest{rsvp.plus_ones > 1 ? "s" : ""}</Badge>
                  )}
                </div>
                {rsvp.dietary && <p className="mt-1 text-sm text-dash-muted">Dietary: {rsvp.dietary}</p>}
                {rsvp.message && (
                  <p className="mt-2 rounded-md bg-dash-bg px-3 py-2 text-sm text-dash-text italic">
                    "{rsvp.message}"
                  </p>
                )}
                <p className="mt-2 text-xs text-dash-muted">Submitted: {formatDateTime(rsvp.submitted_at)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
