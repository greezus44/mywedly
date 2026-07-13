import { useState, useMemo, type FormEvent } from "react";
import { useParams, useNavigate, useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  X,
  CalendarClock,
  Loader2,
  PartyPopper,
  Heart,
  ArrowLeft,
} from "lucide-react";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { cn, isRsvpClosed, formatDeadline } from "../../lib/utils";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";

async function fetchExistingRsvp(
  eventId: string,
  guestName: string,
): Promise<EventRsvp | null> {
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .eq("guest_name", guestName)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as EventRsvp | null) ?? null;
}

async function submitRsvp(
  payload: Omit<EventRsvp, "id" | "submitted_at">,
): Promise<EventRsvp> {
  const { data, error } = await supabase
    .from("event_rsvps")
    .insert({
      event_id: payload.event_id,
      guest_name: payload.guest_name,
      status: payload.status,
      plus_ones: payload.plus_ones,
      dietary: payload.dietary,
      message: payload.message,
      answers: payload.answers,
    })
    .select()
    .single();
  if (error) throw error;
  return data as EventRsvp;
}

export default function GuestRsvp() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const eventSlug = slug || event.slug || event.id;
  const closed = isRsvpClosed(event.rsvp_deadline);

  const { data: existingRsvp, isLoading: loadingExisting } = useQuery({
    queryKey: ["guest-rsvp", event.id, guestName],
    queryFn: () => fetchExistingRsvp(event.id, guestName || ""),
    enabled: !!guestName,
  });

  const [status, setStatus] = useState<"attending" | "declined" | "pending">(
    existingRsvp?.status || "pending",
  );
  const [plusOnes, setPlusOnes] = useState<number>(existingRsvp?.plus_ones || 0);
  const [dietary, setDietary] = useState<string>(existingRsvp?.dietary || "");
  const [message, setMessage] = useState<string>(existingRsvp?.message || "");
  const [submitted, setSubmitted] = useState(false);

  // Sync existing RSVP into form state once loaded
  useMemo(() => {
    if (existingRsvp) {
      setStatus(existingRsvp.status);
      setPlusOnes(existingRsvp.plus_ones);
      setDietary(existingRsvp.dietary);
      setMessage(existingRsvp.message);
    }
  }, [existingRsvp]);

  const mutation = useMutation({
    mutationFn: submitRsvp,
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["guest-rsvp", event.id, guestName] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (status === "pending") return;
    if (!guestName) {
      navigate(`/e/${eventSlug}/login`);
      return;
    }
    mutation.mutate({
      event_id: event.id,
      guest_id: null,
      guest_name: guestName,
      status,
      plus_ones: status === "attending" ? plusOnes : 0,
      dietary: status === "attending" ? dietary : "",
      message,
      answers: null,
    });
  };

  // RSVP closed state
  if (closed) {
    return (
      <Shell eventSlug={eventSlug} eventName={event.name}>
        <div className="text-center py-16 px-6 max-w-lg mx-auto animate-fade-in-up">
          <CalendarClock className="w-12 h-12 mx-auto mb-6" style={{ color: "var(--color-accent)" }} />
          <h1 className="font-heading text-4xl tracking-wide mb-4" style={{ color: "var(--color-text)" }}>
            RSVP Closed
          </h1>
          <Divider />
          <p className="text-base mb-2" style={{ color: "var(--color-text-muted)" }}>
            We're sorry, the RSVP deadline has passed.
          </p>
          {event.rsvp_deadline && (
            <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
              The deadline was {formatDeadline(event.rsvp_deadline)}.
            </p>
          )}
          <p className="text-base mb-8" style={{ color: "var(--color-text)" }}>
            If you have any questions, please reach out to us directly.
          </p>
          <Button
            onClick={() => navigate(`/e/${eventSlug}/contact`)}
            size="lg"
            className={cn("px-10 uppercase tracking-[0.25em]")}
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-bg)",
              borderRadius: "var(--radius)",
            }}
          >
            Contact Us
          </Button>
        </div>
      </Shell>
    );
  }

  // Success state
  if (submitted && !mutation.isError) {
    return (
      <Shell eventSlug={eventSlug} eventName={event.name}>
        <div className="text-center py-16 px-6 max-w-lg mx-auto animate-scale-in">
          {status === "attending" ? (
            <PartyPopper className="w-12 h-12 mx-auto mb-6" style={{ color: "var(--color-accent)" }} />
          ) : (
            <Heart className="w-12 h-12 mx-auto mb-6" style={{ color: "var(--color-accent)" }} />
          )}
          <h1 className="font-heading text-4xl tracking-wide mb-4" style={{ color: "var(--color-text)" }}>
            {status === "attending" ? "Thank You!" : "We'll Miss You"}
          </h1>
          <Divider />
          <p className="text-base mb-8" style={{ color: "var(--color-text-muted)" }}>
            {status === "attending"
              ? "We can't wait to celebrate with you. See you soon!"
              : "Thank you for letting us know. You'll be missed."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => navigate(`/e/${eventSlug}/home`)}
              size="lg"
              className={cn("px-10 uppercase tracking-[0.25em]")}
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-bg)",
                borderRadius: "var(--radius)",
              }}
            >
              Back to Home
            </Button>
            <Button
              onClick={() => navigate(`/e/${eventSlug}/wishes`)}
              variant="ghost"
              size="lg"
              className={cn("px-10 uppercase tracking-[0.25em]")}
              style={{ color: "var(--color-accent)", borderRadius: "var(--radius)" }}
            >
              Leave a Wish
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  // Not logged in
  if (!guestName) {
    return (
      <Shell eventSlug={eventSlug} eventName={event.name}>
        <div className="text-center py-16 px-6 max-w-lg mx-auto animate-fade-in-up">
          <Heart className="w-12 h-12 mx-auto mb-6" style={{ color: "var(--color-accent)" }} />
          <h1 className="font-heading text-4xl tracking-wide mb-4" style={{ color: "var(--color-text)" }}>
            Please Sign In
          </h1>
          <Divider />
          <p className="text-base mb-8" style={{ color: "var(--color-text-muted)" }}>
            Please enter your name so we know who is responding.
          </p>
          <Button
            onClick={() => navigate(`/e/${eventSlug}/login`)}
            size="lg"
            className={cn("px-10 uppercase tracking-[0.25em]")}
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-bg)",
              borderRadius: "var(--radius)",
            }}
          >
            Sign In
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell eventSlug={eventSlug} eventName={event.name}>
      <div className="mx-auto px-6 py-12 animate-fade-in-up" style={{ maxWidth: "var(--max-width)" }}>
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <p
              className="font-heading italic text-sm uppercase tracking-[0.3em] mb-2"
              style={{ color: "var(--color-accent)" }}
            >
              Kindly Respond
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl tracking-wide mb-3" style={{ color: "var(--color-text)" }}>
              RSVP
            </h1>
            {event.rsvp_deadline && (
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Please respond by {formatDeadline(event.rsvp_deadline)}
              </p>
            )}
          </div>

          <Divider />

          {existingRsvp && !submitted && (
            <div
              className="text-center text-sm px-4 py-3 mb-6"
              style={{
                border: `1px solid var(--color-border)`,
                backgroundColor: "var(--color-bg-subtle)",
                color: "var(--color-text-muted)",
              }}
            >
              You previously submitted a response. Submitting again will update it.
            </div>
          )}

          {loadingExisting ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-accent)" }} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              {/* Guest name (read-only) */}
              <div>
                <label
                  className="block text-xs uppercase tracking-[0.2em] mb-2"
                  style={{ color: "var(--color-accent)" }}
                >
                  Name
                </label>
                <Input
                  value={guestName}
                  readOnly
                  className="cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--color-bg-subtle)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-muted)",
                    borderRadius: "var(--radius)",
                  }}
                />
              </div>

              {/* Attending / Declined */}
              <div>
                <label
                  className="block text-xs uppercase tracking-[0.2em] mb-3"
                  style={{ color: "var(--color-accent)" }}
                >
                  Will You Attend?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <ChoiceCard
                    selected={status === "attending"}
                    onClick={() => setStatus("attending")}
                    icon={<Check className="w-5 h-5" />}
                    label="Joyfully Accepts"
                  />
                  <ChoiceCard
                    selected={status === "declined"}
                    onClick={() => setStatus("declined")}
                    icon={<X className="w-5 h-5" />}
                    label="Regretfully Declines"
                  />
                </div>
              </div>

              {/* Plus ones (only if attending) */}
              {status === "attending" && (
                <div className="animate-fade-in">
                  <label
                    className="block text-xs uppercase tracking-[0.2em] mb-2"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Number of Guests (Including You)
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setPlusOnes((n) => Math.max(0, n - 1))}
                      className="px-4"
                      style={{ borderColor: "var(--color-border)", borderRadius: "var(--radius)", color: "var(--color-text)" }}
                    >
                      −
                    </Button>
                    <span
                      className="font-heading text-2xl min-w-[40px] text-center"
                      style={{ color: "var(--color-text)" }}
                    >
                      {plusOnes + 1}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setPlusOnes((n) => Math.min(10, n + 1))}
                      className="px-4"
                      style={{ borderColor: "var(--color-border)", borderRadius: "var(--radius)", color: "var(--color-text)" }}
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
                    {plusOnes} additional guest{plusOnes !== 1 ? "s" : ""} joining you.
                  </p>
                </div>
              )}

              {/* Dietary (only if attending) */}
              {status === "attending" && (
                <div className="animate-fade-in">
                  <label
                    className="block text-xs uppercase tracking-[0.2em] mb-2"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Dietary Requirements
                  </label>
                  <Textarea
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    placeholder="Any allergies or dietary preferences?"
                    rows={3}
                    style={{
                      backgroundColor: "var(--color-bg)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <label
                  className="block text-xs uppercase tracking-[0.2em] mb-2"
                  style={{ color: "var(--color-accent)" }}
                >
                  Message
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share a note or well wishes..."
                  rows={4}
                  style={{
                    backgroundColor: "var(--color-bg)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                    borderRadius: "var(--radius)",
                  }}
                />
              </div>

              {mutation.isError && (
                <p className="text-sm text-left" style={{ color: "var(--color-error, #dc2626)" }}>
                  Something went wrong. Please try again.
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                loading={mutation.isPending}
                disabled={status === "pending" || mutation.isPending}
                className={cn("w-full uppercase tracking-[0.25em]")}
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-bg)",
                  borderRadius: "var(--radius)",
                }}
              >
                {status === "declined" ? "Send Response" : "Confirm Attendance"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({
  eventSlug,
  eventName,
  children,
}: {
  eventSlug: string;
  eventName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans">
      <nav
        className="sticky top-0 z-20 backdrop-blur-sm border-b"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-bg) 95%, transparent)",
          borderColor: "var(--color-border)",
        }}
      >
        <div
          className="mx-auto px-6 py-4 flex items-center justify-between"
          style={{ maxWidth: "var(--max-width)" }}
        >
          <Link
            to={`/e/${eventSlug}/home`}
            className="font-heading text-xl tracking-wide"
            style={{ color: "var(--color-primary)" }}
          >
            {eventName || "Our Event"}
          </Link>
          <Link
            to={`/e/${eventSlug}/home`}
            className="flex items-center gap-1 text-xs uppercase tracking-[0.15em] hover:opacity-70"
            style={{ color: "var(--color-text)" }}
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 my-6" aria-hidden>
      <span className="block h-px w-16" style={{ backgroundColor: "var(--color-accent)" }} />
      <span className="text-lg" style={{ color: "var(--color-accent)" }}>✦</span>
      <span className="block h-px w-16" style={{ backgroundColor: "var(--color-accent)" }} />
    </div>
  );
}

function ChoiceCard({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex flex-col items-center gap-2 px-4 py-6 transition-all")}
      style={{
        border: selected ? `2px solid var(--color-accent)` : `1px solid var(--color-border)`,
        backgroundColor: selected ? "var(--color-bg-subtle)" : "transparent",
        color: selected ? "var(--color-accent)" : "var(--color-text)",
      }}
    >
      {icon}
      <span className="text-xs uppercase tracking-[0.15em]">{label}</span>
    </button>
  );
}
