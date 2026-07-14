import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useGuestOutletContext } from "./guest-layout";
import { formatDate, formatTime12, isRsvpClosed, cn } from "../../lib/utils";

interface RsvpState {
  status: "attending" | "declined" | "pending";
  plus_ones: number;
  dietary: string;
  message: string;
}

export default function GuestRsvp() {
  const { event, invitedSubEventIds } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();

  const { data: subEvents, isLoading, error } = useQuery({
    queryKey: ["guest-rsvp-sub-events", event.id, invitedSubEventIds],
    queryFn: async () => {
      if (invitedSubEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .in("id", invitedSubEventIds)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
    enabled: invitedSubEventIds.length > 0,
  });

  const { data: existingRsvps } = useQuery({
    queryKey: ["guest-rsvps", event.id, guest?.id],
    queryFn: async () => {
      if (!guest) return [];
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("guest_id", guest.id);
      if (error) throw error;
      return (data ?? []) as EventRsvp[];
    },
    enabled: !!guest?.id,
  });

  const [rsvpStates, setRsvpStates] = useState<Record<string, RsvpState>>({});

  useEffect(() => {
    if (!subEvents || !existingRsvps) return;
    const states: Record<string, RsvpState> = {};
    for (const subEvent of subEvents) {
      const existing = existingRsvps.find((r) => r.sub_event_id === subEvent.id);
      states[subEvent.id] = {
        status: (existing?.status as RsvpState["status"]) || "pending",
        plus_ones: existing?.plus_ones ?? 0,
        dietary: existing?.dietary ?? "",
        message: existing?.message ?? "",
      };
    }
    setRsvpStates(states);
  }, [subEvents, existingRsvps]);

  const rsvpMutation = useMutation({
    mutationFn: async ({ subEventId, state }: { subEventId: string; state: RsvpState }) => {
      if (!guest) throw new Error("Not signed in");
      const existing = existingRsvps?.find((r) => r.sub_event_id === subEventId);
      const payload = {
        event_id: event.id, guest_id: guest.id, guest_name: guest.name, sub_event_id: subEventId,
        status: state.status, plus_ones: state.plus_ones, dietary: state.dietary, message: state.message,
        submitted_at: new Date().toISOString(), responded_at: new Date().toISOString(),
      };
      if (existing) {
        const { error } = await supabase.from("event_rsvps").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id, guest?.id] }); },
  });

  const updateState = (subEventId: string, patch: Partial<RsvpState>) => {
    setRsvpStates((prev) => ({ ...prev, [subEventId]: { ...prev[subEventId], ...patch } }));
  };

  if (isLoading) {
    return <div className="guest-section flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  }

  if (error) {
    return (
      <div className="guest-section text-center">
        <div className="event-card mx-auto max-w-md">
          <h2 className="guest-title mb-2">Something went wrong</h2>
          <p className="guest-subtitle">We couldn't load your RSVP page. Please try again later.</p>
        </div>
      </div>
    );
  }

  const events = subEvents ?? [];

  if (events.length === 0) {
    return (
      <div className="guest-section text-center">
        <div className="event-card mx-auto max-w-md">
          <h2 className="guest-title mb-2">No Events to RSVP</h2>
          <p className="guest-subtitle">You haven't been invited to any events yet, or the host hasn't configured any events.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="guest-eyebrow">RSVP</p>
          <h1 className="guest-title">Let us know if you can make it</h1>
          <p className="guest-subtitle mx-auto">Please respond to each event you've been invited to.</p>
        </div>
        <div className="space-y-6">
          {events.map((subEvent, index) => {
            const state = rsvpStates[subEvent.id] || { status: "pending" as const, plus_ones: 0, dietary: "", message: "" };
            const rsvpDeadlinePassed = isRsvpClosed(subEvent.rsvp_deadline);
            const mutationError = rsvpMutation.isError && rsvpMutation.variables?.subEventId === subEvent.id;
            return (
              <div key={subEvent.id} className="event-card animate-slideUpStagger" style={{ animationDelay: `${index * 80}ms` }}>
                <div className="mb-5">
                  <h2 className="mb-2 text-xl font-semibold" style={{ color: "var(--event-heading)" }}>{subEvent.name}</h2>
                  {subEvent.date && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{formatDate(subEvent.date)}{subEvent.start_time ? ` at ${formatTime12(subEvent.start_time)}` : ""}</p>}
                  {subEvent.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{subEvent.venue}</p>}
                  {subEvent.description && <p className="mt-2 text-sm" style={{ color: "var(--event-text)" }}>{subEvent.description}</p>}
                  {rsvpDeadlinePassed && <p className="mt-2 text-xs font-medium" style={{ color: "var(--event-primary)" }}>RSVP deadline has passed</p>}
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button onClick={() => updateState(subEvent.id, { status: "attending" })} disabled={rsvpDeadlinePassed}
                      className={cn("flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all", state.status === "attending" ? "scale-105" : "hover:scale-105")}
                      style={{ borderColor: state.status === "attending" ? "var(--event-primary)" : "var(--event-border)", backgroundColor: state.status === "attending" ? "var(--event-primary)" : "transparent", color: state.status === "attending" ? "var(--event-primary-fg)" : "var(--event-text)", opacity: rsvpDeadlinePassed ? 0.5 : 1, cursor: rsvpDeadlinePassed ? "not-allowed" : "pointer" }}>Will Attend</button>
                    <button onClick={() => updateState(subEvent.id, { status: "declined" })} disabled={rsvpDeadlinePassed}
                      className={cn("flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all", state.status === "declined" ? "scale-105" : "hover:scale-105")}
                      style={{ borderColor: state.status === "declined" ? "var(--event-primary)" : "var(--event-border)", backgroundColor: state.status === "declined" ? "var(--event-surface-alt)" : "transparent", color: state.status === "declined" ? "var(--event-muted)" : "var(--event-text)", opacity: rsvpDeadlinePassed ? 0.5 : 1, cursor: rsvpDeadlinePassed ? "not-allowed" : "pointer" }}>Cannot Attend</button>
                  </div>
                  {state.status === "attending" && (
                    <div className="space-y-3 animate-fadeIn">
                      <div><label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-text)" }}>Number of Plus Ones</label><input type="number" min={0} max={10} value={state.plus_ones} onChange={(e) => updateState(subEvent.id, { plus_ones: parseInt(e.target.value) || 0 })} className="event-input" /></div>
                      <div><label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-text)" }}>Dietary Requirements</label><input type="text" value={state.dietary} onChange={(e) => updateState(subEvent.id, { dietary: e.target.value })} className="event-input" placeholder="Any dietary restrictions?" /></div>
                      <div><label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-text)" }}>Message to Host</label><textarea value={state.message} onChange={(e) => updateState(subEvent.id, { message: e.target.value })} className="event-input" rows={2} placeholder="Leave a message..." /></div>
                    </div>
                  )}
                  {state.status !== "pending" && !rsvpDeadlinePassed && (
                    <button onClick={() => rsvpMutation.mutate({ subEventId: subEvent.id, state })} disabled={rsvpMutation.isPending} className="event-btn-primary w-full" style={{ opacity: rsvpMutation.isPending ? 0.6 : 1 }}>{rsvpMutation.isPending ? "Saving..." : "Submit RSVP"}</button>
                  )}
                  {rsvpMutation.isSuccess && rsvpMutation.variables?.subEventId === subEvent.id && <p className="text-sm font-medium animate-fadeIn" style={{ color: "var(--event-primary)" }}>Your RSVP has been saved.</p>}
                  {mutationError && <p className="text-sm font-medium" style={{ color: "var(--event-primary)" }}>Failed to save RSVP. Please try again.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
