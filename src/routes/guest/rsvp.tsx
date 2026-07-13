import { useState, useEffect, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Minus, Plus, AlertCircle } from "lucide-react";
import { supabase, type EventRsvp } from "../../lib/supabase";
import type { GuestLayoutContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { isRsvpClosed, formatDeadline } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";

export default function Rsvp() {
  const { event } = useOutletContext<GuestLayoutContext>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<"attending" | "declined" | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: existingRsvp } = useQuery<EventRsvp | null, Error>({
    queryKey: ["existing-rsvp", event.id, guestName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("guest_name", guestName!)
        .maybeSingle();
      if (error) throw error;
      return data as EventRsvp | null;
    },
    enabled: !!guestName,
  });

  useEffect(() => {
    if (existingRsvp) {
      setStatus(existingRsvp.status === "pending" ? null : existingRsvp.status);
      setPlusOnes(existingRsvp.plus_ones || 0);
      setDietary(existingRsvp.dietary || "");
      setMessage(existingRsvp.message || "");
    }
  }, [existingRsvp]);

  const rsvpClosed = isRsvpClosed(event.rsvp_deadline);

  const submitMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const rsvpPayload = {
        event_id: event.id,
        guest_name: guestName!,
        status: status || "pending",
        plus_ones: plusOnes,
        dietary,
        message,
      };

      const { data: existing } = await supabase
        .from("event_rsvps")
        .select("id")
        .eq("event_id", event.id)
        .eq("guest_name", guestName!)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("event_rsvps")
          .update({ ...rsvpPayload, submitted_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .insert({ ...rsvpPayload, submitted_at: new Date().toISOString() });
        if (error) throw error;
      }

      const { data: guest } = await supabase
        .from("event_guests")
        .select("id")
        .eq("event_id", event.id)
        .eq("name", guestName!)
        .maybeSingle();

      if (guest) {
        await supabase
          .from("event_guests")
          .update({
            rsvp_status: status || "pending",
            rsvp_submitted_at: new Date().toISOString(),
            plus_ones: plusOnes,
            dietary,
            message,
          })
          .eq("id", guest.id);
      }
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["existing-rsvp", event.id, guestName] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!status || !guestName) return;
    submitMutation.mutate();
  };

  if (submitted) {
    return (
      <div className="py-16 text-center animate-fade-in-up">
        <div
          className="w-16 h-16 mx-auto mb-6 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: "var(--color-accent)" }}
        >
          <Check className="w-8 h-8" style={{ color: "var(--color-accent)" }} />
        </div>
        <h2
          className="text-3xl mb-3"
          style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
        >
          Thank You!
        </h2>
        <p
          className="text-sm max-w-xs mx-auto leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          Your response has been received. We look forward to celebrating with you.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in py-6">
      <div className="text-center mb-8">
        <h1
          className="text-3xl mb-1"
          style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
        >
          RSVP
        </h1>
        <p
          className="text-sm italic"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-script)" }}
        >
          Will you join us?
        </p>
      </div>

      {rsvpClosed && (
        <div
          className="mb-6 p-4 rounded-lg border flex items-start gap-2.5"
          style={{
            backgroundColor: "var(--color-bg-subtle)",
            borderColor: "var(--color-border)",
          }}
        >
          <AlertCircle
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            style={{ color: "var(--color-accent)" }}
          />
          <p
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            RSVPs closed on {formatDeadline(event.rsvp_deadline)}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => !rsvpClosed && setStatus("attending")}
              disabled={rsvpClosed}
              className="flex items-center justify-center gap-2 py-3.5 rounded-lg border-2 text-sm font-medium tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                borderColor: status === "attending" ? "var(--color-accent)" : "var(--color-border)",
                backgroundColor: status === "attending" ? "var(--color-accent)" : "transparent",
                color: status === "attending" ? "#ffffff" : "var(--color-text)",
              }}
            >
              <Check className="w-4 h-4" />
              Attending
            </button>
            <button
              type="button"
              onClick={() => !rsvpClosed && setStatus("declined")}
              disabled={rsvpClosed}
              className="flex items-center justify-center gap-2 py-3.5 rounded-lg border-2 text-sm font-medium tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                borderColor: status === "declined" ? "var(--color-accent)" : "var(--color-border)",
                backgroundColor: status === "declined" ? "var(--color-accent)" : "transparent",
                color: status === "declined" ? "#ffffff" : "var(--color-text)",
              }}
            >
              <X className="w-4 h-4" />
              Decline
            </button>
          </div>
        </div>

        {status === "attending" && (
          <>
            <div className="animate-fade-in">
              <label
                className="block text-xs tracking-[0.15em] uppercase mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Plus Ones
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPlusOnes(Math.max(0, plusOnes - 1))}
                  disabled={rsvpClosed || plusOnes === 0}
                  className="w-9 h-9 rounded-full border flex items-center justify-center transition-colors disabled:opacity-40"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span
                  className="text-2xl w-8 text-center"
                  style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
                >
                  {plusOnes}
                </span>
                <button
                  type="button"
                  onClick={() => setPlusOnes(Math.min(10, plusOnes + 1))}
                  disabled={rsvpClosed}
                  className="w-9 h-9 rounded-full border flex items-center justify-center transition-colors disabled:opacity-40"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="animate-fade-in">
              <label
                className="block text-xs tracking-[0.15em] uppercase mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Dietary Requirements
              </label>
              <Input
                type="text"
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                placeholder="Any allergies or dietary preferences?"
                disabled={rsvpClosed}
              />
            </div>
          </>
        )}

        <div>
          <label
            className="block text-xs tracking-[0.15em] uppercase mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Message
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a note for the hosts..."
            rows={3}
            disabled={rsvpClosed}
          />
        </div>

        {(submitMutation as any).error && (
          <p className="text-xs text-red-600 text-center">
            {(submitMutation as any).error.message}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          loading={submitMutation.isPending}
          disabled={!status || rsvpClosed}
          className="w-full"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#ffffff",
            borderRadius: "var(--radius)",
          }}
        >
          Submit RSVP
        </Button>
      </form>
    </div>
  );
}
