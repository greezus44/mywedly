import { useState, useEffect } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, CalendarClock, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { formatDate, formatTime, isRsvpClosed } from "../../lib/utils";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useGuestAuth } from "../../lib/guest-auth";
import { useGuestOutletContext } from "./guest-layout";

interface RsvpFormState {
  status: "attending" | "declined" | "pending";
  plus_ones: number;
  dietary: string;
  message: string;
}

/**
 * GuestRsvp — RSVP form. If sub-events exist, renders a form per sub-event
 * (filtered by ?sub= if present). Each RSVP is stored per sub_event_id in
 * event_rsvps. Shows a closed state when the deadline has passed.
 */
export default function GuestRsvp() {
  const { event } = useGuestOutletContext();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const filterSub = searchParams.get("sub");
  const headingFont: React.CSSProperties = { fontFamily: "var(--event-font-heading)" };

  const { data: subEvents = [], isLoading: subsLoading } = useQuery({
    queryKey: ["guest-sub-events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data as SubEvent[]) || [];
    },
  });

  const visibleSubs = filterSub ? subEvents.filter((s) => s.id === filterSub) : subEvents;

  if (subsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--event-bg)" }}>
        <div className="w-8 h-8 border-2 animate-spin rounded-full" style={{ borderColor: "var(--event-border)", borderTopColor: "var(--event-primary)" }} />
      </div>
    );
  }

  // If no sub-events, show a single event-level RSVP form
  if (visibleSubs.length === 0) {
    return (
      <div className="min-h-screen px-6 py-16" style={{ backgroundColor: "var(--event-bg)", color: "var(--event-text)" }}>
        <div className="max-w-lg mx-auto">
          <h1 className="text-4xl text-center mb-2" style={headingFont}>RSVP</h1>
          <p className="text-center text-sm mb-8" style={{ color: "var(--event-text-muted)" }}>
            {event.name}
          </p>
          <RsvpForm
            key="event-level"
            eventId={event.id}
            subEventId={null}
            title={event.name}
            deadline={event.rsvp_deadline}
            guestName={guestName}
            eventDate={event.event_date}
            eventTime={event.event_time}
            venue={event.venue}
            invalidate={() => queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id] })}
          />
        </div>
        <div className="text-center mt-8">
          <Link to="home" className="text-sm hover:underline" style={{ color: "var(--event-text-muted)" }}>← Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-16" style={{ backgroundColor: "var(--event-bg)", color: "var(--event-text)" }}>
      <div className="max-w-lg mx-auto">
        <h1 className="text-4xl text-center mb-2" style={headingFont}>RSVP</h1>
        <p className="text-center text-sm mb-10" style={{ color: "var(--event-text-muted)" }}>
          Please respond to each event
        </p>
        <div className="space-y-8">
          {visibleSubs.map((se) => (
            <RsvpForm
              key={se.id}
              eventId={event.id}
              subEventId={se.id}
              title={se.name}
              deadline={se.rsvp_deadline}
              guestName={guestName}
              eventDate={se.date}
              eventTime={se.time}
              venue={se.venue}
              invalidate={() => queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id] })}
            />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="home" className="text-sm hover:underline" style={{ color: "var(--event-text-muted)" }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}

