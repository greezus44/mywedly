import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDate, to12Hour, isRsvpClosed } from "../../lib/utils";

interface RsvpFormState {
  [subEventId: string]: {
    attending: boolean | null;
    plusOneNames: string[];
    message: string;
  };
}

export default function GuestRsvp() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();

  const { data: subEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["guest-sub-events", event.id, invitedSubEventIds],
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

  const { data: existingRsvps, isLoading: rsvpsLoading } = useQuery({
    queryKey: ["guest-rsvps", event.id, guest?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("guest_id", guest!.id);
      if (error) throw error;
      return (data ?? []) as EventRsvp[];
    },
    enabled: !!guest?.id,
  });

  const [formState, setFormState] = useState<RsvpFormState>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form state from existing RSVPs
  useEffect(() => {
    if (!existingRsvps || !subEvents) return;
    const state: RsvpFormState = {};
    for (const se of subEvents) {
      const existing = existingRsvps.find((r) => r.sub_event_id === se.id);
      state[se.id] = {
        attending: existing ? existing.status === "attending" : null,
        plusOneNames: existing?.plus_one_names ?? [],
        message: existing?.message ?? "",
      };
    }
    setFormState(state);
  }, [existingRsvps, subEvents]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!guest) throw new Error("Not authenticated");
      const rows = (subEvents ?? []).map((se) => {
        const fs = formState[se.id];
        const attending = fs?.attending === true;
        return {
          event_id: event.id,
          guest_id: guest.id,
          guest_name: guest.name,
          status: attending ? "attending" : "declined",
          plus_ones: attending ? (fs?.plusOneNames.length ?? 0) : 0,
          plus_one_names: attending ? (fs?.plusOneNames ?? []) : [],
          message: fs?.message ?? null,
          sub_event_id: se.id,
          responded_at: new Date().toISOString(),
        };
      });
      for (const row of rows) {
        const existing = existingRsvps?.find((r) => r.sub_event_id === row.sub_event_id);
        if (existing) {
          const { error } = await supabase.from("event_rsvps").update(row).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("event_rsvps").insert(row);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id, guest?.id] });
      setSubmitError(null);
    },
    onError: (err) => setSubmitError(err instanceof Error ? err.message : "Failed to save RSVP"),
  });

  const loading = eventsLoading || rsvpsLoading;
  const sortedEvents = useMemo(() => subEvents ?? [], [subEvents]);

  if (loading) {
    return (
      <section className="guest-section text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </section>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <section className="guest-section text-center">
        <div className="mx-auto max-w-md">
          <h1 className="guest-title">RSVP</h1>
          <p className="guest-subtitle">There are no Events to RSVP to at this time. Please check back later.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="guest-title">RSVP</h1>
          <p className="guest-subtitle mx-auto">Let us know which Events you'll be attending.</p>
        </div>

        {submitError && (
          <div className="mb-4 rounded-md p-3 text-sm" style={{ backgroundColor: "var(--event-surface-alt)", color: "var(--event-primary)" }}>
            {submitError}
          </div>
        )}

        <div className="space-y-6">
          {sortedEvents.map((se) => {
            const fs = formState[se.id] ?? { attending: null, plusOneNames: [], message: "" };
            const closed = isRsvpClosed(se.rsvp_deadline);
            return (
              <div key={se.id} className="event-card">
                <div className="mb-4">
                  <h2 className="text-xl font-bold" style={{ color: "var(--event-heading)" }}>{se.name}</h2>
                  {se.date && (
                    <p className="text-sm" style={{ color: "var(--event-muted)" }}>
                      {formatDate(se.date)}{se.start_time ? ` · ${to12Hour(se.start_time)}` : ""}
                    </p>
                  )}
                  {se.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{se.venue}</p>}
                  {closed && (
                    <p className="mt-1 text-xs" style={{ color: "var(--event-primary)" }}>
                      RSVP for this Event is closed.
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                    Will you attend?
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={closed}
                      onClick={() => setFormState((s) => ({ ...s, [se.id]: { ...fs, attending: true } }))}
                      className="event-btn-primary flex-1"
                      style={{ opacity: fs.attending === true ? 1 : 0.5, cursor: closed ? "not-allowed" : "pointer" }}
                    >
                      Attending
                    </button>
                    <button
                      type="button"
                      disabled={closed}
                      onClick={() => setFormState((s) => ({ ...s, [se.id]: { ...fs, attending: false, plusOneNames: [] } }))}
                      className="event-btn-secondary flex-1"
                      style={{ opacity: fs.attending === false ? 1 : 0.5, cursor: closed ? "not-allowed" : "pointer" }}
                    >
                      Decline
                    </button>
                  </div>
                </div>

                {fs.attending === true && !closed && (
                  <div className="mb-4 space-y-2">
                    <label className="block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                      Plus ones (names)
                    </label>
                    {fs.plusOneNames.map((name, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            const names = [...fs.plusOneNames];
                            names[idx] = e.target.value;
                            setFormState((s) => ({ ...s, [se.id]: { ...fs, plusOneNames: names } }));
                          }}
                          className="event-input"
                          placeholder={`Plus one #${idx + 1} name`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const names = fs.plusOneNames.filter((_, i) => i !== idx);
                            setFormState((s) => ({ ...s, [se.id]: { ...fs, plusOneNames: names } }));
                          }}
                          className="event-btn-secondary px-3"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormState((s) => ({ ...s, [se.id]: { ...fs, plusOneNames: [...fs.plusOneNames, ""] } }))}
                      className="event-btn-secondary"
                    >
                      + Add plus one
                    </button>
                  </div>
                )}

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                    Message (optional)
                  </label>
                  <textarea
                    value={fs.message}
                    disabled={closed}
                    onChange={(e) => setFormState((s) => ({ ...s, [se.id]: { ...fs, message: e.target.value } }))}
                    className="event-input min-h-[80px]"
                    placeholder="Leave a message for the host..."
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="event-btn-primary"
            style={{ opacity: saveMutation.isPending ? 0.6 : 1 }}
          >
            {saveMutation.isPending ? "Saving..." : saveMutation.isSuccess ? "Saved ✓" : "Submit RSVP"}
          </button>
        </div>
      </div>
    </section>
  );
}
