import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CalendarHeart, XCircle, Loader2 } from "lucide-react";
import { supabase, EventRsvp } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { ErrorState, Skeleton } from "../../components/ui/index";
import type { GuestLayoutContext } from "./guest-layout";

type RsvpStatus = "attending" | "not_attending";

export default function Rsvp() {
  const { event } = useOutletContext<GuestLayoutContext>();
  const { guestName, guestId } = useGuestAuth();
  const queryClient = useQueryClient();
  const theme = event.theme;
  const content = event.content;

  const [status, setStatus] = useState<RsvpStatus>("attending");
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: existingRsvp, isLoading } = useQuery<EventRsvp | null>({
    queryKey: ["guest-rsvp", event.id, guestId],
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
      setStatus(existingRsvp.status as RsvpStatus);
      setPlusOnes(existingRsvp.plus_ones || 0);
      setDietary(existingRsvp.dietary || "");
      setMessage(existingRsvp.message || "");
      setSubmitted(true);
    }
  }, [existingRsvp]);

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      const payload = {
        event_id: event.id,
        guest_id: guestId,
        guest_name: guestName,
        status,
        plus_ones: status === "attending" ? plusOnes : 0,
        dietary: status === "attending" ? dietary : "",
        message,
      };

      if (existingRsvp) {
        const { error } = await supabase
          .from("event_rsvps")
          .update({
            status: payload.status,
            plus_ones: payload.plus_ones,
            dietary: payload.dietary,
            message: payload.message,
            submitted_at: new Date().toISOString(),
          })
          .eq("id", existingRsvp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert(payload);
        if (error) throw error;
      }

      if (guestId) {
        const { error: guestError } = await supabase
          .from("event_guests")
          .update({
            rsvp_status: status,
            rsvp_submitted_at: new Date().toISOString(),
            plus_ones: payload.plus_ones,
            dietary: payload.dietary,
            message,
          })
          .eq("id", guestId);
        if (guestError) throw guestError;
      }
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["guest-rsvp", event.id, guestId] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4" style={{ backgroundColor: theme.bgColor }}>
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-64 w-full max-w-md mx-auto" />
      </div>
    );
  }

  if (mutation.isError) {
    return (
      <div
        className="p-6 min-h-[60vh] flex items-center justify-center"
        style={{ backgroundColor: theme.bgColor }}
      >
        <ErrorState
          message={(mutation as any).error?.message || "Failed to submit RSVP."}
          onRetry={() => mutation.reset()}
        />
      </div>
    );
  }

  return (
    <div className="w-full pb-20" style={{ backgroundColor: theme.bgColor }}>
      <div
        className="text-center py-12 px-6"
        style={{ padding: `${theme.sectionPadding}px 24px` }}
      >
        <p
          className="text-base mb-2 opacity-70"
          style={{ fontFamily: `var(--wed-script-font)` }}
        >
          {content.rsvp_description || "Please let us know if you can make it"}
        </p>
        <h1
          className="text-4xl font-bold mb-4"
          style={{
            fontFamily: `var(--wed-heading-font)`,
            color: theme.headingColor,
          }}
        >
          {content.rsvp_title || "RSVP"}
        </h1>
        <div
          className="w-12 h-px mx-auto"
          style={{ backgroundColor: theme.primaryColor, opacity: 0.5 }}
        />
      </div>

      <div
        className="px-6 pb-12"
        style={{ maxWidth: `${Math.min(theme.maxWidth, 480)}px`, margin: "0 auto" }}
      >
        {submitted && !mutation.isPending && (
          <div
            className="mb-6 p-5 rounded-xl text-center"
            style={{
              backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${theme.primaryColor} 30%, transparent)`,
            }}
          >
            <CheckCircle2
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: theme.primaryColor }}
            />
            <p
              className="text-sm font-medium mb-1"
              style={{ color: theme.headingColor }}
            >
              {status === "attending"
                ? "Thank you for your RSVP!"
                : "We're sorry you can't make it."}
            </p>
            <p className="text-xs opacity-60" style={{ color: theme.bodyColor }}>
              {status === "attending"
                ? "We can't wait to celebrate with you."
                : "Thank you for letting us know."}
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 text-xs underline opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: theme.primaryColor }}
            >
              Update my response
            </button>
          </div>
        )}

        {!submitted && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="space-y-6"
          >
            <div>
              <label
                className="block text-sm font-medium mb-3"
                style={{ color: theme.headingColor }}
              >
                Will you be attending?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("attending")}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                  style={{
                    borderColor:
                      status === "attending"
                        ? theme.primaryColor
                        : `color-mix(in srgb, ${theme.accentColor} 20%, transparent)`,
                    backgroundColor:
                      status === "attending"
                        ? `color-mix(in srgb, ${theme.primaryColor} 10%, transparent)`
                        : "transparent",
                  }}
                >
                  <CalendarHeart
                    className="w-6 h-6"
                    style={{
                      color: status === "attending" ? theme.primaryColor : theme.bodyColor,
                    }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: status === "attending" ? theme.headingColor : theme.bodyColor,
                    }}
                  >
                    Yes, with joy
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("not_attending")}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                  style={{
                    borderColor:
                      status === "not_attending"
                        ? theme.primaryColor
                        : `color-mix(in srgb, ${theme.accentColor} 20%, transparent)`,
                    backgroundColor:
                      status === "not_attending"
                        ? `color-mix(in srgb, ${theme.primaryColor} 10%, transparent)`
                        : "transparent",
                  }}
                >
                  <XCircle
                    className="w-6 h-6"
                    style={{
                      color:
                        status === "not_attending" ? theme.primaryColor : theme.bodyColor,
                    }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{
                      color:
                        status === "not_attending" ? theme.headingColor : theme.bodyColor,
                    }}
                  >
                    Can't make it
                  </span>
                </button>
              </div>
            </div>

            {status === "attending" && (
              <>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme.headingColor }}
                  >
                    Number of plus ones
                  </label>
                  <Select
                    value={String(plusOnes)}
                    onChange={(e) => setPlusOnes(Number(e.target.value))}
                    style={{
                      borderColor: `color-mix(in srgb, ${theme.accentColor} 30%, transparent)`,
                      backgroundColor: theme.bgColor,
                      color: theme.bodyColor,
                    }}
                  >
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n === 0 ? "Just me" : `${n} guest${n > 1 ? "s" : ""}`}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme.headingColor }}
                  >
                    Dietary requirements
                  </label>
                  <Input
                    type="text"
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    placeholder="e.g. Vegetarian, gluten-free, allergies..."
                    style={{
                      borderColor: `color-mix(in srgb, ${theme.accentColor} 30%, transparent)`,
                      backgroundColor: theme.bgColor,
                      color: theme.bodyColor,
                    }}
                  />
                </div>
              </>
            )}

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.headingColor }}
              >
                Message{" "}
                <span className="opacity-50 font-normal">(optional)</span>
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share a message with the host..."
                rows={4}
                style={{
                  borderColor: `color-mix(in srgb, ${theme.accentColor} 30%, transparent)`,
                  backgroundColor: theme.bgColor,
                  color: theme.bodyColor,
                }}
              />
            </div>

            {mutation.isError && (
              <p className="text-sm text-red-600 text-center">
                {(mutation as any).error?.message}
              </p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3.5 rounded-lg font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                backgroundColor: theme.buttonBgColor,
                color: theme.buttonTextColor,
                borderRadius: `${theme.buttonRadius}px`,
              }}
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {existingRsvp ? "Update RSVP" : "Submit RSVP"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
