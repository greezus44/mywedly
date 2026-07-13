import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { DEFAULT_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/index";
import type { FormEvent } from "react";
import { Heart, MessageSquareHeart, Send } from "lucide-react";

export default function Wishes() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestName } = useGuestAuth();
  const theme = { ...DEFAULT_THEME, ...event.theme };
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: messages, isLoading } = useQuery<EventMessage[]>({
    queryKey: ["event-messages", event.id],
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

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!guestName) throw new Error("Not authenticated");
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guestName,
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

  const mutationError = (mutation as any).error as Error | undefined;

  return (
    <div style={{ background: theme.bgColor, color: theme.bodyColor, fontFamily: theme.bodyFont }}>
      <section
        className="px-6 py-12 text-center"
        style={{ maxWidth: theme.maxWidth, margin: "0 auto" }}
      >
        <div
          className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4"
          style={{ background: `${theme.primaryColor}15` }}
        >
          <MessageSquareHeart className="w-7 h-7" style={{ color: theme.primaryColor }} />
        </div>
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: theme.headingColor, fontFamily: theme.headingFont }}
        >
          Wishes & Messages
        </h2>
        <p className="text-sm" style={{ color: theme.bodyColor }}>
          Share your heartfelt wishes with {event.name}
        </p>
      </section>

      <section
        className="px-6 pb-8"
        style={{ maxWidth: theme.maxWidth, margin: "0 auto" }}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your wish or message..."
            rows={3}
            style={{
              background: theme.bgColor,
              color: theme.bodyColor,
              borderColor: `${theme.accentColor}40`,
              borderRadius: theme.buttonRadius,
            }}
          />
          {mutationError && (
            <p className="text-sm text-red-500">{mutationError.message}</p>
          )}
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={!message.trim()}
            className="w-full"
            style={{
              background: theme.buttonBgColor,
              color: theme.buttonTextColor,
              borderRadius: theme.buttonRadius,
              border: `1px solid ${theme.buttonBgColor}`,
            }}
          >
            <Send className="w-4 h-4" />
            Send Wish
          </Button>
        </form>
      </section>

      <section
        className="px-6 pb-12"
        style={{ maxWidth: theme.maxWidth, margin: "0 auto" }}
      >
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl p-5"
                style={{ background: `${theme.accentColor}10`, border: `1px solid ${theme.accentColor}20` }}
              >
                <div className="h-4 w-24 rounded mb-3" style={{ background: `${theme.accentColor}30` }} />
                <div className="h-3 w-full rounded mb-2" style={{ background: `${theme.accentColor}20` }} />
                <div className="h-3 w-3/4 rounded" style={{ background: `${theme.accentColor}20` }} />
              </div>
            ))}
          </div>
        ) : !messages || messages.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-8 h-8" />}
            title="No wishes yet"
            description="Be the first to share a message!"
          />
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-xl p-5 transition-all"
                style={{
                  background: `${theme.accentColor}10`,
                  border: `1px solid ${theme.accentColor}25`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: theme.primaryColor, color: theme.buttonTextColor }}
                  >
                    {msg.guest_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: theme.headingColor }}
                    >
                      {msg.guest_name}
                    </p>
                    <p className="text-[10px] opacity-50">
                      {new Date(msg.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <p
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: theme.bodyColor }}
                >
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
