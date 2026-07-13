import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase, EventRsvp } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { isRsvpClosed, formatDeadline } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Check, CalendarX } from "lucide-react";
import type { FormEvent } from "react";
import type { GuestLayoutContext } from "./guest-layout";

type RsvpStatus = "attending" | "declined";

export default function Rsvp() {
  const { eventId } = useParams<{ eventId: string }>();
  const { event } = useOutletContext<GuestLayoutContext>();
  const { guestId, guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const theme = event.theme;

  const [status, setStatus] = useState<RsvpStatus>("attending");
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const rsvpClosed = isRsvpClosed(event.rsvp_deadline);

  const { data: existingRsvp } = useQuery<EventRsvp | null>({
    queryKey: ["guest-rsvp", eventId, guestId],
    queryFn: async () => {
      if (!guestId || !eventId) return null;
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .eq("guest_id", guestId)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!guestId && !!eventId,
  });

  useEffect(() => {
    if (existingRsvp) {
      setStatus(existingRsvp.status === "maybe" ? "attending" : (existingRsvp.status as RsvpStatus));
      setPlusOnes(existingRsvp.plus_ones || 0);
      setDietary(existingRsvp.dietary || "");
      setMessage(existingRsvp.message || "");
      setSubmitted(true);
    }
  }, [existingRsvp]);

  const submitMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId || !guestId || !guestName) throw new Error("Missing guest information");

      const payload = {
        event_id: eventId,
        guest_id: guestId,
        guest_name: guestName,
        status,
        plus_ones: status === "attending" ? plusOnes : 0,
        dietary: status === "attending" ? dietary || null : null,
        message: message || null,
        submitted_at: new Date().toISOString(),
      };

      if (existingRsvp) {
        const { error } = await supabase
          .from("event_rsvps")
          .update(payload)
          .eq("id", existingRsvp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert(payload);
        if (error) throw error;
      }

      const { error: guestError } = await supabase
        .from("event_guests")
        .update({
          rsvp_status: status,
          rsvp_submitted_at: new Date().toISOString(),
          plus_ones: status === "attending" ? plusOnes : 0,
          dietary: status === "attending" ? dietary || null : null,
          message: message || null,
        })
        .eq("id", guestId);
      if (guestError) throw guestError;
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["guest-rsvp", eventId, guestId] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (rsvpClosed) return;
    submitMutation.mutate();
  };

  const handleEdit = () => {
    setSubmitted(false);
  };

  if (submitted && !submitMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ backgroundColor: theme.bgColor, fontFamily: theme.bodyFont }}>
        <div className="w-full max-w-md p-8 text-center bg-white border rounded-xl" style={{ borderColor: `${theme.accentColor}40` }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${theme.accentColor}20` }}
          >
            <Check className="w-8 h-8" style={{ color: theme.primaryColor }} />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: theme.headingFont, color: theme.headingColor }}>
            {status === "attending" ? "Thank You!" : "Thank You for Letting Us Know"}
          </h2>
          <p className="text-sm mb-8 opacity-70" style={{ color: theme.bodyColor }}>
            {status === "attending"
              ? `We're so glad you'll be joining us${plusOnes > 0 ? ` with ${plusOnes} ${plusOnes === 1 ? "guest" : "guests"}` : ""}.`
              : "We're sorry you won't be able to make it. Thank you for letting us know."}
          </p>
          <Button
            variant="secondary"
            onClick={handleEdit}
            disabled={rsvpClosed}
            style={{
              borderColor: theme.accentColor,
              borderRadius: `${theme.buttonRadius}px`,
              color: theme.headingColor,
            }}
          >
            Edit Response
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-12" style={{ backgroundColor: theme.bgColor, color: theme.bodyColor, fontFamily: theme.bodyFont }}>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: theme.headingFont, color: theme.headingColor }}>
            RSVP
          </h1>
          <p className="text-sm opacity-70" style={{ color: theme.bodyColor }}>
            {guestName ? `Hi ${guestName.split(" ")[0]}, will you be joining us?` : "Will you be joining us?"}
          </p>
        </div>

        {rsvpClosed && (
          <div className="p-6 mb-6 text-center bg-white border rounded-xl" style={{ borderColor: `${theme.accentColor}40`, backgroundColor: `${theme.accentColor}10` }}>
            <CalendarX className="w-8 h-8 mx-auto mb-3 opacity-60" style={{ color: theme.headingColor }} />
            <p className="text-sm font-medium" style={{ color: theme.headingColor }}>
              RSVPs are now closed
            </p>
            {event.rsvp_deadline && (
              <p className="text-xs mt-1 opacity-60" style={{ color: theme.bodyColor }}>
                RSVPs closed on {formatDeadline(event.rsvp_deadline)}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-3" style={{ color: theme.headingColor }}>
              Will you attend?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => !rsvpClosed && setStatus("attending")}
                disabled={rsvpClosed}
                className="p-4 rounded-xl border-2 text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: status === "attending" ? theme.primaryColor : `${theme.accentColor}30`,
                  backgroundColor: status === "attending" ? `${theme.primaryColor}10` : "transparent",
                  color: theme.headingColor,
                }}
              >
                <span className="block text-sm font-semibold">Joyfully Accepts</span>
              </button>
              <button
                type="button"
                onClick={() => !rsvpClosed && setStatus("declined")}
                disabled={rsvpClosed}
                className="p-4 rounded-xl border-2 text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: status === "declined" ? theme.primaryColor : `${theme.accentColor}30`,
                  backgroundColor: status === "declined" ? `${theme.primaryColor}10` : "transparent",
                  color: theme.headingColor,
                }}
              >
                <span className="block text-sm font-semibold">Regretfully Declines</span>
              </button>
            </div>
          </div>

          {status === "attending" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.headingColor }}>
                  Number of Plus Ones
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => !rsvpClosed && setPlusOnes(Math.max(0, plusOnes - 1))}
                    disabled={rsvpClosed || plusOnes === 0}
                    className="w-10 h-10 rounded-lg border flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: `${theme.accentColor}40`, color: theme.headingColor }}
                  >
                    −
                  </button>
                  <span className="text-xl font-semibold tabular-nums w-12 text-center" style={{ color: theme.headingColor }}>
                    {plusOnes}
                  </span>
                  <button
                    type="button"
                    onClick={() => !rsvpClosed && setPlusOnes(Math.min(10, plusOnes + 1))}
                    disabled={rsvpClosed || plusOnes === 10}
                    className="w-10 h-10 rounded-lg border flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: `${theme.accentColor}40`, color: theme.headingColor }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.headingColor }}>
                  Dietary Requirements
                </label>
                <Input
                  type="text"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  placeholder="e.g. Vegetarian, Gluten-free, Allergies..."
                  disabled={rsvpClosed}
                  style={{
                    borderColor: `${theme.accentColor}30`,
                    color: theme.bodyColor,
                    backgroundColor: theme.bgColor,
                  }}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.headingColor }}>
              Message {status === "attending" ? "(optional)" : ""}
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave a message for the host..."
              rows={4}
              disabled={rsvpClosed}
              style={{
                borderColor: `${theme.accentColor}30`,
                color: theme.bodyColor,
                backgroundColor: theme.bgColor,
              }}
            />
          </div>

          {(submitMutation as any).error && (
            <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
              {(submitMutation as any).error.message || "Something went wrong. Please try again."}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            loading={submitMutation.isPending}
            disabled={rsvpClosed}
            className="w-full"
            style={{
              backgroundColor: theme.buttonBgColor,
              color: theme.buttonTextColor,
              borderRadius: `${theme.buttonRadius}px`,
            }}
          >
            {existingRsvp ? "Update RSVP" : "Submit RSVP"}
          </Button>
        </form>
      </div>
    </div>
  );
}
