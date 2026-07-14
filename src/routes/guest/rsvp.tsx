import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type EventRsvp, type Json } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatTime12, formatDate } from "../../lib/utils";

type RsvpStatus = "attending" | "not_attending" | "no_response";

interface RsvpRow {
  id?: string;
  status: RsvpStatus;
  plus_one: boolean;
  plus_one_names: string[];
  message: string | null;
  sub_event_id: string;
}

export default function GuestRsvp() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();

  // Fetch invited sub-events
  const { data: subEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["guest-sub-events", event.id, invitedSubEventIds],
    queryFn: async () => {
      if (invitedSubEventIds.length === 0) return [] as SubEvent[];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .in("id", invitedSubEventIds)
        .order("start_time", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
    enabled: invitedSubEventIds.length > 0,
  });

  // Fetch existing RSVPs for this guest
  const { data: existingRsvps, isLoading: rsvpsLoading } = useQuery({
    queryKey: ["guest-rsvps", event.id, guest?.id],
    queryFn: async () => {
      if (!guest) return [] as EventRsvp[];
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

  // Build RSVP state from existing data
  const events = subEvents ?? [];
  const rsvpBySubEvent = new Map<string, EventRsvp | undefined>();
  for (const r of existingRsvps ?? []) {
    const subId = (r as unknown as { sub_event_id?: string }).sub_event_id;
    if (subId) rsvpBySubEvent.set(subId, r);
  }

  const [statuses, setStatuses] = useState<Record<string, RsvpStatus>>({});
  const [plusOneNames, setPlusOneNames] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (existingRsvps) {
      const newStatuses: Record<string, RsvpStatus> = {};
      const newPlusOneNames: Record<string, string> = {};
      const newMessages: Record<string, string> = {};
      for (const sub of events) {
        const existing = rsvpBySubEvent.get(sub.id);
        if (existing) {
          newStatuses[sub.id] = (existing.status as RsvpStatus) || "no_response";
          newPlusOneNames[sub.id] = (existing.plus_one_names ?? []).join(", ");
          newMessages[sub.id] = existing.message ?? "";
        } else {
          newStatuses[sub.id] = "no_response";
        }
      }
      setStatuses(newStatuses);
      setPlusOneNames(newPlusOneNames);
      setMessages(newMessages);
    }
  }, [existingRsvps, events]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!guest) throw new Error("Not authenticated");
      for (const sub of events) {
        const status = statuses[sub.id];
        if (!status || status === "no_response") continue;
        const existing = rsvpBySubEvent.get(sub.id);
        const payload = {
          event_id: event.id,
          guest_id: guest.id,
          guest_name: guest.name,
          sub_event_id: sub.id,
          status,
          plus_ones: status === "attending" ? 1 : 0,
          plus_one_names: status === "attending"
            ? plusOneNames[sub.id]?.split(",").map((s) => s.trim()).filter(Boolean) ?? []
            : [],
          message: messages[sub.id] ?? null,
          submitted_at: new Date().toISOString(),
          responded_at: new Date().toISOString(),
        };
        if (existing) {
          const { error } = await supabase.from("event_rsvps").update(payload).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("event_rsvps").insert(payload);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id, guest?.id] });
      setSavedMsg("Your RSVP has been saved. Thank you!");
      setTimeout(() => setSavedMsg(null), 4000);
    },
  });

  if (eventsLoading || rsvpsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <section className="guest-section text-center">
        <div className="mx-auto max-w-md">
          <h1 className="guest-title mb-4">RSVP</h1>
          <p className="guest-subtitle">There are no Events to RSVP to at this time.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <p className="guest-eyebrow">Kindly Respond</p>
          <h1 className="guest-title">RSVP</h1>
          <p className="guest-subtitle mx-auto">Let us know which Events you'll be attending.</p>
        </div>

        {savedMsg && (
          <div className="event-card mb-6 text-center" style={{ borderColor: "var(--event-primary)" }}>
            <p style={{ color: "var(--event-primary)" }}>{savedMsg}</p>
          </div>
        )}

        <div className="space-y-6">
          {events.map((sub) => {
            const status = statuses[sub.id] ?? "no_response";
            return (
              <div key={sub.id} className="event-card">
                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-1" style={{ color: "var(--event-heading)" }}>{sub.name}</h2>
                  {sub.start_time && (
                    <p className="text-sm" style={{ color: "var(--event-muted)" }}>
                      {formatTime12(sub.start_time)}
                      {sub.end_time ? ` – ${formatTime12(sub.end_time)}` : ""}
                    </p>
                  )}
                  {sub.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{sub.venue}</p>}
                </div>

                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setStatuses((s) => ({ ...s, [sub.id]: "attending" }))}
                    className="event-btn-primary flex-1"
                    style={status === "attending" ? {} : { opacity: 0.5, backgroundColor: "transparent", color: "var(--event-primary)", border: "1px solid var(--event-border)" }}
                  >
                    Attending
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatuses((s) => ({ ...s, [sub.id]: "not_attending" }))}
                    className="event-btn-primary flex-1"
                    style={status === "not_attending" ? {} : { opacity: 0.5, backgroundColor: "transparent", color: "var(--event-primary)", border: "1px solid var(--event-border)" }}
                  >
                    Decline
                  </button>
                </div>

                {status === "attending" && (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-muted)" }}>
                        Plus one names (optional, comma-separated)
                      </label>
                      <input
                        type="text"
                        value={plusOneNames[sub.id] ?? ""}
                        onChange={(e) => setPlusOneNames((p) => ({ ...p, [sub.id]: e.target.value }))}
                        className="event-input"
                        placeholder="e.g. Jane Doe"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-muted)" }}>
                    Message (optional)
                  </label>
                  <textarea
                    value={messages[sub.id] ?? ""}
                    onChange={(e) => setMessages((m) => ({ ...m, [sub.id]: e.target.value }))}
                    className="event-input"
                    rows={2}
                    placeholder="Leave a note for the hosts..."
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="event-btn-primary"
            style={{ opacity: saveMutation.isPending ? 0.6 : 1 }}
          >
            {saveMutation.isPending ? "Saving..." : "Submit RSVP"}
          </button>
          {saveMutation.isError && (
            <p className="mt-3 text-sm" style={{ color: "var(--event-primary)" }}>
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save RSVP."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
