import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp, type EventGuest } from "../../lib/supabase";
import { Card, Badge, LoadingSpinner, EmptyState } from "../../components/ui";
import { formatDateShort, isRsvpClosed } from "../../lib/utils";

export function RsvpPage() {
  const { eventId, event } = useOutletContext<{ event: UserEvent; eventId: string }>();

  const { data: rsvps, isLoading } = useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*, event_guests(full_name, username)")
        .eq("event_id", eventId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (EventRsvp & { event_guests: { full_name: string; username: string } | null })[];
    },
  });

  const deadline = event.rsvp_deadline;
  const closed = isRsvpClosed(deadline);

  const attending = (rsvps ?? []).filter((r) => r.status === "attending");
  const declined = (rsvps ?? []).filter((r) => r.status === "declined");
  const totalPlusOnes = attending.reduce((sum, r) => sum + (r.plus_one_count ?? 0), 0);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-dash-text">RSVPs</h2>
        <div className="flex items-center gap-2">
          {deadline && (
            <span className="text-sm text-dash-muted">
              Deadline: {formatDateShort(deadline)}
            </span>
          )}
          {closed && <Badge variant="warning">Closed</Badge>}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">{attending.length}</div>
          <div className="text-xs text-dash-muted mt-1">Attending</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-red-500">{declined.length}</div>
          <div className="text-xs text-dash-muted mt-1">Declined</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-dash-text">{totalPlusOnes}</div>
          <div className="text-xs text-dash-muted mt-1">Plus Ones</div>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : !rsvps || rsvps.length === 0 ? (
        <EmptyState title="No RSVPs yet" description="RSVPs will appear here once guests respond." />
      ) : (
        <div className="space-y-3">
          {rsvps.map((rsvp) => (
            <Card key={rsvp.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-dash-text">
                      {rsvp.event_guests?.full_name ?? "Unknown Guest"}
                    </span>
                    <Badge variant={rsvp.status === "attending" ? "success" : rsvp.status === "declined" ? "danger" : "default"}>
                      {rsvp.status}
                    </Badge>
                  </div>
                  {rsvp.event_guests?.username && (
                    <p className="text-xs text-dash-muted">@{rsvp.event_guests.username}</p>
                  )}
                  {rsvp.plus_one_count > 0 && (
                    <p className="text-sm text-dash-muted mt-1">
                      +{rsvp.plus_one_count} guest{rsvp.plus_one_count > 1 ? "s" : ""}
                      {rsvp.plus_one_names?.length > 0 && `: ${rsvp.plus_one_names.join(", ")}`}
                    </p>
                  )}
                  {rsvp.message && (
                    <p className="mt-1 text-sm text-dash-muted italic">"{rsvp.message}"</p>
                  )}
                </div>
                <span className="text-xs text-dash-muted shrink-0">
                  {formatDateShort(rsvp.updated_at)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
