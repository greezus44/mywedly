import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { isRsvpClosed, formatDate, formatTime12 } from "../../lib/utils";

interface RsvpState {
  status: "attending" | "declined" | "";
  plusOnes: number;
  plusOneNames: string;
  message: string;
}

const emptyState: RsvpState = { status: "", plusOnes: 0, plusOneNames: "", message: "" };

export default function GuestRsvp() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();

  const deadline = event.rsvp_deadline;
  const closed = isRsvpClosed(deadline);

  // Fetch sub-events the guest is invited to
  const { data: subEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["rsvp-sub-events", event.id, invitedSubEventIds],
    queryFn: async () => {
      if (invitedSubEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .in("id", invitedSubEventIds)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
    enabled: invitedSubEventIds.length > 0,
  });

  // Fetch existing RSVPs for this guest
  const { data: existingRsvps, isLoading: rsvpsLoading } = useQuery({
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
    enabled: !!guest,
  });

  // Build per-event state from existing RSVPs
  const initialStates = useMemo(() => {
    const map = new Map<string, RsvpState>();
    for (const ev of subEvents ?? []) {
      const existing = (existingRsvps ?? []).find((r) => r.sub_event_id === ev.id);
      map.set(ev.id, existing
        ? {
            status: (existing.status as "attending" | "declined") || "",
            plusOnes: existing.plus_ones ?? 0,
            plusOneNames: (existing.plus_one_names ?? []).join(", "),
            message: existing.message ?? "",
          }
        : { ...emptyState });
    }
    return map;
  }, [subEvents, existingRsvps]);

  const [states, setStates] = useState<Record<string, RsvpState>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync local state when initial data loads
  const loadedKey = JSON.stringify(Array.from(initialStates.entries()));
  const [lastLoaded, setLastLoaded] = useState("");
  if (loadedKey !== lastLoaded) {
    setLastLoaded(loadedKey);
    const next: Record<string, RsvpState> = {};
    initialStates.forEach((v, k) => { next[k] = v; });
    setStates(next);
  }

  function update(subEventId: string, patch: Partial<RsvpState>) {
    setStates((prev) => ({
      ...prev,
      [subEventId]: { ...(prev[subEventId] ?? emptyState), ...patch },
    }));
  }

  const saveMutation = useMutation({
    mutationFn: async (subEventId: string) => {
      if (!guest) throw new Error("Not signed in");
      const s = states[subEventId] ?? emptyState;
      if (!s.status) throw new Error("Please choose attending or declined.");
      const payload = {
        event_id: event.id,
        guest_id: guest.id,
        guest_name: guest.name,
        sub_event_id: subEventId,
        status: s.status,
        plus_ones: s.plusOnes,
        plus_one_names: s.plusOneNames ? s.plusOneNames.split(",").map((n) => n.trim()).filter(Boolean) : [],
        message: s.message || null,
        submitted_at: new Date().toISOString(),
      };
      const existing = (existingRsvps ?? []).find((r) => r.sub_event_id === subEventId);
      if (existing) {
        const { error } = await supabase.from("event_rsvps").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id, guest?.id] });
      setSubmitError(null);
    },
    onError: (err) => setSubmitError(err instanceof Error ? err.message : "Could not save RSVP."),
  });

  if (eventsLoading || rsvpsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--event-primary)] border-t-transparent" />
      </div>
    );
  }

  if (closed) {
    return (
      <section className="guest-section text-center">
        <div className="mx-auto max-w-md">
          <h1 className="guest-title">RSVP Closed</h1>
          <p className="guest-subtitle mx-auto">
            The RSVP deadline has passed. {deadline && `It was ${formatDate(deadline)}.`}
          </p>
        </div>
      </section>
    );
  }

  if (!subEvents || subEvents.length === 0) {
    return (
      <section className="guest-section text-center">
        <div className="mx-auto max-w-md">
          <h1 className="guest-title">RSVP</h1>
          <p className="guest-subtitle mx-auto">You have not been invited to any events yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="guest-title">RSVP</h1>
          <p className="guest-subtitle mx-auto">Let us know which events you'll attend.</p>
        </div>

        {submitError && (
          <div className="event-card mb-6 text-center" style={{ borderColor: "var(--event-primary)" }}>
            <p style={{ color: "var(--event-primary)" }}>{submitError}</p>
          </div>
        )}

        <div className="space-y-6">
          {subEvents.map((ev) => {
            const s = states[ev.id] ?? emptyState;
            const evClosed = isRsvpClosed(ev.rsvp_deadline);
            return (
              <div key={ev.id} className="event-card">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>
                    {ev.name}
                  </h2>
                  {(ev.date || ev.time) && (
                    <p className="text-sm" style={{ color: "var(--event-muted)" }}>
                      {formatDate(ev.date)}{ev.time && ` · ${formatTime12(ev.time)}`}
                    </p>
                  )}
                  {ev.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{ev.venue}</p>}
                  {evClosed && <p className="mt-1 text-sm" style={{ color: "var(--event-primary)" }}>RSVP closed for this event.</p>}
                </div>

                {evClosed ? (
                  <p style={{ color: "var(--event-muted)" }}>Responses are no longer being accepted.</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="guest-eyebrow block mb-2">Will you attend?</label>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => update(ev.id, { status: "attending" })}
                          className={s.status === "attending" ? "event-btn-primary flex-1" : "event-btn-secondary flex-1"}>
                          Joyfully Accept
                        </button>
                        <button type="button" onClick={() => update(ev.id, { status: "declined" })}
                          className={s.status === "declined" ? "event-btn-primary flex-1" : "event-btn-secondary flex-1"}>
                          Regretfully Decline
                        </button>
                      </div>
                    </div>

                    {s.status === "attending" && (
                      <>
                        <div>
                          <label className="guest-eyebrow block mb-2">Number of plus-ones</label>
                          <input type="number" min={0} max={10} value={s.plusOnes}
                            onChange={(e) => update(ev.id, { plusOnes: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="event-input" />
                        </div>
                        {s.plusOnes > 0 && (
                          <div>
                            <label className="guest-eyebrow block mb-2">Plus-one names</label>
                            <input type="text" value={s.plusOneNames}
                              onChange={(e) => update(ev.id, { plusOneNames: e.target.value })}
                              placeholder="Comma-separated names" className="event-input" />
                          </div>
                        )}
                      </>
                    )}

                    <div>
                      <label className="guest-eyebrow block mb-2">Message</label>
                      <textarea rows={3} value={s.message}
                        onChange={(e) => update(ev.id, { message: e.target.value })}
                        placeholder="Leave a message…" className="event-input" />
                    </div>

                    <button type="button" onClick={() => saveMutation.mutate(ev.id)}
                      disabled={saveMutation.isPending || !s.status}
                      className="event-btn-primary w-full"
                      style={{ opacity: saveMutation.isPending || !s.status ? 0.6 : 1 }}>
                      {saveMutation.isPending ? "Saving…" : "Save Response"}
                    </button>
                    {saveMutation.isSuccess && !submitError && (
                      <p className="text-center text-sm" style={{ color: "var(--event-muted)" }}>Saved!</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <a href={`/e/${slug}/home`} className="text-sm hover:underline" style={{ color: "var(--event-muted)" }}>Back to home</a>
        </div>
      </div>
    </section>
  );
}
