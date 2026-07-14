import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, LoadingSpinner, ErrorState, EmptyState, Modal, Input } from "../../components/ui";
import { formatDate, formatTime12, isRsvpClosed } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function RsvpPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  const { data: subEvents, isLoading, isError, error } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: rsvps } = useQuery({
    queryKey: ["event-rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("id, name, rsvp_status")
        .eq("event_id", eventId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const [showDeadline, setShowDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState((event.draft_rsvp_deadline ?? event.rsvp_deadline ?? "").slice(0, 10));
  const [deadlineTime, setDeadlineTime] = useState("23:59");

  const saveDeadlineMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_rsvp_deadline: deadlineDate ? `${deadlineDate}T${deadlineTime}:00` : null })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setShowDeadline(false);
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load RSVPs" message={error instanceof Error ? error.message : "Unknown error"} />;

  const rsvpDeadline = event.rsvp_deadline ?? event.draft_rsvp_deadline;
  const closed = isRsvpClosed(rsvpDeadline);

  const statusBadge = (status: string) => {
    const variant = status === "attending" ? "success" : status === "declined" ? "danger" : "warning";
    return <Badge variant={variant as "success" | "danger" | "warning"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">RSVP</h2>
        <Button size="sm" variant="secondary" onClick={() => setShowDeadline(true)}>
          {rsvpDeadline ? `Deadline: ${formatDate(rsvpDeadline)}` : "Set Deadline"}
        </Button>
      </div>

      {closed && (
        <Card>
          <p className="text-sm text-dash-danger">RSVP deadline has passed.</p>
        </Card>
      )}

      {/* RSVP Summary per sub-event */}
      {(subEvents ?? []).length === 0 ? (
        <EmptyState title="No sub-events" description="Create events first to collect RSVPs." />
      ) : (
        <div className="space-y-4">
          {(subEvents ?? []).map((se) => {
            const eventRsvps = (rsvps ?? []).filter((r) => r.sub_event_id === se.id);
            const attending = eventRsvps.filter((r) => r.status === "attending").length;
            const declined = eventRsvps.filter((r) => r.status === "declined").length;
            return (
              <Card key={se.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-dash-text">{se.name}</h3>
                    {se.date && <p className="text-sm text-dash-muted">{formatDate(se.date)}{se.time ? ` at ${formatTime12(se.time)}` : ""}</p>}
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="text-green-600">{attending} attending</span>
                    <span className="text-red-600">{declined} declined</span>
                  </div>
                </div>
                {eventRsvps.length > 0 && (
                  <div className="mt-4 space-y-1">
                    {eventRsvps.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded border border-dash-border px-3 py-1.5">
                        <span className="text-sm text-dash-text">{r.guest_name ?? "Unknown"}</span>
                        {statusBadge(r.status)}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Guest RSVP status summary */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Guest RSVP Status</h3>
        {(guests ?? []).length === 0 ? (
          <p className="text-sm text-dash-muted">No guests yet.</p>
        ) : (
          <div className="space-y-1">
            {(guests ?? []).map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded border border-dash-border px-3 py-1.5">
                <span className="text-sm text-dash-text">{g.name}</span>
                {statusBadge(g.rsvp_status)}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={showDeadline} onClose={() => setShowDeadline(false)} title="RSVP Deadline">
        <div className="space-y-4">
          <Input label="Date" type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
          <Input label="Time" type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDeadline(false)}>Cancel</Button>
            <Button onClick={() => saveDeadlineMutation.mutate()} loading={saveDeadlineMutation.isPending}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
