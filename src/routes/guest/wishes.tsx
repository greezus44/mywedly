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

  const mutation = useMutation({
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
      setMessage("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["guest-wishes", event.id] });
    },
    onError: (err: Error) => setError(err.message || "Failed to post message"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    mutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="guest-section flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );
  }

  const list = messages ?? [];

  return (
    <div>
      {/* Header */}
      <section className="guest-section text-center">
        <div className="mx-auto max-w-2xl">
          <p className="guest-eyebrow">Wishes</p>
          <h1 className="guest-title">Share Your Well Wishes</h1>
          <p className="guest-subtitle mx-auto">Leave a message for the hosts and other guests to see.</p>
        </div>
      </section>

      {/* Form */}
      {guest && (
        <section className="guest-section-tight">
          <div className="mx-auto max-w-xl">
            <form onSubmit={handleSubmit} className="event-card space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                  Your Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="event-input"
                  rows={3}
                  placeholder="Write your wishes here..."
                  maxLength={500}
                  required
                />
                <p className="mt-1 text-right text-xs" style={{ color: "var(--event-muted)" }}>
                  {message.length} / 500
                </p>
              </div>
              {error && <p className="text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>}
              <button
                type="submit"
                disabled={mutation.isPending || !message.trim()}
                className="event-btn-primary w-full"
                style={{ opacity: mutation.isPending || !message.trim() ? 0.6 : 1 }}
              >
                {mutation.isPending ? "Posting..." : "Post Wish"}
              </button>
              {mutation.isSuccess && (
                <p className="text-sm font-medium animate-fadeIn" style={{ color: "var(--event-primary)" }}>
                  Your wish has been posted!
                </p>
              )}
            </form>
          </div>
        </section>
      )}

      {/* Messages */}
      <section className="guest-section-tight">
        <div className="mx-auto max-w-4xl">
          {list.length === 0 ? (
            <div className="event-card mx-auto max-w-md text-center">
              <p className="guest-subtitle">No wishes yet. Be the first to share a message!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {list.map((msg, i) => (
                <div
                  key={msg.id}
                  className="event-card animate-slideUpStagger"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <p className="rich-content mb-3" style={{ fontStyle: "italic" }}>
                    “{msg.message}”
                  </p>
                  <p className="guest-eyebrow" style={{ marginBottom: 0 }}>
                    — {msg.guest_name}
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
