import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2, Minus, Plus } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToEventCssVars } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { Toast, type ToastType } from "../../components/ui";
import { isRsvpClosed } from "../../lib/utils";

export default function GuestRsvpPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [status, setStatus] = useState<"attending" | "declined" | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");

  const cssVars = themeToEventCssVars(event.theme);
  const deadline = event.rsvp_deadline;
  const closed = isRsvpClosed(deadline);

  // Redirect to login if not signed in
  if (!guestName) {
    navigate("login");
    return null;
  }

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_rsvps").insert({
        event_id: event.id,
        guest_name: guestName,
        status: status!,
        plus_ones: status === "attending" ? plusOnes : 0,
        dietary: dietary.trim() || null,
        message: message.trim() || null,
        submitted_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps", event.id] });
      setToast({ message: "RSVP submitted! Thank you.", type: "success" });
      setTimeout(() => navigate("home"), 1500);
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      setToast({ message: "Please select attending or declined", type: "error" });
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="event-themed min-h-screen" style={cssVars}>
      <section className="px-6 py-12">
        <div
          className="mx-auto max-w-lg rounded-lg bg-surface p-8 shadow-sm"
          style={{ boxShadow: "var(--event-shadow)" }}
        >
          <h2 className="font-heading text-center text-2xl">RSVP</h2>
          <p className="font-body mt-2 text-center text-sm text-muted">
            {event.name}
          </p>
          {event.event_date && (
            <p className="font-body mt-1 text-center text-xs text-muted">
              {event.event_date}
            </p>
          )}

          {closed ? (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted">
                RSVP for this event has closed.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Name */}
              <div>
                <label className="font-body mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                  Your Name
                </label>
                <div className="rounded-md border-current bg-current px-3 py-2 text-sm text-current">
                  {guestName}
                </div>
              </div>

              {/* Attending toggle */}
              <div>
                <label className="font-body mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                  Will you attend?
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("attending")}
                    className="flex-1 rounded-md px-4 py-2.5 text-center text-sm font-medium transition-colors"
                    style={
                      status === "attending"
                        ? {
                            backgroundColor: "var(--event-primary)",
                            color: "var(--event-bg)",
                            borderRadius: "var(--event-button-radius)",
                          }
                        : {
                            border: "1px solid var(--event-border)",
                            color: "var(--event-text)",
                            borderRadius: "var(--event-button-radius)",
                          }
                    }
                  >
                    <Check className="mr-1 inline h-4 w-4" /> Yes, with joy
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("declined")}
                    className="flex-1 rounded-md px-4 py-2.5 text-center text-sm font-medium transition-colors"
                    style={
                      status === "declined"
                        ? {
                            backgroundColor: "var(--event-primary)",
                            color: "var(--event-bg)",
                            borderRadius: "var(--event-button-radius)",
                          }
                        : {
                            border: "1px solid var(--event-border)",
                            color: "var(--event-text)",
                            borderRadius: "var(--event-button-radius)",
                          }
                    }
                  >
                    <X className="mr-1 inline h-4 w-4" /> Sadly, no
                  </button>
                </div>
              </div>

              {/* Plus ones */}
              {status === "attending" && (
                <div>
                  <label className="font-body mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                    Number of additional guests
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPlusOnes(Math.max(0, plusOnes - 1))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border-current"
                      style={{ border: "1px solid var(--event-border)" }}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2rem] text-center text-lg font-semibold">
                      {plusOnes}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlusOnes(plusOnes + 1)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border-current"
                      style={{ border: "1px solid var(--event-border)" }}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Dietary */}
              {status === "attending" && (
                <div>
                  <label className="font-body mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                    Dietary requirements
                  </label>
                  <Textarea
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    placeholder="Any allergies or dietary preferences?"
                    rows={2}
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <label className="font-body mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                  Message
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Leave a message for the host..."
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitMutation.isPending || !status}
                style={{
                  backgroundColor: "var(--event-primary)",
                  color: "var(--event-bg)",
                  borderRadius: "var(--event-button-radius)",
                }}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit RSVP"
                )}
              </Button>
            </form>
          )}
        </div>
      </section>

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
