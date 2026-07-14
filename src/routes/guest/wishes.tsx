import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDateTime } from "../../lib/utils";

export default function GuestWishes() {
  const { event, slug } = useGuestOutletContext();
  const { guest } = useGuestAuth();
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
      return (data ?? []) as EventMessage[];
    },
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      const trimmed = message.trim();
      if (!trimmed) throw new Error("Please enter a message.");
      if (!guest) throw new Error("Not authenticated.");
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guest.name,
        message: trimmed,
      } as Record<string, unknown>);
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["guest-wishes", event.id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const list = messages ?? [];

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <p className="guest-eyebrow">Share Your Love</p>
          <h1 className="guest-title">Wishes Wall</h1>
          <p className="guest-subtitle mx-auto">Leave a message for the hosts and other guests.</p>
        </div>

        {/* Post form */}
        <div className="event-card mb-8">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="event-input mb-3"
            rows={3}
            placeholder="Write your wish here..."
          />
          <div className="text-right">
            <button
              type="button"
              onClick={() => postMutation.mutate()}
              disabled={postMutation.isPending}
              className="event-btn-primary"
              style={{ opacity: postMutation.isPending ? 0.6 : 1 }}
            >
              {postMutation.isPending ? "Posting..." : "Post Wish"}
            </button>
          </div>
          {postMutation.isError && (
            <p className="mt-3 text-sm" style={{ color: "var(--event-primary)" }}>
              {postMutation.error instanceof Error ? postMutation.error.message : "Failed to post."}
            </p>
          )}
        </div>

        {/* Messages list */}
        {list.length === 0 ? (
          <div className="text-center py-12">
            <p className="guest-subtitle">No wishes yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((msg) => {
              const m = msg as EventMessage & { guest_name?: string };
              return (
              <div key={msg.id} className="event-card animate-fadeIn">
                <p className="font-semibold mb-1" style={{ color: "var(--event-heading)" }}>
                  {m.guest_name || "Anonymous"}
                </p>
                <p className="mb-2" style={{ color: "var(--event-text)" }}>{msg.message}</p>
                <p className="text-xs" style={{ color: "var(--event-muted)" }}>
                  {formatDateTime(msg.created_at)}
                </p>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
