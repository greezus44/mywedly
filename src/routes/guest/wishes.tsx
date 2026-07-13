import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Heart } from "lucide-react";
import { supabase, EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Textarea } from "../../components/ui/Input";
import { ErrorState, Skeleton, EmptyState } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import type { GuestLayoutContext } from "./guest-layout";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export default function Wishes() {
  const { event } = useOutletContext<GuestLayoutContext>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const theme = event.theme;
  const content = event.content;

  const [message, setMessage] = useState("");

  const { data: messages, isLoading, error, refetch } = useQuery<EventMessage[]>({
    queryKey: ["event-messages", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as EventMessage[]) || [];
    },
  });

  const mutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["event-messages", event.id] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    mutation.mutate();
  };

  return (
    <div className="w-full pb-20" style={{ backgroundColor: theme.bgColor }}>
      <div
        className="text-center py-12 px-6"
        style={{ padding: `${theme.sectionPadding}px 24px` }}
      >
        <Heart
          className="w-8 h-8 mx-auto mb-3"
          style={{ color: theme.primaryColor }}
        />
        <p
          className="text-base mb-2 opacity-70"
          style={{ fontFamily: `var(--wed-script-font)` }}
        >
          {content.doa_description || "Share your wishes for the event"}
        </p>
        <h1
          className="text-4xl font-bold mb-4"
          style={{
            fontFamily: `var(--wed-heading-font)`,
            color: theme.headingColor,
          }}
        >
          {content.doa_title || "Wishes"}
        </h1>
        <div
          className="w-12 h-px mx-auto"
          style={{ backgroundColor: theme.primaryColor, opacity: 0.5 }}
        />
      </div>

      <div
        className="px-6 pb-8"
        style={{ maxWidth: `${theme.maxWidth}px`, margin: "0 auto" }}
      >
        <form onSubmit={handleSubmit} className="mb-10">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your wish or message..."
            rows={3}
            style={{
              borderColor: `color-mix(in srgb, ${theme.accentColor} 30%, transparent)`,
              backgroundColor: theme.bgColor,
              color: theme.bodyColor,
            }}
          />
          {mutation.isError && (
            <p className="text-sm text-red-600 mt-2">
              {(mutation.error as Error)?.message}
            </p>
          )}
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={mutation.isPending || !message.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: theme.buttonBgColor,
                color: theme.buttonTextColor,
                borderRadius: `${theme.buttonRadius}px`,
              }}
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Wish
            </button>
          </div>
        </form>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            message={(error as Error)?.message || "Failed to load messages."}
            onRetry={() => refetch()}
          />
        ) : !messages || messages.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-12 h-12" />}
            title="No wishes yet"
            description="Be the first to share a message!"
          />
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-5 rounded-xl"
                style={{
                  backgroundColor: `color-mix(in srgb, ${theme.bgColor} 60%, #ffffff)`,
                  border: `1px solid color-mix(in srgb, ${theme.accentColor} 20%, transparent)`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: theme.buttonTextColor,
                      fontFamily: `var(--wed-heading-font)`,
                    }}
                  >
                    {msg.guest_name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: theme.headingColor }}
                      >
                        {msg.guest_name}
                      </p>
                      <span
                        className="text-xs opacity-50 flex-shrink-0"
                        style={{ color: theme.bodyColor }}
                      >
                        {timeAgo(msg.created_at)}
                      </span>
                    </div>
                    <p
                      className="text-sm mt-1.5 leading-relaxed"
                      style={{ color: theme.bodyColor }}
                    >
                      {msg.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
