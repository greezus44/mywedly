import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Check, X, Loader2 } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { isRsvpClosed } from "../../lib/utils";
import { Toast } from "../../components/ui";

export default function GuestRsvpPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const { guestName } = useGuestAuth();
  const [status, setStatus] = useState<"attending" | "declined" | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const rsvpDeadline = event.rsvp_deadline;
  const rsvpClosed = isRsvpClosed(rsvpDeadline);
  const content = event.content || {};
  const rsvpButtonText = content.rsvp_button_text || "Submit RSVP";

  // If not signed in, redirect to login
  React.useEffect(() => {
    if (!guestName) {
      navigate("login");
    }
  }, [guestName, navigate]);

  if (!guestName) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      setToast({ message: "Please select attending or declining", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("event_rsvps").insert({
        event_id: event.id,
        guest_name: guestName,
        status,
        plus_ones: status === "attending" ? plusOnes : 0,
        dietary: dietary || null,
        message: message || null,
        submitted_at: new Date().toISOString(),
      });

      if (error) throw error;
      setToast({ message: "RSVP submitted successfully!", type: "success" });
      setTimeout(() => navigate("home"), 1500);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to submit RSVP",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (rsvpClosed) {
    return (
      <div className="event-themed flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h1
          className="text-3xl font-semibold"
          style={{ fontFamily: "var(--event-heading-font)", color: "var(--event-text)" }}
        >
          RSVP Closed
        </h1>
        <p className="mt-4 text-sm opacity-70" style={{ color: "var(--event-text)" }}>
          The RSVP deadline for this event has passed.
        </p>
      </div>
    );
  }

  return (
    <div className="event-themed flex min-h-screen flex-col items-center px-6 py-12">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="text-center">
          <h1
            className="text-3xl font-semibold"
            style={{ fontFamily: "var(--event-heading-font)", color: "var(--event-text)" }}
          >
            RSVP
          </h1>
          <p
            className="mt-1 text-sm opacity-70"
            style={{ color: "var(--event-text)" }}
          >
            {event.name}
          </p>
          {event.event_date && (
            <p className="text-xs opacity-60" style={{ color: "var(--event-text)" }}>
              {event.event_date}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--event-text)" }}>
              Full Name
            </label>
            <input
              type="text"
              value={guestName}
              readOnly
              className="rounded-md border px-3 py-2 text-sm"
              style={{
                borderColor: "var(--event-border)",
                backgroundColor: "var(--event-surface)",
                color: "var(--event-text)",
              }}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" style={{ color: "var(--event-text)" }}>
              Will you attend?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStatus("attending")}
                className="flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-colors"
                style={{
                  borderColor: status === "attending" ? "var(--event-primary)" : "var(--event-border)",
                  backgroundColor: status === "attending" ? "var(--event-primary)" : "transparent",
                  color: status === "attending" ? "var(--event-bg)" : "var(--event-text)",
                }}
              >
                <Check className="h-4 w-4" />
                Joyfully Accepts
              </button>
              <button
                type="button"
                onClick={() => setStatus("declined")}
                className="flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-colors"
                style={{
                  borderColor: status === "declined" ? "var(--event-primary)" : "var(--event-border)",
                  backgroundColor: status === "declined" ? "var(--event-primary)" : "transparent",
                  color: status === "declined" ? "var(--event-bg)" : "var(--event-text)",
                }}
              >
                <X className="h-4 w-4" />
                Regretfully Declines
              </button>
            </div>
          </div>

          {/* Plus ones */}
          {status === "attending" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--event-text)" }}>
                Number of Additional Guests
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPlusOnes((n) => Math.max(0, n - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-md border text-lg"
                  style={{ borderColor: "var(--event-border)", color: "var(--event-text)" }}
                >
                  −
                </button>
                <span
                  className="w-12 text-center text-lg font-semibold"
                  style={{ color: "var(--event-text)" }}
                >
                  {plusOnes}
                </span>
                <button
                  type="button"
                  onClick={() => setPlusOnes((n) => Math.min(10, n + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-md border text-lg"
                  style={{ borderColor: "var(--event-border)", color: "var(--event-text)" }}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Dietary */}
          {status === "attending" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--event-text)" }}>
                Dietary Requirements
              </label>
              <textarea
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                placeholder="Any dietary restrictions?"
                className="min-h-[80px] rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "var(--event-border)",
                  backgroundColor: "var(--event-surface)",
                  color: "var(--event-text)",
                }}
              />
            </div>
          )}

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--event-text)" }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave a message for the host…"
              className="min-h-[80px] rounded-md border px-3 py-2 text-sm"
              style={{
                borderColor: "var(--event-border)",
                backgroundColor: "var(--event-surface)",
                color: "var(--event-text)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !status}
            className="rounded px-6 py-3 text-sm font-medium uppercase tracking-wider transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: "var(--event-primary)",
              color: "var(--event-bg)",
              borderRadius: "var(--event-button-radius, 6px)",
            }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </span>
            ) : (
              rsvpButtonText
            )}
          </button>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
