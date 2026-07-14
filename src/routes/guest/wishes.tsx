import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDateTime } from "../../lib/utils";

export default function GuestWishes() {
  const { event, slug } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (guest?.name) setName(guest.name);
  }, [guest]);

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
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: name.trim() || (guest?.name ?? "Anonymous"),
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["guest-wishes", event.id] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to post message"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    postMutation.mutate();
  };

  if (isLoading) {
    return (
      <section className="guest-section text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </section>
    );
  }

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="guest-eyebrow">Wishes</p>
          <h1 className="guest-title">Share Your Wishes</h1>
          <p className="guest-subtitle mx-auto">Leave a message for {event.name}.</p>
        </div>

        <form onSubmit={handleSubmit} className="event-card mb-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="event-input"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>Your message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="event-input min-h-[120px]"
              placeholder="Write your wishes here..."
              required
            />
          </div>
          {error && <p className="text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>}
          <button
            type="submit"
            disabled={postMutation.isPending || !message.trim()}
            className="event-btn-primary w-full"
            style={{ opacity: postMutation.isPending || !message.trim() ? 0.6 : 1 }}
          >
            {postMutation.isPending ? "Posting..." : "Post Wish"}
          </button>
        </form>

        <div className="space-y-4">
          {(messages ?? []).length === 0 && (
            <p className="text-center text-sm" style={{ color: "var(--event-muted)" }}>No wishes yet. Be the first to share!</p>
          )}
          {(messages ?? []).map((msg) => (
            <div key={msg.id} className="event-card animate-fadeIn">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold" style={{ color: "var(--event-heading)" }}>{msg.guest_name}</span>
                <span className="text-xs" style={{ color: "var(--event-muted)" }}>{formatDateTime(msg.created_at)}</span>
              </div>
              <p className="rich-content whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
