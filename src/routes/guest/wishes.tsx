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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    enabled: !!event?.id,
  });

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const guestName = guest?.name || "Anonymous";
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
      setSuccess(true);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await submitMutation.mutateAsync();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post your wish. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatRelative = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = Date.now();
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const list = messages ?? [];

  return (
    <div>
      <section className="guest-section text-center">
        <div className="mx-auto max-w-2xl">
          <p className="guest-eyebrow">Wishes</p>
          <h1 className="guest-title">Share Your Wishes</h1>
          <p className="guest-subtitle mx-auto">Leave a heartfelt message for {event.name}.</p>
        </div>
      </section>

      <section className="guest-section-tight" style={{ backgroundColor: "var(--event-surface-alt)" }}>
        <div className="mx-auto max-w-lg">
          <form onSubmit={handleSubmit} className="event-card space-y-4">
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
                maxLength={500}
              />
              <p className="mt-1 text-right text-xs" style={{ color: "var(--event-muted)" }}>
                {message.length}/500
              </p>
            </div>
            {error && <p className="text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>}
            {success && <p className="text-sm animate-fadeIn" style={{ color: "var(--event-primary)" }}>Your wish has been shared!</p>}
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="event-btn-primary w-full"
              style={{ opacity: submitting || !message.trim() ? 0.6 : 1 }}
            >
              {submitting ? "Posting..." : "Share Wish"}
            </button>
          </form>
        </div>
      </section>

      <section className="guest-section">
        <div className="mx-auto max-w-5xl">
          {isLoading ? (
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center">
              <p className="guest-subtitle mx-auto">No wishes yet. Be the first to share a message!</p>
            </div>
          ) : (
            <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
              {list.map((msg, index) => (
                <div
                  key={msg.id}
                  className="event-card mb-6 break-inside-avoid animate-slideUpStagger"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <p className="mb-3 text-base leading-relaxed" style={{ color: "var(--event-text)" }}>
                    {msg.message}
                  </p>
                  <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--event-border)" }}>
                    <span className="text-sm font-semibold" style={{ color: "var(--event-heading)" }}>
                      {msg.guest_name}
                    </span>
                    <span className="text-xs" style={{ color: "var(--event-muted)" }}>
                      {formatRelative(msg.created_at)}
                    </span>
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
