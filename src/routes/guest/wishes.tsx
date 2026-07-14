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
  const [authorName, setAuthorName] = useState(guest?.name ?? "");
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

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: authorName.trim() || "Anonymous",
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-wishes", event.id] });
      setMessage("");
      setError(null);
    },
    onError: () => {
      setError("Failed to post your wish. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitMutation.mutate();
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const allMessages = messages ?? [];

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center animate-fadeIn">
          <p className="guest-eyebrow">Wishes Wall</p>
          <h1 className="guest-title">Send Your Wishes</h1>
          <p className="guest-subtitle mx-auto">
            Share a message of love, advice, or congratulations with the happy couple.
          </p>
        </div>

        {/* Form */}
        <div className="event-card mb-10 animate-slideUp">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                Your Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="event-input"
                placeholder="Your name"
                required
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
                placeholder="Write your wish here..."
                required
              />
            </div>
            {error && (
              <p className="text-sm font-medium" style={{ color: "var(--event-primary)" }}>{error}</p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitMutation.isPending || !message.trim()}
                className="event-btn-primary"
                style={{ opacity: submitMutation.isPending || !message.trim() ? 0.6 : 1 }}
              >
                {submitMutation.isPending ? "Posting..." : "Post Wish"}
              </button>
            </div>
            {submitMutation.isSuccess && (
              <p className="text-sm font-medium animate-fadeIn" style={{ color: "var(--event-primary)" }}>
                Your wish has been posted. Thank you!
              </p>
            )}
          </form>
        </div>

        {/* Messages */}
        {isLoading ? (
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="text-center animate-fadeIn">
            <p className="guest-subtitle mx-auto">
              No wishes yet. Be the first to leave a message!
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {allMessages.map((msg, index) => (
              <div
                key={msg.id}
                className="event-card animate-slideUpStagger"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: "var(--event-primary)",
                      color: "var(--event-primary-fg)",
                    }}
                  >
                    {msg.guest_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--event-heading)" }}>
                      {msg.guest_name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--event-muted)" }}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--event-text)" }}>
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
