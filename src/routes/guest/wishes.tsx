import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDateTime } from "../../lib/utils";

export default function Wishes() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["guest_event_messages", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventMessage[];
    },
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guestName || "Guest",
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_event_messages", event.id] });
      setMessage("");
      setError(null);
    },
    onError: () => setError("Failed to post message. Please try again."),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    postMutation.mutate();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="font-event text-2xl text-event-heading">Wishes</h2>
        <p className="mt-1 text-event-muted">Share your well wishes with us.</p>
      </div>

      <form onSubmit={handleSubmit} className="event-card space-y-3">
        <div>
          <label className="block text-sm font-medium text-event-text mb-1">Your Message</label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="event-input"
            placeholder="Write your wish..."
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={!message.trim() || postMutation.isPending} className="event-btn-primary w-full">
          {postMutation.isPending ? "Posting…" : "Post Wish"}
        </button>
      </form>

      {isLoading ? (
        <p className="text-center text-event-muted">Loading messages…</p>
      ) : !messages || messages.length === 0 ? (
        <p className="text-center text-event-muted">No wishes yet. Be the first to share!</p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="event-card">
              <p className="text-event-text whitespace-pre-wrap">{msg.message}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-event-muted">
                <span className="font-medium">— {msg.guest_name}</span>
                <span>{formatDateTime(msg.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
