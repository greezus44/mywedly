import { useState } from "react";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { formatDate } from "../../lib/utils";

export default function GuestWishes() {
  const { event } = useGuestOutletContext();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: messages, isLoading } = useQuery({
    queryKey: ["guest-wishes", event.id],
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

  const postMessage = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guestName || "Anonymous",
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["guest-wishes", event.id] });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Wishes</h1>

      <div className="event-card">
        <h2 className="mb-3 text-lg font-semibold">Leave a Wish</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="event-input"
          rows={3}
          placeholder="Write your wishes here..."
        />
        <button
          onClick={() => postMessage.mutate()}
          disabled={!message.trim() || postMessage.isPending}
          className="event-btn-primary mt-3 disabled:opacity-50"
        >
          {postMessage.isPending ? "Posting..." : "Post Wish"}
        </button>
        {postMessage.isError && <p className="mt-2 text-sm text-red-600">Failed to post. Please try again.</p>}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-event-primary border-t-transparent" /></div>
      ) : (
        <div className="space-y-4">
          {messages?.length === 0 && (
            <p className="text-center opacity-70">No wishes yet. Be the first to leave a wish!</p>
          )}
          {messages?.map((msg) => (
            <div key={msg.id} className="event-card">
              <p className="font-semibold">{msg.guest_name}</p>
              <p className="mt-1 text-sm opacity-80">{msg.message}</p>
              <p className="mt-2 text-xs opacity-50">{formatDate(msg.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
