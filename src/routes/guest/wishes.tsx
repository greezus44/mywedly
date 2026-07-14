import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";

export default function GuestWishes() {
  const { event, theme } = useGuestOutletContext();
  const { name } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["guest-messages", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventMessage[];
    },
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!message.trim()) throw new Error("Please write a message");
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: name ?? "Guest",
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["guest-messages", event.id] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to post message");
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    postMutation.mutate();
  }

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-3xl">
        {/* Centered header */}
        <div className="mb-10 text-center">
          <p className="guest-eyebrow">Wishes</p>
          <h1 className="guest-title">Send Your Wishes</h1>
          <p className="guest-subtitle mx-auto">Share a kind word, a memory, or a blessing.</p>
        </div>

        {/* Form in max-width card */}
        <form onSubmit={handleSubmit} className="event-card mb-10">
          <label className="mb-2 block text-sm font-medium" style={{ color: theme.heading }}>
            Your message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Write your wish…"
            className="event-input"
            maxLength={500}
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs" style={{ color: theme.muted }}>{message.length}/500</span>
            <button
              type="submit"
              disabled={postMutation.isPending || !message.trim()}
              className="event-btn-primary"
              style={{ opacity: postMutation.isPending || !message.trim() ? 0.5 : 1 }}
            >
              {postMutation.isPending ? "Posting…" : "Post Wish"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm" style={{ color: "#dc2626" }}>{error}</p>}
        </form>

        {/* Staggered message cards */}
        {isLoading ? (
          <div className="text-center" style={{ color: theme.muted }}>Loading wishes…</div>
        ) : messages.length === 0 ? (
          <div className="event-card text-center">
            <p style={{ color: theme.muted }}>No wishes yet. Be the first to leave one!</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {messages.map((m, i) => (
              <div
                key={m.id}
                className="event-card animate-slideUpStagger"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <p style={{ color: theme.text, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{m.message}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold" style={{ color: theme.heading, fontFamily: theme.fontHeading }}>
                    {m.guest_name}
                  </span>
                  <span className="text-xs" style={{ color: theme.muted }}>
                    {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
