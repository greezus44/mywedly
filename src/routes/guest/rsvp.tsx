import { useState, useEffect } from "react";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type EventRsvp, type EventSchedule, type SubEvent } from "../../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate, formatTime12 } from "../../lib/utils";

export default function GuestRsvp() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();

  // FIX #3: Load event schedule for display
  const { data: schedule } = useQuery({
    queryKey: ["event-schedule-public", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", event.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
  });

  // Load sub-events the guest is invited to
  const { data: subEvents } = useQuery({
    queryKey: ["invited-sub-events", invitedSubEventIds],
    queryFn: async () => {
      if (invitedSubEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .in("id", invitedSubEventIds)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: invitedSubEventIds.length > 0,
  });

  // Load existing RSVPs for this guest
  const { data: existingRsvps } = useQuery({
    queryKey: ["guest-rsvps", guest?.id, event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("guest_id", guest!.id)
        .eq("event_id", event.id);
      if (error) throw error;
      return data as EventRsvp[];
    },
    enabled: !!guest,
  });

  const [responses, setResponses] = useState<Record<string, { status: string; plus_ones: number; message: string }>>({});

  useEffect(() => {
    if (existingRsvps) {
      const map: Record<string, { status: string; plus_ones: number; message: string }> = {};
      existingRsvps.forEach((r) => {
        const key = r.sub_event_id || "main";
        map[key] = { status: r.status, plus_ones: r.plus_ones, message: r.message ?? "" };
      });
      setResponses(map);
    }
  }, [existingRsvps]);

  const rsvpMutation = useMutation({
    mutationFn: async ({ subEventId, status, plus_ones, message }: { subEventId: string | null; status: string; plus_ones: number; message: string }) => {
      const existing = existingRsvps?.find((r) => (subEventId ? r.sub_event_id === subEventId : !r.sub_event_id));
      if (existing) {
        const { error } = await supabase
          .from("event_rsvps")
          .update({ status, plus_ones, message, responded_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .insert({
            event_id: event.id,
            guest_id: guest!.id,
            guest_name: guest!.name,
            status,
            plus_ones,
            message,
            sub_event_id: subEventId,
            responded_at: new Date().toISOString(),
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", guest?.id, event.id] });
    },
  });

  const handleRsvp = (subEventId: string | null, status: string) => {
    const key = subEventId || "main";
    const current = responses[key] ?? { status: "pending", plus_ones: 0, message: "" };
    const updated = { ...current, status };
    setResponses((p) => ({ ...p, [key]: updated }));
    rsvpMutation.mutate({ subEventId, status, plus_ones: updated.plus_ones, message: updated.message });
  };

  const eventDate = event.event_date;
  const eventTime = event.event_time;
  const venue = event.venue;
  const address = event.address;

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-2xl">
        {/* Event Details */}
        <div className="mb-8 text-center">
          <h1 className="guest-title mb-2">RSVP</h1>
          <p className="guest-subtitle">Let us know if you'll be joining us</p>
        </div>

        {/* FIX #3: Event date, time, address */}
        {(eventDate || eventTime || venue || address) && (
          <div className="event-card mb-6 space-y-2 text-center">
            {eventDate && (
              <p className="text-lg" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>
                {formatDate(eventDate)}{eventTime ? ` at ${formatTime12(eventTime)}` : ""}
              </p>
            )}
            {venue && <p style={{ color: "var(--event-text)" }}>{venue}</p>}
            {address && <p style={{ color: "var(--event-muted)" }}>{address}</p>}
          </div>
        )}

        {/* FIX #3: Event schedule/timeline */}
        {schedule && schedule.length > 0 && (
          <div className="event-card mb-6">
            <h2 className="mb-4 text-center" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>Schedule</h2>
            <div className="space-y-3">
              {schedule.map((item) => (
                <div key={item.id} className="flex items-start gap-4 border-t border-dashed pt-3" style={{ borderColor: "var(--event-border)" }}>
                  <div className="shrink-0 text-right" style={{ minWidth: "80px" }}>
                    {item.start_time && <p className="text-sm font-medium" style={{ color: "var(--event-primary)" }}>{formatTime12(item.start_time)}</p>}
                    {item.end_time && <p className="text-xs" style={{ color: "var(--event-muted)" }}>{formatTime12(item.end_time)}</p>}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: "var(--event-heading)" }}>{item.title}</p>
                    {item.description && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{item.description}</p>}
                    {item.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{item.venue}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-event RSVPs */}
        {subEvents && subEvents.length > 0 ? (
          <div className="space-y-4">
            {subEvents.map((se) => {
              const key = se.id;
              const current = responses[key] ?? { status: "pending", plus_ones: 0, message: "" };
              return (
                <div key={se.id} className="event-card">
                  <h3 className="mb-2" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>{se.name}</h3>
                  {se.date && <p className="mb-3 text-sm" style={{ color: "var(--event-muted)" }}>{formatDate(se.date)}{se.time ? ` at ${formatTime12(se.time)}` : ""}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => handleRsvp(se.id, "attending")} className="event-btn-primary" style={{ opacity: current.status === "attending" ? 1 : 0.6 }}>Attending</button>
                    <button onClick={() => handleRsvp(se.id, "declined")} className="event-btn-secondary" style={{ opacity: current.status === "declined" ? 1 : 0.6 }}>Declined</button>
                  </div>
                  {current.status === "attending" && (
                    <p className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>Thank you! We look forward to seeing you.</p>
                  )}
                  {current.status === "declined" && (
                    <p className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>We're sorry you can't make it. Thank you for letting us know.</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="event-card text-center">
            <div className="flex justify-center gap-3">
              <button onClick={() => handleRsvp(null, "attending")} className="event-btn-primary" style={{ opacity: responses["main"]?.status === "attending" ? 1 : 0.6 }}>Attending</button>
              <button onClick={() => handleRsvp(null, "declined")} className="event-btn-secondary" style={{ opacity: responses["main"]?.status === "declined" ? 1 : 0.6 }}>Declined</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
