import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDateTime } from "../../lib/utils";

export default function GuestWishesPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const auth = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["guest-messages", event.id],
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
        guest_name: auth.guestName ?? "Guest",
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-messages", event.id] });
      setMessage("");
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to post message.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    postMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold text-event-heading">Wishes</h1>
      <p className="mb-6 text-event-muted">
        Leave a message for {event.name}.
      </p>

      {/* Post form */}
      <form onSubmit={handleSubmit} className="event-card mb-8 space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="event-input min-h-[100px]"
          placeholder="Write your wishes…"
          maxLength={1000}
        />
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!message.trim() || postMutation.isPending}
            className="event-btn-primary disabled:opacity-60"
          >
            {postMutation.isPending ? "Posting…" : "Post message"}
          </button>
        </div>
      </form>

      {/* Messages list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-event-primary border-t-transparent" />
        </div>
      ) : messages && messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="event-card">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold text-event-heading">
                  {msg.guest_name}
                </span>
                <span className="text-xs text-event-muted">
                  {formatDateTime(msg.created_at)}
                </span>
              </div>
              <p className="text-event-text whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-event-muted">
          No messages yet. Be the first to leave a wish!
        </p>
      )}
    </div>
  );
}
