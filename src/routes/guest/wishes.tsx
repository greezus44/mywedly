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

  const { data: messages, isLoading, isError, error: queryError } = useQuery({
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
    enabled: !!event.id,
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      const trimmed = message.trim();
      if (!trimmed) throw new Error("Please write a message.");
      if (!guest) throw new Error("Please sign in to post a wish.");
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guest.name,
        message: trimmed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["event-messages", event.id] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not post your wish."),
  });

  function formatDateShort(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="guest-title">Wishes</h1>
          <p className="guest-subtitle mx-auto">Share your well wishes with us.</p>
        </div>

        {/* Compose */}
        <div className="event-card mb-8 space-y-3">
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your wish…"
            className="event-input"
            maxLength={500}
          />
          {error && <p className="text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--event-muted)" }}>{message.length}/500</span>
            <button
              type="button"
              onClick={() => postMutation.mutate()}
              disabled={postMutation.isPending || !message.trim()}
              className="event-btn-primary"
              style={{ opacity: postMutation.isPending || !message.trim() ? 0.6 : 1 }}
            >
              {postMutation.isPending ? "Posting…" : "Post Wish"}
            </button>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--event-primary)] border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="event-card text-center">
            <p style={{ color: "var(--event-muted)" }}>{queryError instanceof Error ? queryError.message : "Could not load wishes."}</p>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="event-card text-center">
            <p className="guest-subtitle mx-auto">No wishes yet. Be the first to leave one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className="event-card animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold" style={{ color: "var(--event-heading)" }}>
                    {m.guest_name || "Anonymous"}
                  </span>
                  <span className="text-xs" style={{ color: "var(--event-muted)" }}>
                    {formatDateShort(m.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap" style={{ color: "var(--event-text)" }}>{m.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
