import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useGuestOutletContext } from "./guest-layout";
import { LoadingSpinner } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";

interface WishesConfig {
  heading?: string;
  subheading?: string;
  placeholder?: string;
  submitLabel?: string;
}

function getWishesConfig(content: unknown): WishesConfig {
  if (!content || typeof content !== "object" || Array.isArray(content)) return {};
  return ((content as Record<string, unknown>).wishes ?? {}) as WishesConfig;
}

export default function GuestWishesPage() {
  const { event } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();

  const cfg = getWishesConfig(event.content);
  const heading = cfg.heading ?? "Wishes & Messages";
  const subheading = cfg.subheading ?? "Leave a heartfelt message for the couple";
  const placeholder = cfg.placeholder ?? "Write your message here…";
  const submitLabel = cfg.submitLabel ?? "Send wishes";

  const [message, setMessage] = useState("");

  const { data: wishes, isLoading } = useQuery({
    queryKey: ["wishes", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*, event_guests(full_name, username)")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (EventMessage & { event_guests: { full_name: string; username: string } | null })[];
    },
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!guest || !message.trim()) return;
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_id: guest.id,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["wishes", event.id] });
    },
  });

  return (
    <div className="min-h-screen px-6 py-12" style={{ backgroundColor: "var(--event-bg)" }}>
      <div className="mx-auto max-w-lg">
        <div className="text-center mb-8">
          <h1 className="guest-title mb-2">{heading}</h1>
          {subheading && <p style={{ color: "var(--event-muted)" }}>{subheading}</p>}
        </div>

        {/* Post form */}
        {guest && (
          <div className="event-card mb-8">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="event-input w-full resize-none mb-3"
            />
            {postMutation.isError && (
              <p className="text-sm text-red-500 mb-2">{(postMutation.error as Error)?.message}</p>
            )}
            <button
              type="button"
              onClick={() => postMutation.mutate()}
              disabled={postMutation.isPending || !message.trim()}
              className="event-btn-primary w-full"
            >
              {postMutation.isPending ? "Sending…" : submitLabel}
            </button>
          </div>
        )}

        {/* Wishes list */}
        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : !wishes || wishes.length === 0 ? (
          <p className="text-center" style={{ color: "var(--event-muted)" }}>
            No messages yet. Be the first to leave a wish!
          </p>
        ) : (
          <div className="space-y-4">
            {wishes.map((w) => (
              <div
                key={w.id}
                className="rounded-lg border px-4 py-3"
                style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-medium text-sm" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>
                    {w.event_guests?.full_name ?? "Guest"}
                  </span>
                  <span className="text-xs" style={{ color: "var(--event-muted)" }}>
                    {formatDateTime(w.created_at)}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--event-text)" }}>{w.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
