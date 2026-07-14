import { useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { LoadingSpinner, ErrorState } from "../../components/ui";
import { formatDateShort, formatTime12 } from "../../lib/utils";

export default function Wishes() {
  const { slug } = useParams<{ slug: string }>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["guest-event-messages", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", event!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventMessage[];
    },
    enabled: !!event?.id,
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: event!.id,
        guest_name: guestName ?? "Anonymous",
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-event-messages"] });
      setMessage("");
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to post message");
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !event) return;
    postMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !event) {
    return <ErrorState title="This invitation website could not be found or is no longer available." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h2
          className="text-2xl font-bold text-event-heading"
          style={{ fontFamily: "var(--event-font-heading)" }}
        >
          Wishes
        </h2>
        <p className="mt-1 text-sm text-event-muted">
          Leave a message for {event.name}
        </p>
      </header>

      {/* Post a message */}
      <form onSubmit={handleSubmit} className="event-card flex flex-col gap-3">
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="event-input"
          placeholder="Write your wishes here..."
          maxLength={500}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={postMutation.isPending || !message.trim()}
          className="event-btn-primary"
        >
          {postMutation.isPending ? "Posting..." : "Post Message"}
        </button>
      </form>

      {/* Messages wall */}
      {messagesLoading ? (
        <div className="flex h-32 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : messages && messages.length > 0 ? (
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <div key={msg.id} className="event-card">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-event-heading">
                  {msg.guest_name}
                </span>
                <span className="text-xs text-event-muted">
                  {formatDateShort(msg.created_at)}{" "}
                  {formatTime12(msg.created_at.split("T")[1]?.slice(0, 5) ?? null)}
                </span>
              </div>
              <p className="mt-2 text-sm text-event-text">{msg.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="event-card text-center text-event-muted">
          No messages yet. Be the first to leave a wish!
        </div>
      )}
    </div>
  );
}
