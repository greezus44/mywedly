import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useGuestOutletContext } from "./guest-layout";
import { LoadingSpinner } from "../../components/ui";
import { formatDateShort, formatTime12, isRsvpClosed } from "../../lib/utils";
import { cn } from "../../lib/utils";

export default function GuestRsvpPage() {
  const { event, invitedSubEventIds } = useGuestOutletContext();
  const { guest } = useGuestAuth();

  const queryClient = useQueryClient();
  const isDeadlineClosed = isRsvpClosed(event.rsvp_deadline);

  const { data: subEvents, isLoading: seLoading } = useQuery({
    queryKey: ["guest-sub-events", event.id, invitedSubEventIds],
    queryFn: async () => {
      if (invitedSubEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .in("id", invitedSubEventIds)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
    enabled: invitedSubEventIds.length > 0,
  });

  const { data: existingRsvps, isLoading: rsvpLoading } = useQuery({
    queryKey: ["my-rsvps", guest?.id, event.id],
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

  if (!guest) return null;
  if (seLoading || rsvpLoading) {
    return <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--event-bg)" }}><LoadingSpinner /></div>;
  }

  if (invitedSubEventIds.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center" style={{ backgroundColor: "var(--event-bg)" }}>
        <h1 className="guest-title mb-2">RSVP</h1>
        <p style={{ color: "var(--event-muted)" }}>You don't have any pending RSVPs.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-12" style={{ backgroundColor: "var(--event-bg)" }}>
      <div className="mx-auto max-w-lg">
        <h1 className="guest-title mb-2 text-center">RSVP</h1>
        {isDeadlineClosed && (
          <p className="mb-6 text-center text-sm" style={{ color: "var(--event-muted)" }}>
            The RSVP deadline has passed.
          </p>
        )}

        <div className="space-y-4 mt-6">
          {(subEvents ?? []).map((se) => {
            const existing = (existingRsvps ?? []).find((r) => r.sub_event_id === se.id);
            return (
              <RsvpCard
                key={se.id}
                subEvent={se}
                guestId={guest.id}
                eventId={event.id}
                existing={existing ?? null}
                disabled={isDeadlineClosed}
                onSaved={() => queryClient.invalidateQueries({ queryKey: ["my-rsvps", guest.id, event.id] })}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface RsvpCardProps {
  subEvent: SubEvent;
  guestId: string;
  eventId: string;
  existing: EventRsvp | null;
  disabled: boolean;
  onSaved: () => void;
}

function RsvpCard({ subEvent, guestId, eventId, existing, disabled, onSaved }: RsvpCardProps) {
  const [status, setStatus] = useState<"attending" | "declined">(
    (existing?.status as "attending" | "declined") ?? "attending",
  );
  const [plusOneCount, setPlusOneCount] = useState(existing?.plus_one_count ?? 0);
  const [plusOneNames, setPlusOneNames] = useState<string[]>(existing?.plus_one_names ?? []);
  const [message, setMessage] = useState(existing?.message ?? "");
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        event_id: eventId,
        guest_id: guestId,
        sub_event_id: subEvent.id,
        status,
        plus_one_count: plusOneCount,
        plus_one_names: plusOneNames,
        message: message || null,
        updated_at: new Date().toISOString(),
      };
      if (existing) {
        const { error } = await supabase.from("event_rsvps").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      onSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function updatePlusOneName(idx: number, val: string) {
    setPlusOneNames((prev) => {
      const arr = [...prev];
      arr[idx] = val;
      return arr;
    });
  }

  function handlePlusOneCountChange(n: number) {
    const count = Math.max(0, n);
    setPlusOneCount(count);
    setPlusOneNames((prev) => {
      const arr = [...prev];
      while (arr.length < count) arr.push("");
      return arr.slice(0, count);
    });
  }

  return (
    <div className="event-card">
      <h2 className="guest-title text-xl mb-1">{subEvent.name}</h2>
      <div className="text-sm mb-4" style={{ color: "var(--event-muted)" }}>
        {subEvent.event_date && <span>{formatDateShort(subEvent.event_date)}</span>}
        {subEvent.event_time && <span> at {formatTime12(subEvent.event_time)}</span>}
        {subEvent.venue && <span> · {subEvent.venue}</span>}
      </div>

      {/* Attending / Declined */}
      <div className="flex gap-3 mb-4">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setStatus("attending")}
          className={cn(
            "flex-1 rounded py-2 text-sm font-medium transition-colors border",
            status === "attending"
              ? "border-transparent text-[var(--event-primary-fg)]"
              : "border-[var(--event-border)] text-[var(--event-text)]",
          )}
          style={status === "attending" ? { backgroundColor: "var(--event-primary)", borderColor: "var(--event-primary)" } : {}}
        >
          Attending
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setStatus("declined")}
          className={cn(
            "flex-1 rounded py-2 text-sm font-medium transition-colors border",
            status === "declined"
              ? "border-transparent bg-red-500 text-white"
              : "border-[var(--event-border)] text-[var(--event-text)]",
          )}
        >
          Declined
        </button>
      </div>

      {/* Plus ones */}
      {status === "attending" && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <label className="text-sm" style={{ color: "var(--event-text)" }}>Plus ones:</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={disabled || plusOneCount === 0}
                onClick={() => handlePlusOneCountChange(plusOneCount - 1)}
                className="h-7 w-7 rounded-full border border-[var(--event-border)] flex items-center justify-center text-sm disabled:opacity-40"
                style={{ color: "var(--event-text)" }}
              >−</button>
              <span className="w-4 text-center text-sm" style={{ color: "var(--event-text)" }}>{plusOneCount}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => handlePlusOneCountChange(plusOneCount + 1)}
                className="h-7 w-7 rounded-full border border-[var(--event-border)] flex items-center justify-center text-sm"
                style={{ color: "var(--event-text)" }}
              >+</button>
            </div>
          </div>
          {plusOneNames.map((name, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Guest ${i + 1} name`}
              value={name}
              disabled={disabled}
              onChange={(e) => updatePlusOneName(i, e.target.value)}
              className="event-input w-full"
            />
          ))}
        </div>
      )}

      {/* Message */}
      <textarea
        placeholder="Leave a message (optional)"
        value={message}
        disabled={disabled}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        className="event-input w-full mb-4 resize-none"
      />

      {mutation.isError && (
        <p className="text-sm text-red-500 mb-2">{(mutation.error as Error)?.message}</p>
      )}

      {!disabled && (
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="event-btn-primary w-full"
        >
          {mutation.isPending ? "Saving…" : saved ? "Saved!" : "Confirm RSVP"}
        </button>
      )}
    </div>
  );
}
