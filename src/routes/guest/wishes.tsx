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
  const [name, setName] = useState("");
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
      const guestName = name.trim() || guest?.name || "Anonymous";
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guestName,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-wishes", event.id] });
      setMessage("");
      setError(null);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to post your wish.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    mutation.mutate();
  };

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="guest-eyebrow">Wishes</p>
          <h1 className="guest-title">Share Your Wishes</h1>
          <p className="guest-subtitle mx-auto">
            Leave a heartfelt message for {event.name} to cherish.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="event-card mb-10 space-y-4">
          {!guest && (
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="event-input"
                placeholder="Enter your name"
                required
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="event-input"
              rows={4}
              placeholder="Write your wishes here..."
              required
            />
          </div>
          {error && (
            <p className="text-sm font-medium" style={{ color: "var(--event-primary)" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="event-btn-primary w-full"
            style={{ opacity: mutation.isPending ? 0.6 : 1 }}
          >
            {mutation.isPending ? "Posting..." : "Post Wish"}
          </button>
          {mutation.isSuccess && (
            <p className="animate-fadeIn text-center text-sm font-medium" style={{ color: "var(--event-primary)" }}>
              Thank you! Your wish has been shared.
            </p>
          )}
        </form>

        {/* Messages */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
          </div>
        ) : (messages ?? []).length === 0 ? (
          <div className="text-center">
            <p className="guest-subtitle mx-auto">
              No wishes yet. Be the first to leave a message!
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {(messages ?? []).map((msg, index) => (
              <div
                key={msg.id}
                className="event-card animate-slideUpStagger"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <p className="mb-3" style={{ color: "var(--event-text)" }}>{msg.message}</p>
                <p className="text-sm font-medium" style={{ color: "var(--event-muted)" }}>
                  — {msg.guest_name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
