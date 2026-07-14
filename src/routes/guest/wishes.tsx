import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDateTime } from "../../lib/utils";

export default function Wishes() {
  const { event } = useGuestOutletContext();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    data: messages,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["guest_messages", event.id],
    enabled: !!event.id,
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
      const trimmed = message.trim();
      if (!trimmed) throw new Error("Please write a message.");
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guestName ?? "Guest",
        message: trimmed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      setError(null);
      queryClient.invalidateQueries({
        queryKey: ["guest_messages", event.id],
      });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to post message");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    postMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-center text-3xl font-bold text-event-heading">
        Wishes
      </h1>
      <p className="mb-6 text-center text-sm text-event-muted">
        Leave a message for {event.name}
      </p>

      {/* Post form */}
      <form
        onSubmit={handleSubmit}
        className="event-card mb-8 flex flex-col gap-3"
      >
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your wishes…"
          className="event-input min-h-[100px]"
          maxLength={1000}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={postMutation.isPending || !message.trim()}
          className="event-btn-primary self-end disabled:opacity-50"
        >
          {postMutation.isPending ? "Posting…" : "Post message"}
        </button>
      </form>

      {/* Messages list */}
      {isLoading ? (
        <div className="animate-pulse text-event-muted">Loading messages…</div>
      ) : isError ? (
        <div className="event-card text-center text-event-muted">
          Failed to load messages.
        </div>
      ) : !messages || messages.length === 0 ? (
        <div className="event-card text-center text-event-muted">
          No messages yet. Be the first to leave a wish!
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {messages.map((m) => (
            <div key={m.id} className="event-card">
              <p className="text-event-text">{m.message}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-event-muted">
                <span className="font-medium">— {m.guest_name}</span>
                <span>{formatDateTime(m.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
