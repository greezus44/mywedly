import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";

export default function GuestWishes() {
  const { event } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [name, setName] = useState(guest?.name ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["guest-wishes", event.id],
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
      const { data, error } = await supabase
        .from("event_messages")
        .insert({
          event_id: event.id,
          guest_name: name.trim() || "Anonymous",
          message: message.trim(),
        })
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-wishes", event.id] });
      setMessage("");
      setError(null);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to post wish");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter a message.");
      return;
    }
    postMutation.mutate();
  };

  return (
    <div className="guest-section animate-fadeIn">
      <div className="mx-auto max-w-2xl">
        <h1 className="guest-title text-center">Wishes Wall</h1>
        <p className="guest-subtitle text-center mb-8">Share your well wishes and messages.</p>

        {/* Post form */}
        <form onSubmit={handleSubmit} className="event-card mb-8 space-y-4">
          <div>
            <label className="guest-eyebrow mb-1 block">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="event-input"
              disabled={postMutation.isPending}
            />
          </div>
          <div>
            <label className="guest-eyebrow mb-1 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your wish…"
              className="event-input min-h-[100px] resize-y"
              disabled={postMutation.isPending}
            />
          </div>
          {error && (
            <p className="text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>
          )}
          <button
            type="submit"
            className="event-btn-primary w-full"
            disabled={postMutation.isPending || !message.trim()}
          >
            {postMutation.isPending ? "Posting…" : "Post Wish"}
          </button>
        </form>

        {/* Messages list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : (messages ?? []).length === 0 ? (
          <p className="text-center" style={{ color: "var(--event-muted)" }}>
            No wishes yet. Be the first to share!
          </p>
        ) : (
          <div className="space-y-4">
            {(messages ?? []).map((msg) => (
              <div key={msg.id} className="event-card">
                <p className="font-semibold mb-1" style={{ color: "var(--event-heading)" }}>
                  {msg.guest_name}
                </p>
                <p style={{ color: "var(--event-text)" }}>{msg.message}</p>
                <p className="mt-2 text-xs" style={{ color: "var(--event-muted)" }}>
                  {new Date(msg.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
