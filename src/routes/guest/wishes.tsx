import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Send } from "lucide-react";
import { supabase, type EventMessage } from "../../lib/supabase";
import type { GuestLayoutContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDate } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";

const MAX_MESSAGE_LENGTH = 500;

export default function Wishes() {
  const { event } = useOutletContext<GuestLayoutContext>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const { data: messages, isLoading } = useQuery<EventMessage[], Error>({
    queryKey: ["event-messages", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EventMessage[];
    },
  });

  const submitMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guestName!,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSent(true);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["event-messages", event.id] });
      setTimeout(() => setSent(false), 4000);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !guestName) return;
    submitMutation.mutate();
  };

  return (
    <div className="animate-fade-in py-6">
      <div className="text-center mb-8">
        <h1
          className="text-3xl mb-1"
          style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
        >
          Wishes
        </h1>
        <p
          className="text-sm italic"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-script)" }}
        >
          Share your wishes with us
        </p>
      </div>

      {sent && (
        <div
          className="mb-6 p-4 rounded-lg border flex items-center gap-2.5 animate-fade-in-up"
          style={{
            backgroundColor: "var(--color-bg-subtle)",
            borderColor: "var(--color-border)",
          }}
        >
          <Check
            className="w-4 h-4 flex-shrink-0"
            style={{ color: "var(--color-accent)" }}
          />
          <p
            className="text-xs"
            style={{ color: "var(--color-text)" }}
          >
            Thank you for your message!
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mb-10">
        <div>
          <label
            className="block text-xs tracking-[0.15em] uppercase mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Your Name
          </label>
          <Input
            type="text"
            value={guestName || ""}
            disabled
            className="cursor-not-allowed"
          />
        </div>

        <div>
          <label
            className="block text-xs tracking-[0.15em] uppercase mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Message
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder="Write your heartfelt message..."
            rows={4}
            required
          />
          <div className="flex justify-end mt-1">
            <span
              className="text-[10px]"
              style={{
                color:
                  message.length >= MAX_MESSAGE_LENGTH
                    ? "var(--color-accent)"
                    : "var(--color-text-muted)",
              }}
            >
              {message.length} / {MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </div>

        {(submitMutation as any).error && (
          <p className="text-xs text-red-600 text-center">
            {(submitMutation as any).error.message}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          loading={submitMutation.isPending}
          disabled={!message.trim()}
          className="w-full"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#ffffff",
            borderRadius: "var(--radius)",
          }}
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </Button>
      </form>

      <div
        className="border-t pt-6"
        style={{ borderColor: "var(--color-border)" }}
      >
        <h2
          className="text-lg text-center mb-4"
          style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
        >
          Recent Messages
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg animate-pulse"
                style={{ backgroundColor: "var(--color-bg-subtle)" }}
              />
            ))}
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="py-8 text-center">
            <p
              className="text-xs italic"
              style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-script)" }}
            >
              No messages yet. Be the first to share your wishes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-lg border p-4 animate-fade-in"
                style={{
                  backgroundColor: "var(--color-bg-subtle)",
                  borderColor: "var(--color-border)",
                }}
              >
                <p
                  className="text-sm leading-relaxed mb-2"
                  style={{ color: "var(--color-text)" }}
                >
                  {msg.message}
                </p>
                <div className="flex items-center justify-between">
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--color-accent)" }}
                  >
                    From {msg.guest_name}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {formatDate(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
