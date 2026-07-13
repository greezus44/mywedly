import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDateTime } from "../../lib/utils";

export default function RustyWishes() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: messages, isLoading, error, refetch } = useQuery({
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
        guest_name: guestName || "Anonymous",
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_event_messages", event.id] });
      setMessage("");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    postMutation.mutate();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl mb-2 text-center" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>
        Wishes & Messages
      </h2>
      <p className="text-sm text-center mb-8" style={{ color: "var(--event-muted)" }}>
        Leave a message for {event.name}.
      </p>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="rounded-lg p-4" style={{ backgroundColor: "var(--event-surface)", border: "1px solid var(--event-border)" }}>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message..."
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none mb-3"
            style={{ backgroundColor: "var(--event-bg)", border: "1px solid var(--event-border)", color: "var(--event-text)" }}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--event-muted)" }}>
              Posting as {guestName || "Guest"}
            </span>
            <button
              type="submit"
              disabled={!message.trim() || postMutation.isPending}
              className="py-2 px-4 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: "var(--event-primary)", color: "var(--event-primary-fg)" }}
            >
              {postMutation.isPending && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Post Message
            </button>
          </div>
          {postMutation.isError && (
            <p className="text-sm mt-2" style={{ color: "#a54434" }}>
              Failed to post message. Please try again.
            </p>
          )}
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 rounded-full" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: "var(--event-muted)" }}>Failed to load messages.</p>
          <button onClick={() => refetch()} className="text-sm underline mt-2" style={{ color: "var(--event-primary)" }}>
            Try again
          </button>
        </div>
      ) : messages && messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="rounded-lg p-4" style={{ backgroundColor: "var(--event-surface)", border: "1px solid var(--event-border)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm" style={{ color: "var(--event-heading)" }}>
                  {msg.guest_name}
                </span>
                <span className="text-xs" style={{ color: "var(--event-muted)" }}>
                  {formatDateTime(msg.created_at)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--event-text)" }}>
                {msg.message}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: "var(--event-muted)" }}>
            No messages yet. Be the first to leave a wish!
          </p>
        </div>
      )}
    </div>
  );
}
