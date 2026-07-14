import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useGuestOutletContext } from "./guest-layout";

export default function GuestWishes() {
  const { event } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
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
    enabled: !!event.id,
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!guest) throw new Error("Not signed in");
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guest.name,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-wishes", event.id] });
      setMessage("");
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to post wish"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!message.trim()) return;
    postMutation.mutate();
  };

  const formatRelative = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const list = messages ?? [];

  return (
    <div>
      {/* Header */}
      <section className="guest-section text-center">
        <div className="mx-auto max-w-2xl">
          <p className="guest-eyebrow">Wishes</p>
          <h1 className="guest-title">Share Your Wishes</h1>
          <p className="guest-subtitle mx-auto">Leave a heartfelt message for {event.name}.</p>
        </div>
      </section>

      {/* Form */}
      <section className="guest-section-tight">
        <div className="mx-auto max-w-xl">
          <form onSubmit={handleSubmit} className="event-card space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="event-input"
              rows={4}
              placeholder="Write your wish..."
              maxLength={500}
              required
            />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--event-muted)" }}>{message.length}/500</span>
              <button type="submit" disabled={postMutation.isPending || !message.trim()} className="event-btn-primary" style={{ opacity: postMutation.isPending || !message.trim() ? 0.6 : 1 }}>
                {postMutation.isPending ? "Posting..." : "Post Wish"}
              </button>
            </div>
            {error && <p className="text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>}
          </form>
        </div>
      </section>

      {/* Messages */}
      <section className="guest-section-tight">
        {isLoading ? (
          <div className="flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>
        ) : list.length === 0 ? (
          <div className="text-center">
            <p className="guest-subtitle mx-auto">No wishes yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl columns-1 gap-4 sm:columns-2 lg:columns-3">
            {list.map((msg, i) => (
              <div key={msg.id} className="event-card mb-4 inline-block w-full break-inside-avoid animate-slideUpStagger" style={{ animationDelay: `${i * 60}ms` }}>
                <p className="text-sm leading-relaxed" style={{ color: "var(--event-text)" }}>"{msg.message}"</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "var(--event-heading)" }}>{msg.guest_name}</span>
                  <span className="text-xs" style={{ color: "var(--event-muted)" }}>{formatRelative(msg.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
