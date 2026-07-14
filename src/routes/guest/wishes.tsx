import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useGuestOutletContext } from "./guest-layout";
import { cn } from "../../lib/utils";

const PAGE_SIZE = 12;

export default function GuestWishes() {
  const { event, slug } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (guest?.name) setName(guest.name);
  }, [guest?.name]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["guest-wishes", event.id, PAGE_SIZE],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE * (page + 1));
      if (error) throw error;
      return (rows ?? []) as EventMessage[];
    },
    enabled: !!event.id,
  });

  const messages = data ?? [];
  const hasMore = messages.length === PAGE_SIZE * (page + 1);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching) setPage((p) => p + 1);
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isFetching]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const trimmed = message.trim();
      if (!trimmed) throw new Error("Please write a message.");
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: name.trim() || "Anonymous",
        message: trimmed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-wishes", event.id, PAGE_SIZE] });
      setMessage("");
      setPage(0);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center">
          <p className="guest-eyebrow">Wishes</p>
          <h1 className="guest-title">Send your love</h1>
          <p className="guest-subtitle mx-auto">Share a message, blessing, or fond memory for {event.name}.</p>
        </header>

        <form onSubmit={handleSubmit} className="event-card mb-12 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="event-input"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
              Your wish
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="event-input"
              rows={4}
              placeholder="Write a heartfelt message..."
              required
            />
          </div>
          {submitMutation.isError && (
            <p className="text-sm font-medium" style={{ color: "var(--event-primary)" }}>
              {submitMutation.error instanceof Error ? submitMutation.error.message : "Failed to post your wish."}
            </p>
          )}
          {submitMutation.isSuccess && (
            <p className="text-sm font-medium animate-fadeIn" style={{ color: "var(--event-primary)" }}>
              Thank you! Your wish has been shared.
            </p>
          )}
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="event-btn-primary w-full"
            style={{ opacity: submitMutation.isPending ? 0.6 : 1 }}
          >
            {submitMutation.isPending ? "Posting..." : "Share your wish"}
          </button>
        </form>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="event-card mx-auto max-w-md text-center">
            <p className="guest-subtitle">No wishes yet. Be the first to share your love.</p>
          </div>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                className={cn(
                  "event-card mb-5 break-inside-avoid animate-slideUpStagger",
                )}
                style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}
              >
                <p className="mb-3 whitespace-pre-line" style={{ color: "var(--event-text)" }}>
                  {msg.message}
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--event-heading)" }}>
                  — {msg.guest_name}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--event-muted)" }}>
                  {new Date(msg.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}
        <div ref={sentinelRef} className="h-4" />
        {isFetching && !isLoading && (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
