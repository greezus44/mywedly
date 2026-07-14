import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { isRsvpClosed, cn } from "../../lib/utils";

interface RsvpFormState {
  status: "yes" | "no" | "";
  plus_ones: number;
  dietary: string;
  message: string;
}

export default function GuestRsvp() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const { guestId, guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [savedId, setSavedId] = useState<string | null>(null);

  // Fetch invited sub-events
  const { data: subEvents = [], isLoading } = useQuery({
    queryKey: ["guest-rsvp-sub-events", event.id, invitedSubEventIds],
    queryFn: async () => {
      if (invitedSubEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .in("id", invitedSubEventIds)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: invitedSubEventIds.length > 0,
  });

  // Fetch existing RSVPs for this guest
  const { data: existingRsvps = [] } = useQuery({
    queryKey: ["guest-rsvps", event.id, guestId],
    queryFn: async () => {
      if (!guestId) return [];
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("guest_id", guestId);
      if (error) throw error;
      return data as EventRsvp[];
    },
    enabled: !!guestId,
  });

  const getExisting = (subEventId: string) =>
    existingRsvps.find((r) => r.sub_event_id === subEventId);

  const upsertMutation = useMutation({
    mutationFn: async (params: {
      subEventId: string;
      form: RsvpFormState;
      existingId?: string;
    }) => {
      const payload = {
        event_id: event.id,
        guest_id: guestId,
        guest_name: guestName,
        status: params.form.status,
        plus_ones: params.form.status === "yes" ? params.form.plus_ones : null,
        dietary: params.form.dietary || null,
        message: params.form.message || null,
        sub_event_id: params.subEventId,
        submitted_at: new Date().toISOString(),
      };

      if (params.existingId) {
        const { error } = await supabase
          .from("event_rsvps")
          .update(payload)
          .eq("id", params.existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id, guestId] });
      setSavedId(variables.subEventId);
      setTimeout(() => setSavedId(null), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="guest-section flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <section className="guest-section text-center">
        <p className="guest-eyebrow">RSVP</p>
        <h1 className="guest-title">Will You Join Us?</h1>
        <p className="guest-subtitle mx-auto">
          Please let us know your response for each event below.
        </p>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-2xl space-y-6">
          {subEvents.length === 0 ? (
            <div className="event-card text-center" style={{ color: "var(--event-muted)" }}>
              No events available for RSVP at this time.
            </div>
          ) : (
            subEvents.map((sub) => {
              const existing = getExisting(sub.id);
              const closed = isRsvpClosed(sub.rsvp_deadline);
              return (
                <RsvpCard
                  key={sub.id}
                  subEvent={sub}
                  existing={existing}
                  closed={closed}
                  saved={savedId === sub.id}
                  onSubmit={(form) =>
                    upsertMutation.mutate({
                      subEventId: sub.id,
                      form,
                      existingId: existing?.id,
                    })
                  }
                  submitting={upsertMutation.isPending}
                />
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function RsvpCard({
  subEvent,
  existing,
  closed,
  saved,
  onSubmit,
  submitting,
}: {
  subEvent: SubEvent;
  existing: EventRsvp | undefined;
  closed: boolean;
  saved: boolean;
  onSubmit: (form: RsvpFormState) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<RsvpFormState>({
    status: (existing?.status as "yes" | "no") || "",
    plus_ones: existing?.plus_ones ?? 0,
    dietary: existing?.dietary ?? "",
    message: existing?.message ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.status) return;
    onSubmit(form);
  };

  return (
    <div className="event-card animate-slideUpStagger">
      <div className="mb-4">
        <h3 className="text-xl font-semibold" style={{ color: "var(--event-heading)" }}>
          {subEvent.name}
        </h3>
        {subEvent.date && (
          <p className="text-sm" style={{ color: "var(--event-muted)" }}>
            {new Date(subEvent.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
        {subEvent.venue && (
          <p className="text-sm" style={{ color: "var(--event-muted)" }}>{subEvent.venue}</p>
        )}
      </div>

      {closed ? (
        <p className="text-sm" style={{ color: "var(--event-muted)" }}>
          RSVP for this event is now closed.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Attend / Decline buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, status: "yes" }))}
              className={cn(
                "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all",
                form.status === "yes" ? "scale-[1.02]" : "opacity-70 hover:opacity-100"
              )}
              style={{
                borderColor: form.status === "yes" ? "var(--event-primary)" : "var(--event-border)",
                backgroundColor: form.status === "yes" ? "var(--event-primary)" : "transparent",
                color: form.status === "yes" ? "var(--event-primary-fg)" : "var(--event-text)",
                borderRadius: "var(--event-radius)",
              }}
            >
              ✓ Will Attend
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, status: "no" }))}
              className={cn(
                "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all",
                form.status === "no" ? "scale-[1.02]" : "opacity-70 hover:opacity-100"
              )}
              style={{
                borderColor: form.status === "no" ? "var(--event-muted)" : "var(--event-border)",
                backgroundColor: form.status === "no" ? "var(--event-muted)" : "transparent",
                color: form.status === "no" ? "#fff" : "var(--event-text)",
                borderRadius: "var(--event-radius)",
              }}
            >
              ✕ Cannot Attend
            </button>
          </div>

          {form.status === "yes" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                Plus Ones
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={form.plus_ones}
                onChange={(e) => setForm((f) => ({ ...f, plus_ones: parseInt(e.target.value) || 0 }))}
                className="event-input"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
              Dietary Requirements
            </label>
            <input
              type="text"
              value={form.dietary}
              onChange={(e) => setForm((f) => ({ ...f, dietary: e.target.value }))}
              placeholder="Any allergies or special requirements"
              className="event-input"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
              Message
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Leave a message for the host"
              rows={3}
              className="event-input"
            />
          </div>

          <button
            type="submit"
            disabled={!form.status || submitting}
            className={cn("event-btn-primary w-full", (!form.status || submitting) && "opacity-60 cursor-not-allowed")}
          >
            {submitting ? "Saving…" : saved ? "✓ Saved!" : "Submit RSVP"}
          </button>
        </form>
      )}
    </div>
  );
}
