import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDate, formatTime12, isRsvpClosed } from "../../lib/utils";

type Status = "attending" | "not_attending" | "pending";

export default function GuestRsvp() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<Status>("pending");
  const [plusOne, setPlusOne] = useState(false);
  const [plusOneNames, setPlusOneNames] = useState("");
  const [message, setMessage] = useState("");
  const [responses, setResponses] = useState<Record<string, Status>>({});
  const [saved, setSaved] = useState(false);

  // Fetch the Events the guest is invited to
  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["guest-sub-events", event.id, invitedSubEventIds],
    enabled: invitedSubEventIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .in("id", invitedSubEventIds)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
  });

  // Fetch existing RSVPs for this guest
  const { data: existingRsvps } = useQuery({
    queryKey: ["guest-rsvps", event.id, guest?.id],
    enabled: !!guest,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("guest_id", guest!.id);
      if (error) throw error;
      return (data ?? []) as EventRsvp[];
    },
  });

  // Initialize form from existing RSVPs
  useEffect(() => {
    if (!existingRsvps) return;
    const bySub: Record<string, Status> = {};
    let overall: Status = "pending";
    let hasPlusOne = false;
    let names: string[] = [];
    let msg = "";
    for (const r of existingRsvps) {
      if (r.sub_event_id) {
        bySub[r.sub_event_id] = r.status;
      } else {
        overall = r.status;
        hasPlusOne = r.plus_one;
        names = r.plus_one_names ?? [];
        msg = r.message ?? "";
      }
    }
    setStatus(overall);
    setResponses(bySub);
    setPlusOne(hasPlusOne);
    setPlusOneNames(names.join(", "));
    setMessage(msg);
  }, [existingRsvps]);

  const rsvpClosed = isRsvpClosed(event.rsvp_deadline);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!guest) throw new Error("Not signed in");
      const names = plusOne
        ? plusOneNames.split(",").map((n) => n.trim()).filter(Boolean)
        : [];
      const rows: Array<{
        event_id: string;
        guest_id: string;
        guest_name: string;
        sub_event_id: string | null;
        status: string;
        plus_one: boolean;
        plus_one_names: string[];
        message: string | null;
      }> = (subEvents ?? []).map((se) => ({
        event_id: event.id,
        guest_id: guest.id,
        guest_name: guest.name,
        sub_event_id: se.id,
        status: responses[se.id] ?? status,
        plus_one: plusOne,
        plus_one_names: names,
        message: message || null,
      }));
      // If no sub-events, save a single overall row
      if (rows.length === 0) {
        rows.push({
          event_id: event.id,
          guest_id: guest.id,
          guest_name: guest.name,
          sub_event_id: null,
          status,
          plus_one: plusOne,
          plus_one_names: names,
          message: message || null,
        });
      }
      // Upsert: delete existing then insert
      const { error: delError } = await supabase
        .from("event_rsvps")
        .delete()
        .eq("event_id", event.id)
        .eq("guest_id", guest.id);
      if (delError) throw delError;
      const { error: insError } = await supabase
        .from("event_rsvps")
        .insert(rows);
      if (insError) throw insError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id, guest?.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading) {
    return (
      <section className="guest-section text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} />
      </section>
    );
  }

  const hasInvitedEvents = (subEvents ?? []).length > 0;

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-xl">
        <p className="guest-eyebrow text-center">RSVP</p>
        <h1 className="guest-title mb-2 text-center">Will you join us?</h1>
        <p className="guest-subtitle mb-8 text-center">Let us know if you'll be attending{hasInvitedEvents ? " and which Events you'll join" : ""}.</p>

        {rsvpClosed && (
          <p className="mb-6 text-center text-sm" style={{ color: "var(--event-primary)" }}>
            The RSVP deadline ({formatDate(event.rsvp_deadline)}) has passed, but you may still update your response below.
          </p>
        )}

        <div className="event-card space-y-6">
          {/* Per-Event responses */}
          {hasInvitedEvents && (
            <div className="space-y-4">
              {(subEvents ?? []).map((se) => (
                <div key={se.id}>
                  <p className="mb-1 text-sm font-semibold" style={{ color: "var(--event-heading)" }}>{se.name}</p>
                  <p className="mb-2 text-xs" style={{ color: "var(--event-muted)" }}>
                    {formatDate(se.start_date)}{se.start_time ? ` · ${formatTime12(se.start_time)}` : ""}
                    {se.venue ? ` · ${se.venue}` : ""}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setResponses((p) => ({ ...p, [se.id]: "attending" }))}
                      className="event-btn-primary flex-1"
                      style={{ opacity: (responses[se.id] ?? status) === "attending" ? 1 : 0.5 }}
                    >
                      Attending
                    </button>
                    <button
                      type="button"
                      onClick={() => setResponses((p) => ({ ...p, [se.id]: "not_attending" }))}
                      className="event-btn-secondary flex-1"
                      style={{ opacity: (responses[se.id] ?? status) === "not_attending" ? 1 : 0.5 }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Overall response when no sub-events */}
          {!hasInvitedEvents && (
            <div>
              <p className="guest-eyebrow mb-2">Your response</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("attending")}
                  className="event-btn-primary flex-1"
                  style={{ opacity: status === "attending" ? 1 : 0.5 }}
                >
                  Attending
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("not_attending")}
                  className="event-btn-secondary flex-1"
                  style={{ opacity: status === "not_attending" ? 1 : 0.5 }}
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Plus one */}
          {guest?.plus_one_allowed && (
            <div>
              <label className="flex items-center gap-2 text-sm" style={{ color: "var(--event-text)" }}>
                <input type="checkbox" checked={plusOne} onChange={(e) => setPlusOne(e.target.checked)} className="rounded" />
                Bringing a plus one
              </label>
              {plusOne && (
                <input
                  type="text"
                  value={plusOneNames}
                  onChange={(e) => setPlusOneNames(e.target.value)}
                  className="event-input mt-2"
                  placeholder="Plus one names (comma separated)"
                />
              )}
            </div>
          )}

          {/* Message */}
          <div>
            <label className="guest-eyebrow mb-1 block">Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="event-input min-h-[80px]"
              placeholder="Leave a note for the host…"
            />
          </div>

          {saveMutation.isError && (
            <p className="text-sm" style={{ color: "var(--event-primary)" }}>
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save RSVP."}
            </p>
          )}
          {saved && <p className="text-sm" style={{ color: "var(--event-muted)" }}>Thank you! Your RSVP has been saved.</p>}

          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="event-btn-primary w-full"
            style={{ opacity: saveMutation.isPending ? 0.6 : 1 }}
          >
            {saveMutation.isPending ? "Saving…" : "Submit RSVP"}
          </button>
        </div>
      </div>
    </section>
  );
}
