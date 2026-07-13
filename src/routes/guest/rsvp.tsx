import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { DEFAULT_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card } from "../../components/ui/index";
import type { FormEvent } from "react";
import { CheckCircle2, CalendarX, CalendarCheck } from "lucide-react";

type RsvpStatus = "attending" | "declined";

export default function Rsvp() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestId, guestName } = useGuestAuth();
  const theme = { ...DEFAULT_THEME, ...event.theme };

  const [status, setStatus] = useState<RsvpStatus>("attending");
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: existingRsvp, isLoading } = useQuery<EventRsvp | null>({
    queryKey: ["event-rsvp", event.id, guestId],
    queryFn: async () => {
      if (!guestId) return null;
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("guest_id", guestId)
        .maybeSingle();
      if (error) throw error;
      return data as EventRsvp | null;
    },
    enabled: !!guestId,
  });

  useEffect(() => {
    if (existingRsvp) {
      setStatus(existingRsvp.status === "declined" ? "declined" : "attending");
      setPlusOnes(existingRsvp.plus_ones || 0);
      setDietary(existingRsvp.dietary || "");
      setMessage(existingRsvp.message || "");
      setSubmitted(true);
    }
  }, [existingRsvp]);

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!guestId || !guestName) throw new Error("Not authenticated");

      const payload = {
        event_id: event.id,
        guest_id: guestId,
        guest_name: guestName,
        status,
        plus_ones: status === "attending" ? plusOnes : 0,
        dietary: dietary.trim() || null,
        message: message.trim() || null,
      };

      if (existingRsvp) {
        const { error } = await supabase
          .from("event_rsvps")
          .update(payload)
          .eq("id", existingRsvp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .insert({ ...payload, submitted_at: new Date().toISOString() });
        if (error) throw error;
      }

      const { error: guestError } = await supabase
        .from("event_guests")
        .update({
          rsvp_status: status,
          plus_ones: status === "attending" ? plusOnes : 0,
          dietary: dietary.trim() || null,
          message: message.trim() || null,
        })
        .eq("id", guestId);
      if (guestError) throw guestError;
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const handleUpdate = () => {
    setSubmitted(false);
  };

  if (isLoading) {
    return (
      <div className="px-6 py-16 text-center" style={{ color: theme.bodyColor }}>
        <div className="animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  if (submitted && existingRsvp) {
    return (
      <div className="px-6 py-12" style={{ maxWidth: theme.maxWidth, margin: "0 auto" }}>
        <div className="text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            style={{ background: `${theme.primaryColor}15` }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: theme.primaryColor }} />
          </div>
          <h2
            className="text-2xl font-bold"
            style={{ color: theme.headingColor, fontFamily: theme.headingFont }}
          >
            {status === "attending" ? "Thank you!" : "Response Received"}
          </h2>
          <p className="text-sm" style={{ color: theme.bodyColor }}>
            {status === "attending"
              ? "We look forward to celebrating with you."
              : "We're sorry you can't make it. Thank you for letting us know."}
          </p>
        </div>

        <Card className="mt-8 p-6" >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-wider opacity-60" style={{ color: theme.bodyColor }}>
                Status
              </span>
              <span
                className="text-sm font-medium px-3 py-1 rounded-full"
                style={{
                  background: status === "attending" ? `${theme.primaryColor}20` : `${theme.accentColor}20`,
                  color: status === "attending" ? theme.primaryColor : theme.accentColor,
                }}
              >
                {status === "attending" ? "Attending" : "Not Attending"}
              </span>
            </div>
            {status === "attending" && (
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider opacity-60" style={{ color: theme.bodyColor }}>
                  Plus Ones
                </span>
                <span className="text-sm font-medium" style={{ color: theme.headingColor }}>
                  {plusOnes}
                </span>
              </div>
            )}
            {dietary && (
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs uppercase tracking-wider opacity-60 flex-shrink-0" style={{ color: theme.bodyColor }}>
                  Dietary
                </span>
                <span className="text-sm text-right" style={{ color: theme.headingColor }}>
                  {dietary}
                </span>
              </div>
            )}
            {message && (
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs uppercase tracking-wider opacity-60 flex-shrink-0" style={{ color: theme.bodyColor }}>
                  Message
                </span>
                <span className="text-sm text-right" style={{ color: theme.headingColor }}>
                  {message}
                </span>
              </div>
            )}
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Button variant="secondary" onClick={handleUpdate}>
            Update Response
          </Button>
        </div>
      </div>
    );
  }

  const mutationError = (mutation as any).error as Error | undefined;

  return (
    <div className="px-6 py-12" style={{ maxWidth: theme.maxWidth, margin: "0 auto" }}>
      <div className="text-center mb-8">
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: theme.headingColor, fontFamily: theme.headingFont }}
        >
          RSVP
        </h2>
        <p className="text-sm" style={{ color: theme.bodyColor }}>
          {existingRsvp ? "Update your response" : "Will you be attending?"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setStatus("attending")}
            className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all"
            style={{
              borderColor: status === "attending" ? theme.primaryColor : `${theme.accentColor}30`,
              background: status === "attending" ? `${theme.primaryColor}10` : "transparent",
            }}
          >
            <CalendarCheck
              className="w-6 h-6"
              style={{ color: status === "attending" ? theme.primaryColor : theme.bodyColor }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: status === "attending" ? theme.primaryColor : theme.bodyColor }}
            >
              Joyfully Accept
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatus("declined")}
            className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all"
            style={{
              borderColor: status === "declined" ? theme.primaryColor : `${theme.accentColor}30`,
              background: status === "declined" ? `${theme.primaryColor}10` : "transparent",
            }}
          >
            <CalendarX
              className="w-6 h-6"
              style={{ color: status === "declined" ? theme.primaryColor : theme.bodyColor }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: status === "declined" ? theme.primaryColor : theme.bodyColor }}
            >
              Regretfully Decline
            </span>
          </button>
        </div>

        {status === "attending" && (
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: theme.headingColor }}
            >
              Number of Plus Ones
            </label>
            <Select
              value={String(plusOnes)}
              onChange={(e) => setPlusOnes(Number(e.target.value))}
              style={{ background: theme.bgColor, color: theme.bodyColor, borderColor: `${theme.accentColor}40` }}
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: theme.headingColor }}
          >
            Dietary Requirements
          </label>
          <Input
            type="text"
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            placeholder="e.g. Vegetarian, Gluten-free, Allergies..."
            style={{ background: theme.bgColor, color: theme.bodyColor, borderColor: `${theme.accentColor}40` }}
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: theme.headingColor }}
          >
            Message {status === "declined" ? "(optional)" : ""}
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share a message with the host..."
            rows={4}
            style={{ background: theme.bgColor, color: theme.bodyColor, borderColor: `${theme.accentColor}40` }}
          />
        </div>

        {mutationError && (
          <p className="text-sm text-red-500 text-center">{mutationError.message}</p>
        )}

        <Button
          type="submit"
          loading={mutation.isPending}
          className="w-full"
          style={{
            background: theme.buttonBgColor,
            color: theme.buttonTextColor,
            borderRadius: theme.buttonRadius,
            border: `1px solid ${theme.buttonBgColor}`,
          }}
        >
          {existingRsvp ? "Update RSVP" : "Submit RSVP"}
        </Button>
      </form>
    </div>
  );
}
