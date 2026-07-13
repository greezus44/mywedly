import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { GuestLayoutContext } from "./guest-layout";
import { supabase, type EventRsvp, type EventGuest, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { isRsvpClosed, formatDeadline } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card } from "../../components/ui";

type RsvpStatus = "attending" | "declined";

export default function GuestRsvp() {
  const outletCtx = useOutletContext<GuestLayoutContext | null>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const { data: queriedEvent } = useQuery<UserEvent>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId!)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId && !outletCtx?.event,
  });
  const event = outletCtx?.event || queriedEvent;

  const [status, setStatus] = useState<RsvpStatus>("attending");
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-lg text-slate-400">Loading...</div>
      </div>
    );
  }

  const theme = event.theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;
  const rsvpClosed = isRsvpClosed(event.rsvp_deadline);

  const { data: existingRsvp } = useQuery<EventRsvp | null>({
    queryKey: ["guest-rsvp", eventId, guestName],
    queryFn: async () => {
      if (!guestName) return null;
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId!)
        .eq("guest_name", guestName)
        .maybeSingle();
      if (error) throw error;
      return data as EventRsvp | null;
    },
    enabled: !!eventId && !!guestName,
  });

  const { data: existingGuest } = useQuery<EventGuest | null>({
    queryKey: ["guest-record", eventId, guestName],
    queryFn: async () => {
      if (!guestName) return null;
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId!)
        .eq("name", guestName)
        .maybeSingle();
      if (error) throw error;
      return data as EventGuest | null;
    },
    enabled: !!eventId && !!guestName,
  });

  useEffect(() => {
    if (existingRsvp) {
      setStatus(existingRsvp.status === "declined" ? "declined" : "attending");
      setPlusOnes(existingRsvp.plus_ones || 0);
      setDietary(existingRsvp.dietary || "");
      setMessage(existingRsvp.message || "");
    }
  }, [existingRsvp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !guestName) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const rsvpPayload = {
        event_id: eventId,
        guest_name: guestName,
        guest_id: existingGuest?.id || null,
        status: status as "attending" | "declined",
        plus_ones: status === "attending" ? plusOnes : 0,
        dietary: status === "attending" ? dietary : "",
        message,
        submitted_at: new Date().toISOString(),
      };

      let rsvpError;
      if (existingRsvp) {
        const res = await supabase
          .from("event_rsvps")
          .update({
            status: rsvpPayload.status,
            plus_ones: rsvpPayload.plus_ones,
            dietary: rsvpPayload.dietary,
            message: rsvpPayload.message,
            submitted_at: rsvpPayload.submitted_at,
          })
          .eq("id", existingRsvp.id);
        rsvpError = res.error;
      } else {
        const res = await supabase.from("event_rsvps").insert(rsvpPayload);
        rsvpError = res.error;
      }
      if (rsvpError) throw rsvpError;

      if (existingGuest) {
        const { error: guestErr } = await supabase
          .from("event_guests")
          .update({
            rsvp_status: status,
            rsvp_submitted_at: new Date().toISOString(),
          })
          .eq("id", existingGuest.id);
        if (guestErr) throw guestErr;
      }

      queryClient.invalidateQueries({ queryKey: ["guest-rsvp", eventId, guestName] });
      queryClient.invalidateQueries({ queryKey: ["guest-record", eventId, guestName] });
      setSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit RSVP");
    } finally {
      setSubmitting(false);
    }
  };

  if (rsvpClosed) {
    return (
      <div
        style={{ ...cssVars, backgroundColor: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}
        className="min-h-screen px-4 py-8"
      >
        <div className="max-w-lg mx-auto text-center">
          <div className="mb-6">
            <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
            <h1 className="text-2xl font-medium mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              RSVP Closed
            </h1>
            <p className="text-base opacity-70" style={{ color: "var(--color-text-muted)" }}>
              The RSVP deadline has passed
            </p>
          </div>
          {event.rsvp_deadline && (
            <Card className="p-4 mb-6">
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Deadline was {formatDeadline(event.rsvp_deadline)}
              </p>
            </Card>
          )}
          <Button onClick={() => navigate(`/${eventId}/home`)} variant="secondary">
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div
        style={{ ...cssVars, backgroundColor: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}
        className="min-h-screen px-4 py-8 flex items-center justify-center"
      >
        <div className="max-w-lg w-full text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--color-accent)" }} />
          <h1 className="text-2xl font-medium mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Thank you!
          </h1>
          <p className="text-base opacity-70 mb-6">
            Your RSVP has been submitted successfully.
          </p>
          <div className="flex flex-col gap-2 items-center">
            <Button onClick={() => navigate(`/${eventId}/home`)}>Back to home</Button>
            <button onClick={() => setSuccess(false)} className="text-sm underline mt-2" style={{ color: "var(--color-accent)" }}>
              Edit my response
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ ...cssVars, backgroundColor: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}
      className="min-h-screen px-4 py-8"
    >
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-medium mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            RSVP
          </h1>
          <p className="text-sm opacity-70">Let us know if you can make it</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus("attending")}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors"
              style={{
                borderColor: status === "attending" ? "var(--color-primary)" : "var(--color-border)",
                backgroundColor: status === "attending" ? "var(--color-bg-subtle)" : "transparent",
              }}
            >
              <CheckCircle2 className="w-6 h-6" style={{ color: status === "attending" ? "var(--color-primary)" : "var(--color-text-muted)" }} />
              <span className="text-sm font-medium">Attending</span>
            </button>
            <button
              type="button"
              onClick={() => setStatus("declined")}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors"
              style={{
                borderColor: status === "declined" ? "var(--color-primary)" : "var(--color-border)",
                backgroundColor: status === "declined" ? "var(--color-bg-subtle)" : "transparent",
              }}
            >
              <XCircle className="w-6 h-6" style={{ color: status === "declined" ? "var(--color-primary)" : "var(--color-text-muted)" }} />
              <span className="text-sm font-medium">Declined</span>
            </button>
          </div>

          {status === "attending" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5">Plus ones</label>
                <Select value={String(plusOnes)} onChange={(e) => setPlusOnes(Number(e.target.value))}>
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Dietary requirements</label>
                <Input
                  type="text"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  placeholder="Any allergies or preferences"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave a message for the host"
              rows={4}
            />
          </div>

          {event.rsvp_deadline && (
            <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
              RSVP by {formatDeadline(event.rsvp_deadline)}
            </p>
          )}

          {submitError && (
            <p className="text-sm text-red-600 text-center">{submitError}</p>
          )}

          <Button
            type="submit"
            loading={submitting}
            disabled={submitting}
            className="w-full"
            size="lg"
            style={{ backgroundColor: "var(--color-primary)", color: "#ffffff" }}
          >
            Submit RSVP
          </Button>
        </form>
      </div>
    </div>
  );
}
