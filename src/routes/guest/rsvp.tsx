import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDate, formatTime12, isRsvpClosed } from "../../lib/utils";

export default function GuestRsvp() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();
  const base = `/e/${slug}`;

  // Fetch invited sub-events
  const { data: subEvents, isLoading: subsLoading } = useQuery({
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

  // Fetch existing RSVPs for this guest
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
    enabled: !!guest,
  });

  const rsvpBySubEvent = useMemo(() => {
    const map = new Map<string, EventRsvp>();
    for (const r of existingRsvps ?? []) {
      if (r.sub_event_id) map.set(r.sub_event_id, r);
    }
    return map;
  }, [existingRsvps]);

  const loading = subsLoading || rsvpsLoading;

  const saveMutation = useMutation({
    mutationFn: async (params: {
      subEventId: string;
      status: string;
      plusOneNames: string[];
      message: string;
    }) => {
      const existing = rsvpBySubEvent.get(params.subEventId);
      const payload = {
        event_id: event.id,
        guest_id: guest!.id,
        guest_name: guest!.name,
        status: params.status,
        plus_one_names: params.plusOneNames,
        message: params.message,
        sub_event_id: params.subEventId,
        responded_at: new Date().toISOString(),
      };
      if (existing) {
        const { data, error } = await supabase
          .from("event_rsvps")
          .update(payload)
          .eq("id", existing.id)
          .select("*")
          .maybeSingle();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("event_rsvps")
        .insert({ ...payload, submitted_at: new Date().toISOString() })
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id, guest?.id] });
    },
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="guest-section text-center">
        <p className="guest-subtitle">Please sign in to manage your RSVP.</p>
      </div>
    );
  }

  if (invitedSubEventIds.length === 0 || (subEvents ?? []).length === 0) {
    return (
      <div className="guest-section text-center">
        <h1 className="guest-title">RSVP</h1>
        <p className="guest-subtitle mx-auto">You are not invited to any Events yet. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="guest-section animate-fadeIn">
      <div className="mx-auto max-w-2xl">
        <h1 className="guest-title text-center">RSVP</h1>
        <p className="guest-subtitle text-center mb-8">Let us know if you can join us.</p>

        <div className="space-y-6">
          {(subEvents ?? []).map((sub) => {
            const existing = rsvpBySubEvent.get(sub.id);
            return (
              <RsvpCard
                key={sub.id}
                subEvent={sub}
                existing={existing}
                saving={saveMutation.isPending}
                onSave={(status, plusOneNames, message) =>
                  saveMutation.mutate({ subEventId: sub.id, status, plusOneNames, message })
                }
              />
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <a href={`${base}/home`} className="event-btn-secondary">Back to Home</a>
        </div>
      </div>
    </div>
  );
}

interface RsvpCardProps {
  subEvent: SubEvent;
  existing: EventRsvp | undefined;
  saving: boolean;
  onSave: (status: string, plusOneNames: string[], message: string) => void;
}

function RsvpCard({ subEvent, existing, saving, onSave }: RsvpCardProps) {
  const [status, setStatus] = useState(existing?.status ?? "");
  const [plusOneNames, setPlusOneNames] = useState<string[]>([]);
  const [plusOneInput, setPlusOneInput] = useState("");
  const [message, setMessage] = useState(existing?.message ?? "");
  const [saved, setSaved] = useState(false);

  const closed = isRsvpClosed(subEvent.rsvp_deadline);

  const handleAddPlusOne = () => {
    const name = plusOneInput.trim();
    if (!name) return;
    setPlusOneNames((prev) => [...prev, name]);
    setPlusOneInput("");
  };

  const handleSave = () => {
    if (!status) return;
    onSave(status, plusOneNames, message);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="event-card">
      <h2 className="mb-1 text-xl font-semibold" style={{ color: "var(--event-heading)" }}>
        {subEvent.name}
      </h2>
      {subEvent.date && (
        <p className="mb-3 text-sm" style={{ color: "var(--event-muted)" }}>
          {formatDate(subEvent.date)}
          {subEvent.start_time ? ` at ${formatTime12(subEvent.start_time)}` : ""}
        </p>
      )}
      {subEvent.venue && (
        <p className="mb-3 text-sm" style={{ color: "var(--event-muted)" }}>{subEvent.venue}</p>
      )}

      {closed ? (
        <p className="text-sm" style={{ color: "var(--event-primary)" }}>
          RSVP for this Event is now closed.
        </p>
      ) : (
        <>
          <div className="mb-4">
            <label className="guest-eyebrow mb-2 block">Will you attend?</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={status === "attending" ? "event-btn-primary flex-1" : "event-btn-secondary flex-1"}
                onClick={() => setStatus("attending")}
                disabled={saving}
              >
                Attending
              </button>
              <button
                type="button"
                className={status === "not_attending" ? "event-btn-primary flex-1" : "event-btn-secondary flex-1"}
                onClick={() => setStatus("not_attending")}
                disabled={saving}
              >
                Decline
              </button>
            </div>
          </div>

          {status === "attending" && (
            <div className="mb-4">
              <label className="guest-eyebrow mb-2 block">Plus ones</label>
              {plusOneNames.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {plusOneNames.map((name, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm" style={{ backgroundColor: "var(--event-surface-alt)" }}>
                      <span>{name}</span>
                      <button type="button" onClick={() => setPlusOneNames((prev) => prev.filter((_, idx) => idx !== i))} className="text-xs" style={{ color: "var(--event-primary)" }}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={plusOneInput}
                  onChange={(e) => setPlusOneInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddPlusOne(); } }}
                  placeholder="Plus one name"
                  className="event-input flex-1"
                  disabled={saving}
                />
                <button type="button" className="event-btn-secondary" onClick={handleAddPlusOne} disabled={saving}>Add</button>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="guest-eyebrow mb-2 block">Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave a note for the hosts…"
              className="event-input min-h-[80px] resize-y"
              disabled={saving}
            />
          </div>

          <button
            type="button"
            className="event-btn-primary w-full"
            onClick={handleSave}
            disabled={!status || saving}
          >
            {saving ? "Saving…" : "Submit RSVP"}
          </button>
          {saved && (
            <p className="mt-2 text-center text-sm" style={{ color: "var(--event-primary)" }}>
              Thank you! Your RSVP has been saved.
            </p>
          )}
        </>
      )}
    </div>
  );
}
