import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp, type EventGuest } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { RsvpBadge, getRsvpCounts, getPlusOneCount } from "./guest-form";
import { formatDateTime, isRsvpClosed } from "../../lib/utils";

export function RsvpPage() {
  const { eventId, event } = useEventContext();

  const { data: guests, isLoading: guestsLoading, isError: guestsError, error: guestsErr, refetch: refetchGuests } = useQuery({
    queryKey: ["rsvp-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("id, name, username, email")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Pick<EventGuest, "id" | "name" | "username" | "email">[];
    },
  });

  const { data: rsvps, isLoading: rsvpsLoading, isError: rsvpsError, error: rsvpsErr, refetch: refetchRsvps } = useQuery({
    queryKey: ["rsvp-list", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  if (guestsLoading || rsvpsLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (guestsError || rsvpsError) {
    return (
      <ErrorState
        title="Failed to load RSVPs"
        message={guestsErr instanceof Error ? guestsErr.message : rsvpsErr instanceof Error ? rsvpsErr.message : "An error occurred."}
        onRetry={() => { refetchGuests(); refetchRsvps(); }}
      />
    );
  }

  const guestList = guests ?? [];
  const rsvpList = rsvps ?? [];
  const rsvpByGuestId = new Map(rsvpList.map((r) => [r.guest_id, r]));
  const counts = getRsvpCounts(rsvpList);
  const plusOnes = getPlusOneCount(rsvpList);
  const deadlinePassed = isRsvpClosed(event.draft_rsvp_deadline ?? event.rsvp_deadline);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-dash-text">RSVP</h2>
        <p className="text-sm text-dash-muted">Track RSVP responses from your guests.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-dash-muted">Attending</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{counts.attending}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Not Attending</p>
          <p className="mt-1 text-3xl font-bold text-red-600">{counts.not_attending}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Maybe</p>
          <p className="mt-1 text-3xl font-bold text-amber-600">{counts.maybe}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Plus Ones</p>
          <p className="mt-1 text-3xl font-bold text-blue-600">{plusOnes}</p>
        </Card>
      </div>

      {/* Deadline info */}
      {event.draft_rsvp_deadline || event.rsvp_deadline ? (
        <Card>
          <div className="flex items-center gap-2">
            {deadlinePassed ? (
              <Badge variant="danger">RSVP Closed</Badge>
            ) : (
              <Badge variant="info">RSVP Open</Badge>
            )}
            <span className="text-sm text-dash-muted">
              Deadline: {formatDateTime(event.draft_rsvp_deadline ?? event.rsvp_deadline)}
            </span>
          </div>
        </Card>
      ) : null}

      {/* Guest RSVP list */}
      {guestList.length === 0 ? (
        <EmptyState
          title="No guests yet"
          message="Add guests to start tracking RSVPs."
        />
      ) : (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-dash-text">Guest Responses</h3>
          <div className="divide-y divide-dash-border">
            {guestList.map((guest) => {
              const rsvp = rsvpByGuestId.get(guest.id);
              return (
                <div key={guest.id} className="flex items-start justify-between py-3">
                  <div className="flex-1">
                    <p className="font-medium text-dash-text">{guest.name}</p>
                    <p className="text-xs text-dash-muted">@{guest.username}</p>
                    {guest.email && <p className="text-xs text-dash-muted">{guest.email}</p>}
                    {rsvp?.message && (
                      <p className="mt-1 text-sm italic text-dash-muted">"{rsvp.message}"</p>
                    )}
                    {rsvp?.dietary_requirements && (
                      <p className="mt-1 text-xs text-dash-muted">
                        Dietary: {rsvp.dietary_requirements}
                      </p>
                    )}
                    {rsvp?.plus_one && rsvp.plus_one_names.length > 0 && (
                      <p className="mt-1 text-xs text-dash-muted">
                        Plus one: {rsvp.plus_one_names.join(", ")}
                      </p>
                    )}
                    {rsvp?.submitted_at && (
                      <p className="mt-1 text-xs text-dash-muted">
                        Submitted: {formatDateTime(rsvp.submitted_at)}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    <RsvpBadge status={rsvp?.status ?? "no_response"} />
                    {rsvp?.plus_one && <Badge variant="info">+1</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
