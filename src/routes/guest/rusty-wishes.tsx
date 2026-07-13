import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDate } from "../../lib/utils";

export default function RustyWishes() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: messages, isLoading, isError, refetch } = useQuery({
    queryKey: ["guest-messages", event.id],
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

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!message.trim()) throw new Error("Please enter a message");
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guestName ?? "Guest",
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["guest-messages", event.id] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    postMutation.mutate();
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-3xl font-bold" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>
          Wishes
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: "var(--event-muted)" }}>
          Share your well wishes and messages.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 event-card">
          <textarea
            placeholder="Write your wish here…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="event-input"
            rows={4}
          />
          {postMutation.isError && (
            <p className="mt-2 text-sm text-red-600">
              {postMutation.error instanceof Error ? postMutation.error.message : "Failed to post"}
            </p>
          )}
          {postMutation.isSuccess && (
            <p className="mt-2 text-sm text-green-600">Your wish has been posted!</p>
          )}
          <button
            type="submit"
            disabled={postMutation.isPending || !message.trim()}
            className="event-btn-primary mt-3 w-full disabled:opacity-50"
          >
            {postMutation.isPending ? "Posting…" : "Post Wish"}
          </button>
        </form>

        {/* Messages */}
        <div className="mt-8 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse text-gray-400">Loading…</div>
            </div>
          ) : isError ? (
            <div className="event-card text-center">
              <p className="text-sm" style={{ color: "var(--event-muted)" }}>
                Failed to load messages.{" "}
                <button onClick={() => refetch()} className="underline">
                  Try again
                </button>
              </p>
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="event-card text-center">
              <p className="text-sm" style={{ color: "var(--event-muted)" }}>
                No wishes yet. Be the first to leave a message!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="event-card">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold" style={{ color: "var(--event-heading)" }}>
                    {msg.guest_name}
                  </h3>
                  <span className="text-xs" style={{ color: "var(--event-muted)" }}>
                    {formatDate(msg.created_at)}
                  </span>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap" style={{ color: "var(--event-text)" }}>
                  {msg.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