/** Single RSVP form for one sub-event (or the event itself). */
function RsvpForm({
  eventId,
  subEventId,
  title,
  deadline,
  guestName,
  eventDate,
  eventTime,
  venue,
  invalidate,
}: {
  eventId: string;
  subEventId: string | null;
  title: string;
  deadline: string | null;
  guestName: string | null;
  eventDate: string | null;
  eventTime: string | null;
  venue: string | null;
  invalidate: () => void;
}) {
  const headingFont: React.CSSProperties = { fontFamily: "var(--event-font-heading)" };
  const closed = isRsvpClosed(deadline);

  const { data: existing } = useQuery({
    queryKey: ["guest-rsvp", eventId, subEventId, guestName],
    queryFn: async () => {
      if (!guestName) return null;
      let q = supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .eq("guest_name", guestName);
      if (subEventId) q = q.eq("sub_event_id", subEventId);
      else q = q.is("sub_event_id", null);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data as EventRsvp | null;
    },
    enabled: !!guestName,
  });

  const [form, setForm] = useState<RsvpFormState>({
    status: "pending",
    plus_ones: 0,
    dietary: "",
    message: "",
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setForm({
        status: existing.status,
        plus_ones: existing.plus_ones,
        dietary: existing.dietary || "",
        message: existing.message || "",
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!guestName) throw new Error("Please sign in first.");
      const payload = {
        event_id: eventId,
        sub_event_id: subEventId,
        guest_name: guestName,
        status: form.status,
        plus_ones: form.plus_ones,
        dietary: form.dietary,
        message: form.message,
        submitted_at: new Date().toISOString(),
      };
      if (existing) {
        const { error: uErr } = await supabase
          .from("event_rsvps")
          .update({ ...payload, id: existing.id })
          .eq("id", existing.id);
        if (uErr) throw uErr;
      } else {
        const { error: iErr } = await supabase.from("event_rsvps").insert(payload);
        if (iErr) throw iErr;
      }
    },
    onSuccess: () => {
      setSuccess("Your RSVP has been saved. Thank you!");
      setError(null);
      invalidate();
    },
    onError: (err: Error) => {
      setError(`Failed to save RSVP: ${err.message}`);
      setSuccess(null);
    },
  });

  if (closed) {
    return (
      <div
        className="p-6 border text-center"
        style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)", borderRadius: "var(--event-radius)" }}
      >
        <CalendarClock className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--event-text-muted)" }} />
        <h3 className="text-xl mb-2" style={headingFont}>{title}</h3>
        <p className="text-sm" style={{ color: "var(--event-text-muted)" }}>
          RSVP is now closed for this event.
        </p>
      </div>
    );
  }

  return (
    <div
      className="p-6 border"
      style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)", borderRadius: "var(--event-radius)" }}
    >
      <h3 className="text-xl mb-1" style={headingFont}>{title}</h3>
      {eventDate && (
        <p className="text-sm mb-4" style={{ color: "var(--event-text-muted)" }}>
          {formatDate(eventDate)}{eventTime ? ` · ${formatTime(eventTime)}` : ""}
          {venue ? ` · ${venue}` : ""}
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: "var(--event-text-muted)" }}>
            Will you attend?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, status: "attending" }))}
              className="flex items-center justify-center gap-2 py-3 text-sm border transition-all"
              style={{
                borderColor: form.status === "attending" ? "var(--event-primary)" : "var(--event-border)",
                backgroundColor: form.status === "attending" ? "var(--event-primary)" : "transparent",
                color: form.status === "attending" ? "#fff" : "var(--event-text)",
                borderRadius: "var(--event-radius)",
              }}
            >
              <Check className="w-4 h-4" /> Attending
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, status: "declined" }))}
              className="flex items-center justify-center gap-2 py-3 text-sm border transition-all"
              style={{
                borderColor: form.status === "declined" ? "var(--event-primary)" : "var(--event-border)",
                backgroundColor: form.status === "declined" ? "var(--event-primary)" : "transparent",
                color: form.status === "declined" ? "#fff" : "var(--event-text)",
                borderRadius: "var(--event-radius)",
              }}
            >
              <X className="w-4 h-4" /> Decline
            </button>
          </div>
        </div>

        {form.status === "attending" && (
          <>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: "var(--event-text-muted)" }}>
                Plus ones
              </label>
              <Input
                type="number"
                min={0}
                max={10}
                value={form.plus_ones}
                onChange={(e) => setForm((f) => ({ ...f, plus_ones: Math.max(0, parseInt(e.target.value) || 0) }))}
                style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-bg)", color: "var(--event-text)", borderRadius: "var(--event-radius)" }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: "var(--event-text-muted)" }}>
                Dietary requirements
              </label>
              <Input
                value={form.dietary}
                onChange={(e) => setForm((f) => ({ ...f, dietary: e.target.value }))}
                placeholder="Any allergies or preferences?"
                style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-bg)", color: "var(--event-text)", borderRadius: "var(--event-radius)" }}
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: "var(--event-text-muted)" }}>
            Message
          </label>
          <Textarea
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            placeholder="Leave a note for the host..."
            style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-bg)", color: "var(--event-text)", borderRadius: "var(--event-radius)" }}
          />
        </div>

        {success && (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--event-primary)" }}>
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <Button
          onClick={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={form.status === "pending"}
          className="w-full"
          style={{ backgroundColor: "var(--event-primary)", color: "#fff", borderRadius: "var(--event-radius)" }}
        >
          {existing ? "Update RSVP" : "Submit RSVP"}
        </Button>
      </div>
    </div>
  );
}
