import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { cn } from "../../lib/utils";

export default function GuestWishes() {
  const { event } = useGuestOutletContext();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(guestName || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["guest-wishes", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventMessage[];
    },
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: name.trim(),
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-wishes", event.id] });
      setMessage("");
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    postMutation.mutate();
  };

  return (
    <div className="animate-fadeIn">
      <section className="guest-section text-center">
        <p className="guest-eyebrow">Wishes</p>
        <h1 className="guest-title">Send Your Wishes</h1>
        <p className="guest-subtitle mx-auto">
          Share a message, a memory, or your best wishes for the special day.
        </p>
      </section>

      {/* Form */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="event-card space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="event-input"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                Your Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your wishes here…"
                rows={4}
                className="event-input"
                required
              />
            </div>
            {error && (
              <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={postMutation.isPending || !name.trim() || !message.trim()}
              className={cn("event-btn-primary", (postMutation.isPending || !name.trim() || !message.trim()) && "opacity-60 cursor-not-allowed")}
            >
              {postMutation.isPending ? "Posting…" : "Post Message"}
            </button>
          </form>
        </div>
      </section>

      {/* Messages wall */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center text-2xl font-semibold" style={{ color: "var(--event-heading)" }}>
            Messages
          </h2>

          {isLoading ? (
            <div className="text-center" style={{ color: "var(--event-muted)" }}>Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="event-card text-center" style={{ color: "var(--event-muted)" }}>
              No messages yet. Be the first to leave a wish!
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {messages.map((msg, i) => (
                <div
                  key={msg.id}
                  className="event-info-card animate-slideUpStagger"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <p className="mb-3" style={{ color: "var(--event-text)" }}>
                    "{msg.message}"
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "var(--event-heading)" }}>
                    — {msg.guest_name}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--event-muted)" }}>
                    {new Date(msg.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
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
