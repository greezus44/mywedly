import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useGuestOutletContext } from "./guest-layout";
import { LoadingSpinner, ErrorState } from "../../components/ui";
import { cn, formatDate, formatTime12, isRsvpClosed } from "../../lib/utils";

interface RsvpState {
  status: "attending" | "declined" | "";
  plus_ones: number;
  dietary: string;
  message: string;
}

export default function Rsvp(): React.ReactElement {
  const { event, invitedSubEventIds } = useGuestOutletContext();
  const { guestId, guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const { data: subEvents, isLoading, error } = useQuery({
    queryKey: ["guest-sub-events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
  });

  const { data: existingRsvps } = useQuery({
    queryKey: ["guest-rsvps", event.id, guestId],
    enabled: !!guestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("guest_id", guestId!);
      if (error) throw error;
      return (data ?? []) as EventRsvp[];
    },
  });

  const visibleSubEvents = (subEvents ?? []).filter(
    (s) => invitedSubEventIds.length === 0 || invitedSubEventIds.includes(s.id),
  );

  const [rsvps, setRsvps] = useState<Record<string, RsvpState>>({});

  useEffect(() => {
    if (visibleSubEvents.length > 0) {
      const initial: Record<string, RsvpState> = {};
      for (const sub of visibleSubEvents) {
        const existing = (existingRsvps ?? []).find((r) => r.sub_event_id === sub.id);
        initial[sub.id] = {
          status: (existing?.status as "attending" | "declined") || "",
          plus_ones: existing?.plus_ones ?? 0,
          dietary: existing?.dietary ?? "",
          message: existing?.message ?? "",
        };
      }
      setRsvps(initial);
    }
  }, [visibleSubEvents, existingRsvps]);

  const upsertMutation = useMutation({
    mutationFn: async (subEventId: string) => {
      const state = rsvps[subEventId];
      if (!state || !state.status || !guestId) return;
      const subEvent = visibleSubEvents.find((s) => s.id === subEventId);
      const existing = (existingRsvps ?? []).find((r) => r.sub_event_id === subEventId);
      const payload = {
        event_id: event.id,
        guest_id: guestId,
        guest_name: guestName ?? "",
        status: state.status,
        plus_ones: state.plus_ones,
        dietary: state.dietary || null,
        message: state.message || null,
        sub_event_id: subEventId,
        submitted_at: new Date().toISOString(),
      };
      if (existing) {
        const { error } = await supabase
          .from("event_rsvps")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id, guestId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="guest-section">
        <ErrorState message={error.message} />
      </div>
    );
  }

  if (visibleSubEvents.length === 0) {
    return (
      <div className="guest-section text-center">
        <p className="guest-eyebrow">RSVP</p>
        <h2 className="guest-title">No Events Available</h2>
        <p className="guest-subtitle mt-2 mx-auto">
          There are no events available for you to RSVP to at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-2xl text-center">
        <p className="guest-eyebrow">RSVP</p>
        <h2 className="guest-title">Will You Join Us?</h2>
        <p className="guest-subtitle mt-2 mx-auto">
          Please let us know if you'll be attending each event.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl space-y-6">
        {visibleSubEvents.map((sub, i) => {
          const state = rsvps[sub.id] || { status: "", plus_ones: 0, dietary: "", message: "" };
          const closed = isRsvpClosed(sub.rsvp_deadline);
          return (
            <div
              key={sub.id}
              className="event-card animate-slideUpStagger"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-event-heading">{sub.name}</h3>
                {sub.date && (
                  <p className="mt-1 text-sm text-event-muted">
                    {formatDate(sub.date)} {sub.start_time && `• ${formatTime12(sub.start_time)}`}
                  </p>
                )}
                {sub.venue && (
                  <p className="mt-1 text-sm text-event-muted">{sub.venue}</p>
                )}
              </div>

              {closed ? (
                <p className="text-sm text-event-muted">
                  RSVP for this event is now closed.
                </p>
              ) : (
                <>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setRsvps((prev) => ({
                          ...prev,
                          [sub.id]: { ...state, status: "attending" },
                        }))
                      }
                      className={cn(
                        "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-semibold uppercase tracking-wider transition",
                        state.status === "attending"
                          ? "border-event-primary bg-event-primary text-event-primary-fg"
                          : "border-event-border text-event-text hover:border-event-primary",
                      )}
                    >
                      Joyfully Accept
                    </button>
                    <button
                      onClick={() =>
                        setRsvps((prev) => ({
                          ...prev,
                          [sub.id]: { ...state, status: "declined" },
                        }))
                      }
                      className={cn(
                        "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-semibold uppercase tracking-wider transition",
                        state.status === "declined"
                          ? "border-event-primary bg-event-primary text-event-primary-fg"
                          : "border-event-border text-event-text hover:border-event-primary",
                      )}
                    >
                      Regretfully Decline
                    </button>
                  </div>

                  {state.status === "attending" && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                      <div>
                        <label className="block text-sm font-medium text-event-muted mb-1.5">
                          Plus Ones
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={state.plus_ones}
                          onChange={(e) =>
                            setRsvps((prev) => ({
                              ...prev,
                              [sub.id]: { ...state, plus_ones: Number(e.target.value) },
                            }))
                          }
                          className="event-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-event-muted mb-1.5">
                          Dietary Requirements
                        </label>
                        <textarea
                          value={state.dietary}
                          onChange={(e) =>
                            setRsvps((prev) => ({
                              ...prev,
                              [sub.id]: { ...state, dietary: e.target.value },
                            }))
                          }
                          className="event-input"
                          rows={2}
                          placeholder="Any allergies or dietary needs?"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-event-muted mb-1.5">
                      Message
                    </label>
                    <textarea
                      value={state.message}
                      onChange={(e) =>
                        setRsvps((prev) => ({
                          ...prev,
                          [sub.id]: { ...state, message: e.target.value },
                        }))
                      }
                      className="event-input"
                      rows={2}
                      placeholder="Leave a message..."
                    />
                  </div>

                  <button
                    onClick={() => upsertMutation.mutate(sub.id)}
                    disabled={!state.status || upsertMutation.isPending}
                    className="event-btn-primary mt-4 w-full disabled:opacity-50"
                  >
                    {upsertMutation.isPending ? "Saving…" : "Save RSVP"}
                  </button>
                  {upsertMutation.isError && (
                    <p className="mt-2 text-sm text-red-500">
                      Failed to save. Please try again.
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
