import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useGuestOutletContext } from "./guest-layout";
import { formatDateTime } from "../../lib/utils";

export default function GuestWishes() {
  const { event, slug } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [name, setName] = useState(guest?.name ?? "");

  const { data: messages, isLoading, isError, error, refetch } = useQuery({
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
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: name.trim() || guest?.name || "Guest",
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-messages", event.id] });
      setMessage("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    postMutation.mutate();
  };

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="guest-eyebrow">Share Your Love</p>
          <h1 className="guest-title">Wishes Wall</h1>
          <p className="guest-subtitle mx-auto">Leave a message for {event.name}.</p>
        </div>

        <form onSubmit={handleSubmit} className="event-card mb-10 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="event-input"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>Your Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="event-input"
              rows={4}
              placeholder="Write your wishes..."
              required
            />
          </div>
          {postMutation.isError && (
            <p className="text-sm" style={{ color: "var(--event-primary)" }}>
              {(postMutation.error as Error)?.message ?? "Failed to post. Please try again."}
            </p>
          )}
          <button type="submit" disabled={postMutation.isPending || !message.trim()} className="event-btn-primary w-full" style={{ opacity: postMutation.isPending || !message.trim() ? 0.6 : 1 }}>
            {postMutation.isPending ? "Posting..." : "Post Wish"}
          </button>
        </form>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : isError ? (
          <div className="text-center">
            <p className="guest-subtitle mx-auto mb-4">{error?.message ?? "Failed to load wishes."}</p>
            <button onClick={() => refetch()} className="event-btn-secondary">Try Again</button>
          </div>
        ) : !messages || messages.length === 0 ? (
          <p className="text-center" style={{ color: "var(--event-muted)" }}>No wishes yet. Be the first to share!</p>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className="event-card">
                <p className="rich-content" style={{ color: "var(--event-text)" }}>{m.message}</p>
                <div className="mt-3 flex items-center justify-between text-xs" style={{ color: "var(--event-muted)" }}>
                  <span className="font-semibold">— {m.guest_name}</span>
                  {m.created_at && <span>{formatDateTime(m.created_at)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
