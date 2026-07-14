import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useGuestOutletContext } from "./guest-layout";

export default function GuestWishes() {
  const { event } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (guest?.name) setDisplayName(guest.name);
  }, [guest?.name]);

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["event-messages", event.id],
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

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: displayName.trim() || guest?.name || "Anonymous",
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-messages", event.id] });
      setMessage("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    mutation.mutate();
  };

  const formatRelative = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div>
      {/* Header */}
      <section className="guest-section text-center">
        <div className="mx-auto max-w-2xl">
          <p className="guest-eyebrow">Wishes</p>
          <h1 className="guest-title">Share Your Wishes</h1>
          <p className="guest-subtitle mx-auto">
            Leave a heartfelt message for {event.name}. Your words mean the world.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-xl">
          <form onSubmit={handleSubmit} className="event-card space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                Your Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="event-input"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="event-input"
                rows={4}
                placeholder="Write your wishes..."
                required
              />
            </div>
            {mutation.isError && (
              <p className="text-sm font-medium" style={{ color: "var(--event-primary)" }}>
                Failed to post your message. Please try again.
              </p>
            )}
            <button
              type="submit"
              disabled={mutation.isPending || !message.trim()}
              className="event-btn-primary w-full"
              style={{ opacity: mutation.isPending || !message.trim() ? 0.6 : 1 }}
            >
              {mutation.isPending ? "Posting..." : "Post Wish"}
            </button>
          </form>
        </div>
      </section>

      {/* Messages */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="guest-subtitle mx-auto">Couldn't load messages. Please try again later.</p>
            </div>
          ) : (messages ?? []).length === 0 ? (
            <div className="text-center py-12">
              <p className="guest-subtitle mx-auto">No wishes yet. Be the first to leave a message!</p>
            </div>
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {(messages ?? []).map((msg, i) => (
                <div
                  key={msg.id}
                  className="event-card mb-4 break-inside-avoid animate-slideUpStagger"
                  style={{ animationDelay: `${Math.min(i * 60, 600)}ms` }}
                >
                  <p className="rich-content" style={{ color: "var(--event-text)" }}>
                    {msg.message}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: "var(--event-heading)" }}>
                      {msg.guest_name ?? "Anonymous"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--event-muted)" }}>
                      {formatRelative(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
