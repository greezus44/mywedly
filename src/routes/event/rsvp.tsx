import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp, type SubEvent } from "../../lib/supabase";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function RsvpPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();

  const { data: rsvps, isLoading, isError, error } = useQuery({
    queryKey: ["event-rsvps", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId).order("submitted_at", { ascending: false }); if (error) throw error; return data as EventRsvp[]; },
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("sub_events").select("id, name, date, time").eq("parent_event_id", eventId).order("display_order", { ascending: true }); if (error) throw error; return data as SubEvent[]; },
  });

  const subEventMap = new Map<string, SubEvent>();
  (subEvents ?? []).forEach((se) => subEventMap.set(se.id, se));

  const attending = (rsvps ?? []).filter((r) => r.status === "attending");
  const declined = (rsvps ?? []).filter((r) => r.status === "declined");

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load RSVPs" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-dash-text">RSVPs</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-dash-muted">Total Responses</p><p className="mt-1 text-2xl font-bold text-dash-text">{rsvps?.length ?? 0}</p></Card>
        <Card><p className="text-sm text-dash-muted">Attending</p><p className="mt-1 text-2xl font-bold text-green-600">{attending.length}</p></Card>
        <Card><p className="text-sm text-dash-muted">Declined</p><p className="mt-1 text-2xl font-bold text-red-600">{declined.length}</p></Card>
      </div>
      {event.rsvp_deadline && (
        <Card><p className="text-sm text-dash-muted">RSVP Deadline: <span className="font-medium text-dash-text">{formatDate(event.rsvp_deadline)}</span></p></Card>
      )}
      {!rsvps || rsvps.length === 0 ? (
        <EmptyState title="No RSVPs yet" description="RSVP responses from guests will appear here." />
      ) : (
        <div className="space-y-3">
          {rsvps.map((rsvp) => (
            <Card key={rsvp.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dash-text">{rsvp.guest_name ?? "Unknown"}</h3>
                    <Badge variant={rsvp.status === "attending" ? "success" : rsvp.status === "declined" ? "danger" : "default"}>
                      {rsvp.status.charAt(0).toUpperCase() + rsvp.status.slice(1)}
                    </Badge>
                  </div>
                  {rsvp.sub_event_id && subEventMap.get(rsvp.sub_event_id) && (
                    <p className="mt-1 text-sm text-dash-muted">{subEventMap.get(rsvp.sub_event_id)!.name}</p>
                  )}
                  {rsvp.plus_ones > 0 && <p className="mt-1 text-sm text-dash-muted">Plus ones: {rsvp.plus_ones}</p>}
                  {rsvp.plus_one_names && rsvp.plus_one_names.length > 0 && (
                    <p className="text-sm text-dash-muted">Plus one names: {rsvp.plus_one_names.join(", ")}</p>
                  )}
                  {rsvp.dietary && <p className="text-sm text-dash-muted">Dietary: {rsvp.dietary}</p>}
                  {rsvp.message && <p className="mt-2 text-sm text-dash-text">{rsvp.message}</p>}
                  {rsvp.submitted_at && <p className="mt-1 text-xs text-dash-muted">Submitted: {formatDate(rsvp.submitted_at)}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
