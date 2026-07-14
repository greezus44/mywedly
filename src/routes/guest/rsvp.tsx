import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useGuestOutletContext } from "./guest-layout";
import { formatDate, formatTime12, isRsvpClosed } from "../../lib/utils";

interface RsvpFormState {
  status: "attending" | "declined" | "";
  plusOneNames: string;
  message: string;
}

export default function GuestRsvp() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();

  // Fetch the sub-events this guest is invited to
  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["guest-sub-events", event.id, invitedSubEventIds],
    queryFn: async () => {
      if (invitedSubEventIds.length === 0) return [] as SubEvent[];
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

  // Fetch existing RSVPs for this guest
  const { data: existingRsvps } = useQuery({
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
    enabled: !!guest,
  });

  // Build per-sub-event form state from existing RSVPs
  const [forms, setForms] = useState<Record<string, RsvpFormState>>({});

  useEffect(() => {
    if (!subEvents) return;
    const next: Record<string, RsvpFormState> = {};
    for (const se of subEvents) {
      const existing = (existingRsvps ?? []).find((r) => r.sub_event_id === se.id);
      next[se.id] = {
        status: (existing?.status as "attending" | "declined") ?? "",
        plusOneNames: (existing?.plus_one_names ?? []).join(", "),
        message: existing?.message ?? "",
      };
    }
    setForms(next);
  }, [subEvents, existingRsvps]);

  const saveMutation = useMutation({
    mutationFn: async ({ subEventId, form }: { subEventId: string; form: RsvpFormState }) => {
      if (!guest) throw new Error("Not signed in");
      const subEvent = subEvents?.find((s) => s.id === subEventId);
      const plusOneNames = form.plusOneNames
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      const payload = {
        event_id: event.id,
        guest_id: guest.id,
        guest_name: guest.name,
        sub_event_id: subEventId,
        status: form.status,
        plus_ones: plusOneNames.length,
        plus_one_names: plusOneNames,
        message: form.message || null,
        submitted_at: new Date().toISOString(),
        responded_at: new Date().toISOString(),
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
    },
  });

  const [savedId, setSavedId] = useState<string | null>(null);

  const events = useMemo(() => subEvents ?? [], [subEvents]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <section className="guest-section text-center">
        <div className="mx-auto max-w-md">
          <h1 className="guest-title mb-2">RSVP</h1>
          <p className="guest-subtitle">There are no Events to RSVP to at this time. Please check back later.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="guest-eyebrow">Your Response</p>
          <h1 className="guest-title">RSVP</h1>
          <p className="guest-subtitle mx-auto">Let us know which Events you'll be attending, {guest?.name ?? "guest"}.</p>
        </div>

        <div className="space-y-6">
          {events.map((se) => {
            const form = forms[se.id] ?? { status: "", plusOneNames: "", message: "" };
            const closed = isRsvpClosed(se.rsvp_deadline);
            const saved = savedId === se.id;
            return (
              <div key={se.id} className="event-card">
                <div className="mb-4">
                  <h2 className="text-xl font-bold" style={{ color: "var(--event-heading)" }}>{se.name}</h2>
                  {(se.date || se.time) && (
                    <p className="text-sm" style={{ color: "var(--event-muted)" }}>
                      {formatDate(se.date)}{se.time ? ` · ${formatTime12(se.start_time || se.time)}` : ""}
                    </p>
                  )}
                  {se.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{se.venue}</p>}
                  {se.rsvp_enabled === false && (
                    <p className="mt-1 text-xs" style={{ color: "var(--event-muted)" }}>RSVP is not required for this Event.</p>
                  )}
                </div>

                {closed ? (
                  <p className="text-sm" style={{ color: "var(--event-muted)" }}>RSVP for this Event has closed.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setForms((f) => ({ ...f, [se.id]: { ...form, status: "attending" } }))}
                        className="event-btn-primary flex-1"
                        style={{
                          opacity: form.status === "attending" ? 1 : 0.5,
                          outline: form.status === "attending" ? "2px solid var(--event-primary)" : "none",
                        }}
                      >
                        Attending
                      </button>
                      <button
                        type="button"
                        onClick={() => setForms((f) => ({ ...f, [se.id]: { ...form, status: "declined" } }))}
                        className="event-btn-secondary flex-1"
                        style={{
                          opacity: form.status === "declined" ? 1 : 0.5,
                          outline: form.status === "declined" ? "2px solid var(--event-primary)" : "none",
                        }}
                      >
                        Decline
                      </button>
                    </div>

                    {form.status === "attending" && (
                      <div>
                        <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                          Plus one names (comma separated)
                        </label>
                        <input
                          type="text"
                          value={form.plusOneNames}
                          onChange={(e) => setForms((f) => ({ ...f, [se.id]: { ...form, plusOneNames: e.target.value } }))}
                          className="event-input"
                          placeholder="e.g. Jane Doe, John Doe"
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                        Message (optional)
                      </label>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForms((f) => ({ ...f, [se.id]: { ...form, message: e.target.value } }))}
                        className="event-input"
                        rows={3}
                        placeholder="Leave a note for the hosts..."
                      />
                    </div>

                    <button
                      type="button"
                      disabled={!form.status || saveMutation.isPending}
                      onClick={() => {
                        saveMutation.mutate(
                          { subEventId: se.id, form },
                          {
                            onSuccess: () => {
                              setSavedId(se.id);
                              setTimeout(() => setSavedId((id) => (id === se.id ? null : id)), 2500);
                            },
                          },
                        );
                      }}
                      className="event-btn-primary w-full"
                      style={{ opacity: !form.status || saveMutation.isPending ? 0.6 : 1 }}
                    >
                      {saveMutation.isPending ? "Saving..." : "Save Response"}
                    </button>

                    {saveMutation.isError && saveMutation.variables?.subEventId === se.id && (
                      <p className="text-center text-sm" style={{ color: "var(--event-primary)" }}>
                        {(saveMutation.error as Error)?.message ?? "Failed to save. Please try again."}
                      </p>
                    )}
                    {saved && <p className="text-center text-sm" style={{ color: "var(--event-muted)" }}>Saved — thank you!</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
