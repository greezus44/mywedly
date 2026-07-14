import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";

interface WishRow {
  id: string;
  event_id: string;
  guest_id: string | null;
  guest_name: string;
  message: string;
  created_at: string;
}

export default function GuestWishes() {
  const { event } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: wishes, isLoading, isError } = useQuery({
    queryKey: ["guest-wishes", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WishRow[];
    },
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      const trimmed = message.trim();
      if (!trimmed) throw new Error("Please enter a message.");
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_id: guest?.id ?? null,
        guest_name: guest?.name ?? "Anonymous",
        message: trimmed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-wishes", event.id] });
      setMessage("");
    },
  });

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-2xl">
        <p className="guest-eyebrow text-center">Wishes</p>
        <h1 className="guest-title mb-2 text-center">Share your wishes</h1>
        <p className="guest-subtitle mb-8 text-center">Leave a heartfelt message for {event.name}.</p>

        <div className="event-card mb-8 space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="event-input min-h-[100px]"
            placeholder="Write your wish…"
          />
          {postMutation.isError && (
            <p className="text-sm" style={{ color: "var(--event-primary)" }}>
              {postMutation.error instanceof Error ? postMutation.error.message : "Failed to post wish."}
            </p>
          )}
          <button
            type="button"
            onClick={() => postMutation.mutate()}
            disabled={postMutation.isPending || !message.trim()}
            className="event-btn-primary w-full"
            style={{ opacity: postMutation.isPending || !message.trim() ? 0.6 : 1 }}
          >
            {postMutation.isPending ? "Posting…" : "Post Wish"}
          </button>
        </div>

        {isLoading && (
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} />
          </div>
        )}

        {isError && (
          <p className="text-center text-sm" style={{ color: "var(--event-primary)" }}>Failed to load wishes.</p>
        )}

        {wishes && wishes.length === 0 && (
          <p className="text-center text-sm" style={{ color: "var(--event-muted)" }}>No wishes yet. Be the first to share one!</p>
        )}

        {wishes && wishes.length > 0 && (
          <div className="space-y-4">
            {wishes.map((w) => (
              <div key={w.id} className="event-info-card">
                <p style={{ color: "var(--event-text)" }}>{w.message}</p>
                <p className="mt-2 text-sm font-semibold" style={{ color: "var(--event-heading)" }}>— {w.guest_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
