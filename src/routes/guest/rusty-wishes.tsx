import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";

export default function RustyWishes() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: messages, isLoading, isError, refetch } = useQuery({
    queryKey: ["event_messages", event.id],
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
        guest_name: guestName || "Anonymous",
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["event_messages", event.id] });
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Wishes & Messages</h1>
        <p className="mt-1 opacity-70">Leave a message for the hosts.</p>
      </div>

      <div className="event-card space-y-3">
        <textarea
          className="event-input min-h-[100px]"
          placeholder="Write your message…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
        />
        {postMutation.isError && (
          <p className="text-sm text-red-500">
            {postMutation.error instanceof Error ? postMutation.error.message : "Failed to post"}
          </p>
        )}
        <button
          onClick={() => postMutation.mutate()}
          disabled={postMutation.isPending || !message.trim()}
          className="event-btn-primary w-full disabled:opacity-50"
        >
          {postMutation.isPending ? "Posting…" : "Post Message"}
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse text-center opacity-70">Loading messages…</div>
      ) : isError ? (
        <div className="event-card text-center">
          <p className="text-sm opacity-70">Failed to load messages.</p>
          <button onClick={() => refetch()} className="event-btn-secondary mt-3">Try again</button>
        </div>
      ) : (messages ?? []).length === 0 ? (
        <div className="event-card text-center">
          <p className="opacity-70">No messages yet. Be the first to leave a wish!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(messages ?? []).map((msg) => (
            <div key={msg.id} className="event-card space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{msg.guest_name}</span>
                <span className="text-xs opacity-60">
                  {new Date(msg.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
