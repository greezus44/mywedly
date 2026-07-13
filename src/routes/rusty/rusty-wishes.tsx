import { useState, type FormEvent } from "react";
import { useParams, useNavigate, useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, ArrowLeft, Heart, MessageSquare } from "lucide-react";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";

export type Lang = "en" | "id";

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

export default function RustyWishes() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const eventSlug = slug || event.slug || event.id;

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["rusty-messages", event.id],
    queryFn: () => fetchMessages(event.id),
  });

  const [name, setName] = useState(guestName || "");
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: submitMessage,
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["rusty-messages", event.id] });
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
    <div className="min-h-screen bg-[#F5ECD7] text-[#3D3528] font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-[#F5ECD7]/95 backdrop-blur-sm border-b border-[#D4C695]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to={`/${eventSlug}/home`}
            className="font-heading text-xl tracking-wide"
            style={{ color: "#B8962E" }}
          >
            {event?.name || "Our Wedding"}
          </Link>
          <Link
            to={`/${eventSlug}/home`}
            className="flex items-center gap-1 text-xs uppercase tracking-[0.15em] hover:opacity-70"
            style={{ color: "#3D3528" }}
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-2xl mx-auto px-6 pt-16 pb-8 text-center animate-fade-in-up">
        <MessageSquare className="w-10 h-10 mx-auto mb-4" style={{ color: "#B8962E" }} />
        <p
          className="font-heading italic text-sm uppercase tracking-[0.3em] mb-2"
          style={{ color: "#B8962E" }}
        >
          From the Heart
        </p>
        <h1 className="font-heading text-4xl sm:text-5xl tracking-wide mb-3">
          Guest Wishes
        </h1>
        <GoldDivider />
        <p className="text-base max-w-md mx-auto" style={{ color: "#8B7355" }}>
          Share your love, advice, and well wishes with us on our special day.
        </p>
      </section>

      {/* Form */}
      <section className="max-w-2xl mx-auto px-6 pb-12">
        <div
          className="px-8 py-8"
          style={{ border: "1px solid #D4C695", backgroundColor: "#FAF3E0" }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                className="block text-xs uppercase tracking-[0.2em] mb-2"
                style={{ color: "#B8962E" }}
              >
                Your Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                style={{
                  backgroundColor: "#F5ECD7",
                  borderColor: "#D4C695",
                  color: "#3D3528",
                  borderRadius: 0,
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs uppercase tracking-[0.2em] mb-2"
                style={{ color: "#B8962E" }}
              >
                Your Wish
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                rows={4}
                style={{
                  backgroundColor: "#F5ECD7",
                  borderColor: "#D4C695",
                  color: "#3D3528",
                  borderRadius: 0,
                }}
              />
            </div>

            {localError && (
              <p className="text-xs" style={{ color: "#A07820" }}>
                {localError}
              </p>
            )}
            {mutation.isError && (
              <p className="text-xs" style={{ color: "#A07820" }}>
                Failed to send. Please try again.
              </p>
            )}
            {mutation.isSuccess && !mutation.isError && (
              <p className="text-xs flex items-center gap-1" style={{ color: "#B8962E" }}>
                <Heart className="w-3 h-3" /> Thank you! Your wish has been sent.
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              loading={mutation.isPending}
              disabled={mutation.isPending}
              className={cn("w-full uppercase tracking-[0.25em]")}
              style={{ backgroundColor: "#B8962E", color: "#FAF3E0", borderRadius: 0 }}
            >
              <Send className="w-4 h-4" />
              Send Wish
            </Button>
          </form>
        </div>
      </section>

      {/* Messages list */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <div className="text-center mb-8">
          <p
            className="font-heading italic text-sm uppercase tracking-[0.3em]"
            style={{ color: "#B8962E" }}
          >
            {messages.length} {messages.length === 1 ? "Wish" : "Wishes"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#B8962E" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-10 h-10 mx-auto mb-4" style={{ color: "#D4C695" }} />
            <p className="text-base" style={{ color: "#8B7355" }}>
              No wishes yet. Be the first to share your love!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="px-6 py-5 animate-fade-in-up"
                style={{ border: "1px solid #D4C695", backgroundColor: "#FAF3E0" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="font-heading text-lg tracking-wide"
                    style={{ color: "#B8962E" }}
                  >
                    {msg.guest_name}
                  </span>
                  <span className="text-xs" style={{ color: "#8B7355" }}>
                    {timeAgo(msg.created_at)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-6" aria-hidden>
      <span className="block h-px w-16" style={{ backgroundColor: "#B8962E" }} />
      <span className="text-lg" style={{ color: "#B8962E" }}>❦</span>
      <span className="block h-px w-16" style={{ backgroundColor: "#B8962E" }} />
    </div>
  );
}
