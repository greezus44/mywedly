import { useState } from "react";
import type { CSSProperties } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useOutletContext } from "react-router-dom";
import { MessageSquareHeart, Send } from "lucide-react";
import type { GuestLayoutContext } from "./guest-layout";
import { supabase, type EventMessage, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { EmptyState, ErrorState } from "../../components/ui";

export default function GuestWishes() {
  const { event } = useOutletContext<GuestLayoutContext>();
  const { eventId } = useParams<{ eventId: string }>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const theme = event.theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;

  const { data: messages, isLoading, isError, refetch } = useQuery<EventMessage[]>({
    queryKey: ["event-messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EventMessage[];
    },
    enabled: !!eventId,
  });

  const submitMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!guestName) throw new Error("Please sign in to leave a wish");
      const { error } = await supabase.from("event_messages").insert({
        event_id: eventId!,
        guest_name: guestName,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-messages", eventId] });
      setMessage("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitMutation.mutate();
  };

  return (
    <div
      style={{ ...cssVars, backgroundColor: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}
      className="min-h-screen px-4 py-8"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <MessageSquareHeart className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-accent)" }} />
          <h1 className="text-2xl md:text-3xl font-medium mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Wishes
          </h1>
          <p className="text-sm opacity-70">Share your wishes and messages</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-10">
          <div className="mb-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your wish..."
              rows={3}
            />
          </div>
          {(submitMutation as any).error && (
            <p className="text-sm text-red-600 mb-3">{(submitMutation as any).error.message}</p>
          )}
          <Button
            type="submit"
            loading={submitMutation.isPending}
            disabled={!message.trim() || submitMutation.isPending}
            style={{ backgroundColor: "var(--color-primary)", color: "#ffffff" }}
          >
            <Send className="w-4 h-4" />
            Send wish
          </Button>
        </form>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
                <div className="h-4 w-24 bg-current opacity-10 rounded mb-3" />
                <div className="h-3 w-full bg-current opacity-10 rounded mb-1.5" />
                <div className="h-3 w-2/3 bg-current opacity-10 rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load wishes" onRetry={() => refetch()} />
        ) : !messages || messages.length === 0 ? (
          <EmptyState
            title="No wishes yet"
            description="Be the first to leave a wish"
          />
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-5 rounded-xl"
                style={{ backgroundColor: "var(--color-bg-subtle)", border: "1px solid var(--color-border)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
                    {msg.guest_name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(msg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "var(--font-body)" }}>
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
