import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";

interface RsvpState {
  status: "attending" | "declined" | "";
  plusOnes: number;
  dietary: string;
  message: string;
}

export default function GuestRsvp() {
  const { event, theme, invitedSubEventIds } = useGuestOutletContext();
  const { guestId, name } = useGuestAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Invited sub-events
  const { data: subEvents = [] } = useQuery({
    queryKey: ["guest-sub-events", event.id, invitedSubEventIds],
    queryFn: async () => {
      if (invitedSubEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("event_id", event.id)
        .in("id", invitedSubEventIds)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
    enabled: invitedSubEventIds.length > 0,
  });

  // Existing RSVPs for this guest
  const { data: existing = [] } = useQuery({
    queryKey: ["guest-rsvps", event.id, guestId],
    queryFn: async () => {
      if (!guestId) return [];
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("guest_id", guestId);
      if (error) throw error;
      return (data ?? []) as EventRsvp[];
    },
    enabled: !!guestId,
  });

  // Per-event form state
  const [states, setStates] = useState<Record<string, RsvpState>>({});

  useEffect(() => {
    const next: Record<string, RsvpState> = {};
    for (const se of subEvents) {
      const ex = existing.find((r) => r.sub_event_id === se.id);
      next[se.id] = {
        status: (ex?.status as RsvpState["status"]) || "",
        plusOnes: ex?.plus_ones ?? 0,
        dietary: ex?.dietary ?? "",
        message: ex?.message ?? "",
      };
    }
    setStates(next);
  }, [subEvents, existing]);

  const upsertMutation = useMutation({
    mutationFn: async (subEventId: string) => {
      if (!guestId) throw new Error("Not signed in");
      const s = states[subEventId];
      if (!s || !s.status) throw new Error("Please choose attending or declined");
      const payload = {
        event_id: event.id,
        guest_id: guestId,
        guest_name: name ?? "Guest",
        sub_event_id: subEventId,
        status: s.status,
        plus_ones: s.plusOnes,
        dietary: s.dietary || null,
        message: s.message || null,
        submitted_at: new Date().toISOString(),
      };
      const { data: existingRow } = await supabase
        .from("event_rsvps")
        .select("id")
        .eq("event_id", event.id)
        .eq("guest_id", guestId)
        .eq("sub_event_id", subEventId)
        .maybeSingle();
      if (existingRow) {
        const { error } = await supabase.from("event_rsvps").update(payload).eq("id", existingRow.id);
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

  function update(seId: string, patch: Partial<RsvpState>) {
    setStates((prev) => ({ ...prev, [seId]: { ...prev[seId], ...patch } }));
  }

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-2xl">
        {/* Centered header */}
        <div className="mb-10 text-center">
          <p className="guest-eyebrow">RSVP</p>
          <h1 className="guest-title">Will you join us?</h1>
          <p className="guest-subtitle mx-auto">Let us know your plans for each event below.</p>
        </div>

        {subEvents.length === 0 ? (
          <div className="event-card text-center">
            <p style={{ color: theme.muted }}>There are no events for you to RSVP to yet. Please check back later.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {subEvents.map((se) => {
              const s = states[se.id] || { status: "", plusOnes: 0, dietary: "", message: "" };
              return (
                <div key={se.id} className="event-card animate-slideUpStagger">
                  <h2 className="mb-1" style={{ color: theme.heading, fontFamily: theme.fontHeading, fontSize: "1.5rem" }}>{se.name}</h2>
                  {se.description && <p className="mb-4 text-sm" style={{ color: theme.muted }}>{se.description}</p>}

                  {/* Attend / Decline */}
                  <div className="mb-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => update(se.id, { status: "attending" })}
                      className="flex-1 rounded-md border-2 px-4 py-2.5 text-sm font-semibold transition-all"
                      style={
                        s.status === "attending"
                          ? { backgroundColor: theme.primary, borderColor: theme.primary, color: theme.primaryFg }
                          : { borderColor: theme.border, color: theme.text }
                      }
                    >
                      ✓ Attending
                    </button>
                    <button
                      type="button"
                      onClick={() => update(se.id, { status: "declined" })}
                      className="flex-1 rounded-md border-2 px-4 py-2.5 text-sm font-semibold transition-all"
                      style={
                        s.status === "declined"
                          ? { backgroundColor: theme.muted, borderColor: theme.muted, color: theme.surface }
                          : { borderColor: theme.border, color: theme.text }
                      }
                    >
                      ✕ Decline
                    </button>
                  </div>

                  {/* Conditional fields when attending */}
                  {s.status === "attending" && (
                    <div className="space-y-4 animate-fadeIn">
                      <div>
                        <label className="mb-1 block text-sm font-medium" style={{ color: theme.heading }}>Plus ones</label>
                        <input
                          type="number"
                          min={0}
                          max={5}
                          value={s.plusOnes}
                          onChange={(e) => update(se.id, { plusOnes: Math.max(0, Number(e.target.value) || 0) })}
                          className="event-input"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium" style={{ color: theme.heading }}>Dietary notes</label>
                        <input
                          type="text"
                          value={s.dietary}
                          onChange={(e) => update(se.id, { dietary: e.target.value })}
                          placeholder="Allergies, preferences…"
                          className="event-input"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium" style={{ color: theme.heading }}>Message</label>
                        <textarea
                          value={s.message}
                          onChange={(e) => update(se.id, { message: e.target.value })}
                          rows={3}
                          placeholder="Leave a note for the hosts…"
                          className="event-input"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => upsertMutation.mutate(se.id)}
                    disabled={!s.status || upsertMutation.isPending}
                    className="event-btn-primary mt-5"
                    style={{ opacity: !s.status || upsertMutation.isPending ? 0.5 : 1 }}
                  >
                    {upsertMutation.isPending ? "Saving…" : "Save Response"}
                  </button>
                  {upsertMutation.error && (
                    <p className="mt-2 text-sm" style={{ color: "#dc2626" }}>
                      {upsertMutation.error instanceof Error ? upsertMutation.error.message : "Failed to save"}
                    </p>
                  )}
                  {upsertMutation.isSuccess && upsertMutation.variables === se.id && (
                    <p className="mt-2 text-sm" style={{ color: theme.primary }}>Saved!</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
