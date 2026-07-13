import { useState, useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp, type EventGuest } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/index";
import { isRsvpClosed, formatDeadline } from "../../lib/utils";
import { Check, X, Minus, Plus } from "lucide-react";
import type { FormEvent } from "react";
import type { GuestLayoutContext } from "./guest-layout";

export default function Rsvp() {
  const { eventId } = useParams<{ eventId: string }>();
  const outletCtx = useOutletContext<GuestLayoutContext | null>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const fallbackQuery = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    enabled: !!eventId && !outletCtx?.event,
    queryFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  const event = outletCtx?.event || fallbackQuery.data || null;

  const [status, setStatus] = useState<"attending" | "declined" | "">("");
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: existingRsvp } = useQuery<EventRsvp | null, Error>({
    queryKey: ["guest-rsvp", eventId, guestName],
    enabled: !!eventId && !!guestName,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId!)
        .eq("guest_name", guestName!)
        .maybeSingle();
      if (error) throw error;
      return data as EventRsvp | null;
    },
  });

  const { data: existingGuest } = useQuery<EventGuest | null, Error>({
    queryKey: ["guest-record", eventId, guestName],
    enabled: !!eventId && !!guestName,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId!)
        .eq("name", guestName!)
        .maybeSingle();
      if (error) throw error;
      return data as EventGuest | null;
    },
  });

  useEffect(() => {
    if (existingRsvp) {
      setStatus(existingRsvp.status as "attending" | "declined" | "");
      setPlusOnes(existingRsvp.plus_ones || 0);
      setDietary(existingRsvp.dietary || "");
      setMessage(existingRsvp.message || "");
    } else if (existingGuest) {
      setStatus(existingGuest.rsvp_status === "pending" ? "" : existingGuest.rsvp_status);
      setPlusOnes(existingGuest.plus_ones || 0);
      setDietary(existingGuest.dietary || "");
      setMessage(existingGuest.message || "");
    }
  }, [existingRsvp, existingGuest]);

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId || !guestName) throw new Error("Missing event or guest info");
      if (!status) throw new Error("Please select attending or declined");

      const rsvpPayload = {
        event_id: eventId,
        guest_name: guestName,
        status,
        plus_ones: status === "attending" ? plusOnes : 0,
        dietary: status === "attending" ? dietary : "",
        message,
        submitted_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from("event_rsvps")
        .select("id")
        .eq("event_id", eventId)
        .eq("guest_name", guestName)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("event_rsvps")
          .update(rsvpPayload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .insert({ ...rsvpPayload, answers: null });
        if (error) throw error;
      }

      if (existingGuest) {
        const { error } = await supabase
          .from("event_guests")
          .update({
            rsvp_status: status,
            rsvp_submitted_at: new Date().toISOString(),
            plus_ones: status === "attending" ? plusOnes : 0,
            dietary: status === "attending" ? dietary : "",
            message,
          })
          .eq("id", existingGuest.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setSubmitSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["guest-rsvp", eventId, guestName] });
      queryClient.invalidateQueries({ queryKey: ["guest-record", eventId, guestName] });
      setTimeout(() => setSubmitSuccess(false), 5000);
    },
  });

  const deadline = event?.rsvp_deadline || event?.draft_rsvp_deadline || null;
  const rsvpClosed = isRsvpClosed(deadline);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!status || rsvpClosed) return;
    mutation.mutate();
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-slate-500">Event details unavailable.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-6 py-10 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-light mb-2" style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
          RSVP
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Kindly respond by the deadline
        </p>
      </div>

      {rsvpClosed && (
        <div
          className="text-center py-6 px-4 rounded-lg mb-8 border"
          style={{ backgroundColor: "var(--color-bg-subtle)", borderColor: "var(--color-border)" }}
        >
          <p className="text-lg" style={{ color: "var(--color-primary)" }}>
            RSVPs are now closed
          </p>
          {deadline && (
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              RSVPs closed on {formatDeadline(deadline)}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setStatus("attending")}
            disabled={rsvpClosed}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: status === "attending" ? "var(--color-primary)" : "var(--color-border)",
              backgroundColor: status === "attending" ? "var(--color-primary)" : "var(--color-bg)",
              color: status === "attending" ? "var(--color-bg)" : "var(--color-text)",
            }}
          >
            <Check className="w-6 h-6" />
            <span className="text-base tracking-wide">Joyfully Accepts</span>
          </button>

          <button
            type="button"
            onClick={() => setStatus("declined")}
            disabled={rsvpClosed}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: status === "declined" ? "var(--color-primary)" : "var(--color-border)",
              backgroundColor: status === "declined" ? "var(--color-primary)" : "var(--color-bg)",
              color: status === "declined" ? "var(--color-bg)" : "var(--color-text)",
            }}
          >
            <X className="w-6 h-6" />
            <span className="text-base tracking-wide">Regretfully Declines</span>
          </button>
        </div>

        {status === "attending" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm tracking-[0.15em] uppercase mb-3" style={{ color: "var(--color-accent)" }}>
                Plus Ones
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPlusOnes(Math.max(0, plusOnes - 1))}
                  disabled={rsvpClosed || plusOnes === 0}
                  className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors disabled:opacity-40"
                  style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-3xl min-w-[3rem] text-center" style={{ color: "var(--color-text)" }}>
                  {plusOnes}
                </span>
                <button
                  type="button"
                  onClick={() => setPlusOnes(Math.min(10, plusOnes + 1))}
                  disabled={rsvpClosed || plusOnes >= 10}
                  className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors disabled:opacity-40"
                  style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm tracking-[0.15em] uppercase mb-3" style={{ color: "var(--color-accent)" }}>
                Dietary Requirements
              </label>
              <Textarea
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                placeholder="Any allergies or dietary restrictions..."
                disabled={rsvpClosed}
                rows={3}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm tracking-[0.15em] uppercase mb-3" style={{ color: "var(--color-accent)" }}>
            Message
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your well wishes..."
            disabled={rsvpClosed}
            rows={4}
          />
        </div>

        {submitSuccess && (
          <div
            className="text-center py-4 px-4 rounded-lg border animate-fade-in"
            style={{ backgroundColor: "var(--color-bg-subtle)", borderColor: "var(--color-primary)" }}
          >
            <p className="text-lg" style={{ color: "var(--color-primary)" }}>
              Thank you! Your RSVP has been submitted.
            </p>
          </div>
        )}

        {(mutation as any).error && (
          <div
            className="text-center py-4 px-4 rounded-lg border"
            style={{ backgroundColor: "var(--color-bg-subtle)", borderColor: "#dc2626" }}
          >
            <p className="text-sm" style={{ color: "#dc2626" }}>
              {(mutation as any).error instanceof Error ? (mutation as any).error.message : "Failed to submit RSVP. Please try again."}
            </p>
          </div>
        )}

        <div className="text-center pt-4">
          <Button
            type="submit"
            disabled={!status || rsvpClosed || mutation.isPending}
            loading={mutation.isPending}
            size="lg"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-bg)" }}
          >
            {mutation.isPending ? "Submitting..." : "Submit RSVP"}
          </Button>
        </div>
      </form>
    </div>
  );
}
