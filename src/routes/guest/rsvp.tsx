import { useState } from "react";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { formatDate, formatTime12, isRsvpClosed } from "../../lib/utils";

interface RsvpFormState {
  status: "pending" | "attending" | "not_attending";
  plus_ones: number;
  dietary: string;
  message: string;
}

export default function GuestRsvp() {
  const { event, invitedSubEventIds } = useGuestOutletContext();
  const { guestId, guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [forms, setForms] = useState<Record<string, RsvpFormState>>({});
  const [savedEvents, setSavedEvents] = useState<Set<string>>(new Set());

  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["guest-rsvp-sub-events", event.id, invitedSubEventIds],
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

  const { data: existingRsvps } = useQuery({
    queryKey: ["guest-rsvps", event.id, guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("guest_id", guestId!);
      if (error) throw error;
      return data as EventRsvp[];
    },
    enabled: !!guestId,
  });

  const submitRsvp = useMutation({
    mutationFn: async ({ subEventId, form }: { subEventId: string; form: RsvpFormState }) => {
      const existing = existingRsvps?.find((r) => r.sub_event_id === subEventId);
      const payload = {
        event_id: event.id,
        guest_id: guestId!,
        guest_name: guestName!,
        status: form.status,
        plus_ones: form.plus_ones,
        dietary: form.dietary,
        message: form.message,
        submitted_at: new Date().toISOString(),
        sub_event_id: subEventId,
      };
      if (existing) {
        const { error } = await supabase.from("event_rsvps").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_, { subEventId }) => {
      setSavedEvents((prev) => new Set(prev).add(subEventId));
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id, guestId] });
    },
  });

  const getForm = (subEventId: string): RsvpFormState => {
    if (forms[subEventId]) return forms[subEventId];
    const existing = existingRsvps?.find((r) => r.sub_event_id === subEventId);
    return {
      status: (existing?.status as RsvpFormState["status"]) || "pending",
      plus_ones: existing?.plus_ones || 0,
      dietary: existing?.dietary || "",
      message: existing?.message || "",
    };
  };

  const setForm = (subEventId: string, patch: Partial<RsvpFormState>) => {
    setForms((prev) => ({ ...prev, [subEventId]: { ...getForm(subEventId), ...patch } }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-event-primary border-t-transparent" />
      </div>
    );
  }

  if (!subEvents || subEvents.length === 0) {
    return (
      <section className="guest-section text-center">
        <p className="guest-eyebrow">RSVP</p>
        <h1 className="guest-title">No Events to RSVP</h1>
        <p className="guest-subtitle mx-auto">There are no events requiring your RSVP at this time.</p>
      </section>
    );
  }

  return (
    <div>
      <section className="guest-section-tight text-center">
        <p className="guest-eyebrow">RSVP</p>
        <h1 className="guest-title">Will You Join Us?</h1>
        <p className="guest-subtitle mx-auto">Please let us know if you'll be attending each event.</p>
      </section>

      <section className="guest-section-tight space-y-6">
        {subEvents.map((sub, i) => {
          const closed = isRsvpClosed(sub.rsvp_deadline);
          const form = getForm(sub.id);
          const saved = savedEvents.has(sub.id);
          return (
            <div key={sub.id} className="event-card animate-slideUpStagger" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">{sub.name}</h2>
                {sub.date && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{formatDate(sub.date)}</p>}
                {sub.time && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{formatTime12(sub.time)}</p>}
                {sub.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{sub.venue}</p>}
              </div>

              {closed ? (
                <p className="text-sm text-red-600">RSVP for this event has closed.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Will you attend?</label>
                    <div className="flex gap-3">
                      {(["attending", "not_attending"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setForm(sub.id, { status: s })}
                          className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                            form.status === s
                              ? "border-event-primary bg-event-primary text-event-primary-fg"
                              : "border-event-border hover:border-event-primary"
                          }`}
                          style={form.status === s ? {} : { color: "var(--event-text)" }}
                        >
                          {s === "attending" ? "Will Attend" : "Cannot Attend"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.status === "attending" && (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-medium">Plus Ones</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={form.plus_ones}
                          onChange={(e) => setForm(sub.id, { plus_ones: parseInt(e.target.value) || 0 })}
                          className="event-input"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">Dietary Requirements</label>
                        <input
                          type="text"
                          value={form.dietary}
                          onChange={(e) => setForm(sub.id, { dietary: e.target.value })}
                          className="event-input"
                          placeholder="Any allergies or preferences?"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium">Message (optional)</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm(sub.id, { message: e.target.value })}
                      className="event-input"
                      rows={3}
                      placeholder="Leave a message for the host..."
                    />
                  </div>

                  <button
                    onClick={() => submitRsvp.mutate({ subEventId: sub.id, form })}
                    disabled={form.status === "pending" || submitRsvp.isPending}
                    className="event-btn-primary disabled:opacity-50"
                  >
                    {submitRsvp.isPending ? "Saving..." : "Submit RSVP"}
                  </button>

                  {saved && <p className="text-sm text-green-600 animate-fadeIn">RSVP saved successfully!</p>}
                  {submitRsvp.isError && <p className="text-sm text-red-600">Failed to save. Please try again.</p>}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
