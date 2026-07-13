import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase, EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { EmptyState, Skeleton } from "../../components/ui/index";
import { MessageCircleHeart, Send, Heart } from "lucide-react";
import type { FormEvent } from "react";
import type { GuestLayoutContext } from "./guest-layout";

export default function Wishes() {
  const { eventId } = useParams<{ eventId: string }>();
  const { event } = useOutletContext<GuestLayoutContext>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const theme = event.theme;

  const [message, setMessage] = useState("");

  const { data: messages, isLoading, error } = useQuery<EventMessage[]>({
    queryKey: ["event-messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  const submitMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId || !guestName) throw new Error("Please sign in to send a message");
      const { error } = await supabase.from("event_messages").insert({
        event_id: eventId,
        guest_name: guestName,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["event-messages", eventId] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitMutation.mutate();
  };

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen px-6 py-12" style={{ backgroundColor: theme.bgColor, color: theme.bodyColor, fontFamily: theme.bodyFont }}>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${theme.accentColor}20` }}
          >
            <MessageCircleHeart className="w-7 h-7" style={{ color: theme.primaryColor }} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: theme.headingFont, color: theme.headingColor }}>
            Wishes & Messages
          </h1>
          <p className="text-sm opacity-70" style={{ color: theme.bodyColor }}>
            Share your love and well wishes with us
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-10">
          <div className="p-5 bg-white border rounded-xl" style={{ borderColor: `${theme.accentColor}30`, backgroundColor: theme.bgColor }}>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message..."
              rows={3}
              style={{
                borderColor: `${theme.accentColor}30`,
                color: theme.bodyColor,
                backgroundColor: theme.bgColor,
              }}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs opacity-50" style={{ color: theme.bodyColor }}>
                {guestName ? `Posting as ${guestName}` : "Sign in to post"}
              </span>
              <Button
                type="submit"
                size="sm"
                loading={submitMutation.isPending}
                disabled={!message.trim() || !guestName}
                style={{
                  backgroundColor: theme.buttonBgColor,
                  color: theme.buttonTextColor,
                  borderRadius: `${theme.buttonRadius}px`,
                }}
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </Button>
            </div>
            {(submitMutation as any).error && (
              <p className="text-xs mt-2" style={{ color: "#dc2626" }}>
                {(submitMutation as any).error.message || "Could not send message."}
              </p>
            )}
          </div>
        </form>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm opacity-60" style={{ color: theme.bodyColor }}>
              Could not load messages. Please try again later.
            </p>
          </div>
        ) : !messages || messages.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-10 h-10" />}
            title="No messages yet"
            description="Be the first to share your wishes!"
          />
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-5 bg-white border rounded-xl"
                style={{ borderColor: `${theme.accentColor}25`, backgroundColor: theme.bgColor }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                    style={{
                      backgroundColor: `${theme.accentColor}20`,
                      color: theme.primaryColor,
                    }}
                  >
                    {msg.guest_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold truncate" style={{ color: theme.headingColor }}>
                        {msg.guest_name}
                      </span>
                      <span className="text-xs opacity-50 flex-shrink-0" style={{ color: theme.bodyColor }}>
                        {formatDateShort(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: theme.bodyColor }}>
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
