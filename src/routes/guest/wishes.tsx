import { useState, type FormEvent } from "react";
import { useParams, useNavigate, useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, ArrowLeft, Heart, MessageSquare } from "lucide-react";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";

async function fetchMessages(eventId: string): Promise<EventMessage[]> {
  const { data, error } = await supabase
    .from("event_messages")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as EventMessage[]) || [];
}

async function submitMessage(
  payload: { event_id: string; guest_name: string; message: string },
): Promise<EventMessage> {
  const { data, error } = await supabase
    .from("event_messages")
    .insert({
      event_id: payload.event_id,
      guest_name: payload.guest_name,
      message: payload.message,
    })
    .select()
    .single();
  if (error) throw error;
  return data as EventMessage;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function GuestWishes() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const eventSlug = slug || event.slug || event.id;

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["guest-messages", event.id],
    queryFn: () => fetchMessages(event.id),
  });

  const [name, setName] = useState(guestName || "");
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: submitMessage,
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["guest-messages", event.id] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedMsg = message.trim();
    if (!trimmedName) {
      setLocalError("Please enter your name.");
      return;
    }
    if (!trimmedMsg) {
      setLocalError("Please write a message.");
      return;
    }
    setLocalError(null);
    mutation.mutate({
      event_id: event.id,
      guest_name: trimmedName,
      message: trimmedMsg,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans">
      {/* Nav */}
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
            {event?.name || "Our Event"}
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

      {/* Header */}
      <section className="mx-auto px-6 pt-16 pb-8 text-center animate-fade-in-up" style={{ maxWidth: "var(--max-width)" }}>
        <MessageSquare className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--color-accent)" }} />
        <p
          className="font-heading italic text-sm uppercase tracking-[0.3em] mb-2"
          style={{ color: "var(--color-accent)" }}
        >
          From the Heart
        </p>
        <h1 className="font-heading text-4xl sm:text-5xl tracking-wide mb-3" style={{ color: "var(--color-text)" }}>
          Guest Wishes
        </h1>
        <Divider />
        <p className="text-base max-w-md mx-auto" style={{ color: "var(--color-text-muted)" }}>
          Share your love, advice, and well wishes with us on our special day.
        </p>
      </section>

      {/* Form */}
      <section className="mx-auto px-6 pb-12" style={{ maxWidth: "var(--max-width)" }}>
        <div className="max-w-2xl mx-auto">
          <div
            className="px-8 py-8"
            style={{
              border: `1px solid var(--color-border)`,
              backgroundColor: "var(--color-bg-subtle)",
            }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label
                  className="block text-xs uppercase tracking-[0.2em] mb-2"
                  style={{ color: "var(--color-accent)" }}
                >
                  Your Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  style={{
                    backgroundColor: "var(--color-bg)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                    borderRadius: "var(--radius)",
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-xs uppercase tracking-[0.2em] mb-2"
                  style={{ color: "var(--color-accent)" }}
                >
                  Your Wish
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message..."
                  rows={4}
                  style={{
                    backgroundColor: "var(--color-bg)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                    borderRadius: "var(--radius)",
                  }}
                />
              </div>

              {localError && (
                <p className="text-xs" style={{ color: "var(--color-error, #dc2626)" }}>
                  {localError}
                </p>
              )}
              {mutation.isError && (
                <p className="text-xs" style={{ color: "var(--color-error, #dc2626)" }}>
                  Failed to send. Please try again.
                </p>
              )}
              {mutation.isSuccess && !mutation.isError && (
                <p className="text-xs flex items-center gap-1" style={{ color: "var(--color-accent)" }}>
                  <Heart className="w-3 h-3" /> Thank you! Your wish has been sent.
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                loading={mutation.isPending}
                disabled={mutation.isPending}
                className={cn("w-full uppercase tracking-[0.25em]")}
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-bg)",
                  borderRadius: "var(--radius)",
                }}
              >
                <Send className="w-4 h-4" />
                Send Wish
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Messages list */}
      <section className="mx-auto px-6 pb-20" style={{ maxWidth: "var(--max-width)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p
              className="font-heading italic text-sm uppercase tracking-[0.3em]"
              style={{ color: "var(--color-accent)" }}
            >
              {messages.length} {messages.length === 1 ? "Wish" : "Wishes"}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-accent)" }} />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--color-border)" }} />
              <p className="text-base" style={{ color: "var(--color-text-muted)" }}>
                No wishes yet. Be the first to share your love!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="px-6 py-5 animate-fade-in-up"
                  style={{
                    border: `1px solid var(--color-border)`,
                    backgroundColor: "var(--color-bg-subtle)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="font-heading text-lg tracking-wide"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {msg.guest_name}
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {timeAgo(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
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
