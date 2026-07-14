import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventSchedule, type SubEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { formatDate, formatTime } from "../../lib/utils";

export default function GuestRsvp() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guest, eventId, signOut } = useGuestAuth();
  const qc = useQueryClient();
  const [rsvpStatus, setRsvpStatus] = useState<string>("pending");
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");

  const { data: event } = useQuery({
    queryKey: ["event_by_slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!slug,
  });

  const { data: schedule } = useQuery({
    queryKey: ["schedule", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", event!.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
    enabled: !!event?.id,
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub_events", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event!.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!event?.id,
  });

  useEffect(() => {
    if (guest) {
      setRsvpStatus(guest.rsvp_status);
      setPlusOnes(guest.plus_ones);
      setDietary(guest.dietary ?? "");
      setMessage(guest.message ?? "");
    }
  }, [guest]);

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      if (!guest) return;
      const { error } = await supabase
        .from("event_guests")
        .update({
          rsvp_status: rsvpStatus,
          plus_ones: plusOnes,
          dietary,
          message,
          rsvp_submitted_at: new Date().toISOString(),
        })
        .eq("id", guest.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guest", guest?.id] });
    },
  });

  if (!event) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-[var(--event-text)] mb-6" style={{ fontFamily: "var(--event-heading-font)" }}>
        RSVP
      </h1>

      {/* Event Details */}
      <div className="bg-[var(--event-surface)] border border-[var(--event-border)] rounded-lg p-5 mb-6">
        <h2 className="text-lg font-medium text-[var(--event-text)] mb-3" style={{ fontFamily: "var(--event-heading-font)" }}>
          {event.name}
        </h2>
        <div className="space-y-2 text-sm text-[var(--event-text-muted)]">
          {event.event_date && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--event-text)]">Date:</span> {formatDate(event.event_date)}
            </div>
          )}
          {event.event_time && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--event-text)]">Time:</span> {formatTime(event.event_time)}
            </div>
          )}
          {event.venue && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--event-text)]">Venue:</span> {event.venue}
            </div>
          )}
          {event.address && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--event-text)]">Address:</span> {event.address}
            </div>
          )}
        </div>
      </div>

      {/* Schedule */}
      {schedule && schedule.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-medium text-[var(--event-text)] mb-3" style={{ fontFamily: "var(--event-heading-font)" }}>
            Schedule
          </h2>
          <div className="space-y-2">
            {schedule.map((item) => (
              <div key={item.id} className="bg-[var(--event-surface)] border border-[var(--event-border)] rounded-lg p-3">
                <h3 className="text-sm font-medium text-[var(--event-text)]">{item.title}</h3>
                {item.description && <p className="text-xs text-[var(--event-text-muted)] mt-1">{item.description}</p>}
                <div className="text-xs text-[var(--event-text-muted)] mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {item.schedule_date && <span>{formatDate(item.schedule_date)}</span>}
                  {item.start_time && <span>{formatTime(item.start_time)}{item.end_time ? ` – ${formatTime(item.end_time)}` : ""}</span>}
                  {item.venue && <span>{item.venue}</span>}
                </div>
                {item.address && <p className="text-xs text-[var(--event-text-muted)] mt-1">{item.address}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RSVP Form */}
      {guest && (
        <form
          onSubmit={(e) => { e.preventDefault(); rsvpMutation.mutate(); }}
          className="bg-[var(--event-surface)] border border-[var(--event-border)] rounded-lg p-5 space-y-4"
        >
          <h2 className="text-lg font-medium text-[var(--event-text)]" style={{ fontFamily: "var(--event-heading-font)" }}>
            Your Response
          </h2>

          <div>
            <label className="block text-sm font-medium text-[var(--event-text)] mb-2">Will you attend?</label>
            <div className="flex gap-2">
              {[
                { value: "attending", label: "Joyfully Accepts" },
                { value: "declined", label: "Regretfully Declines" },
                { value: "pending", label: "Undecided" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRsvpStatus(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    rsvpStatus === opt.value
                      ? "bg-[var(--event-primary)] text-white border-[var(--event-primary)]"
                      : "border-[var(--event-border)] text-[var(--event-text)] hover:bg-[var(--event-bg)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {rsvpStatus === "attending" && (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--event-text)] mb-1">Number of Plus Ones</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={plusOnes}
                  onChange={(e) => setPlusOnes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[var(--event-border)] rounded-lg text-sm bg-[var(--event-surface)] text-[var(--event-text)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--event-text)] mb-1">Dietary Requirements</label>
                <input
                  type="text"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  placeholder="e.g. Vegetarian, gluten-free, allergies…"
                  className="w-full px-3 py-2 border border-[var(--event-border)] rounded-lg text-sm bg-[var(--event-surface)] text-[var(--event-text)]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--event-text)] mb-1">Message for the Couple</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Leave a note for the happy couple…"
              className="w-full px-3 py-2 border border-[var(--event-border)] rounded-lg text-sm bg-[var(--event-surface)] text-[var(--event-text)]"
            />
          </div>

          <Button type="submit" disabled={rsvpMutation.isPending}>
            {rsvpMutation.isPending ? "Submitting…" : "Submit RSVP"}
          </Button>
          {rsvpMutation.isSuccess && <p className="text-sm text-green-600">Your RSVP has been submitted. Thank you!</p>}
          {rsvpMutation.isError && <p className="text-sm text-red-500">Failed to submit. Please try again.</p>}
        </form>
      )}

      {/* Sub-events */}
      {subEvents && subEvents.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-medium text-[var(--event-text)] mb-3" style={{ fontFamily: "var(--event-heading-font)" }}>
            Additional Events
          </h2>
          <div className="space-y-2">
            {subEvents.map((se) => (
              <div key={se.id} className="bg-[var(--event-surface)] border border-[var(--event-border)] rounded-lg p-3">
                <h3 className="text-sm font-medium text-[var(--event-text)]">{se.name}</h3>
                <div className="text-xs text-[var(--event-text-muted)] mt-1">
                  {se.date && <span>{formatDate(se.date)} </span>}
                  {se.time && <span>at {formatTime(se.time)}</span>}
                </div>
                {se.venue && <p className="text-xs text-[var(--event-text-muted)] mt-1">{se.venue}</p>}
                {se.address && <p className="text-xs text-[var(--event-text-muted)]">{se.address}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {guest && (
        <div className="mt-6 text-center">
          <button onClick={() => { signOut(); navigate(`/e/${slug}/signin`); }} className="text-xs text-[var(--event-text-muted)] hover:underline">
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
