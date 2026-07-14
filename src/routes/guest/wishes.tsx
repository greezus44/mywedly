import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDateTime } from "../../lib/utils";

export default function GuestWishes() {
  const { event } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: messages, isLoading } = useQuery({
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
      if (!guest) throw new Error("Not signed in");
      if (!message.trim()) throw new Error("Please write a message.");
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
      queryClient.invalidateQueries({ queryKey: ["event-messages", event.id] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const list = messages ?? [];

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="guest-eyebrow">Wishes</p>
          <h1 className="guest-title">Share Your Wishes</h1>
          <p className="guest-subtitle mx-auto">Leave a message for {event.name} to cherish.</p>
        </div>

        {/* Form */}
        {guest ? (
          <form onSubmit={handleSubmit} className="event-card mb-12 space-y-4 animate-fadeIn">
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                Your message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="event-input"
                rows={4}
                placeholder="Write your wishes..."
                maxLength={500}
                required
              />
              <p className="mt-1 text-right text-xs" style={{ color: "var(--event-muted)" }}>
                {message.length}/500
              </p>
            </div>
            {error && <p className="text-sm font-medium" style={{ color: "var(--event-primary)" }}>{error}</p>}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="event-btn-primary w-full"
              style={{ opacity: mutation.isPending ? 0.6 : 1 }}
            >
              {mutation.isPending ? "Sending..." : "Send Wishes"}
            </button>
            {mutation.isSuccess && (
              <p className="text-sm font-medium animate-fadeIn" style={{ color: "var(--event-primary)" }}>
                Thank you! Your wishes have been sent.
              </p>
            )}
          </form>
        ) : (
          <div className="event-card mb-12 text-center animate-fadeIn">
            <p className="guest-subtitle">Please sign in to leave a message.</p>
          </div>
        )}

        {/* Messages */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
          </div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center">
            <p className="guest-subtitle mx-auto">No wishes yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2">
            {list.map((msg, index) => (
              <div
                key={msg.id}
                className="event-card mb-6 break-inside-avoid animate-slideUpStagger"
                style={{ animationDelay: `${index * 80}ms`, padding: "1.5rem" }}
              >
                <p className="text-sm leading-relaxed" style={{ color: "var(--event-text)" }}>
                  {msg.message}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "var(--event-heading)" }}>
                    {msg.guest_name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--event-muted)" }}>
                    {formatDateTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
