import { useState, useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import type { FormEvent } from "react";
import type { GuestLayoutContext } from "./guest-layout";

const MAX_CHARS = 500;

export default function Wishes() {
  const { eventId } = useParams<{ eventId: string }>();
  const outletCtx = useOutletContext<GuestLayoutContext | null>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(guestName || "");
  const [message, setMessage] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (guestName) setName(guestName);
  }, [guestName]);

  const fallbackQuery = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    enabled: !!eventId && !outletCtx?.event,
    queryFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  const event = outletCtx?.event || fallbackQuery.data || null;

  const { data: messages, isLoading, refetch } = useQuery<EventMessage[], Error>({
    queryKey: ["guest-messages", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EventMessage[];
    },
  });

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId || !name.trim() || !message.trim()) throw new Error("Missing fields");
      const { error } = await supabase.from("event_messages").insert({
        event_id: eventId,
        guest_name: name.trim(),
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      setSubmitSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["guest-messages", eventId] });
      refetch();
      setTimeout(() => setSubmitSuccess(false), 5000);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !name.trim()) return;
    mutation.mutate();
  };

  const charsRemaining = MAX_CHARS - message.length;

  return (
    <div className="animate-fade-in px-6 py-10 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-light mb-2" style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
          Wishes
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Share your well wishes with us
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 mb-12">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
            Your Name
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
            Message
          </label>
          <Textarea
            value={message}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) setMessage(e.target.value);
            }}
            placeholder="Write your message here..."
            required
            rows={5}
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs" style={{ color: charsRemaining < 50 ? "var(--color-accent)" : "var(--color-text-muted)" }}>
              {charsRemaining} characters remaining
            </span>
          </div>
        </div>

        {submitSuccess && (
          <div
            className="text-center py-4 px-4 rounded-lg border animate-fade-in"
            style={{ backgroundColor: "var(--color-bg-subtle)", borderColor: "var(--color-primary)" }}
          >
            <p className="text-lg" style={{ color: "var(--color-primary)" }}>
              Thank you! Your message has been sent.
            </p>
          </div>
        )}

        {(mutation as any).error && (
          <div
            className="text-center py-4 px-4 rounded-lg border"
            style={{ backgroundColor: "var(--color-bg-subtle)", borderColor: "#dc2626" }}
          >
            <p className="text-sm" style={{ color: "#dc2626" }}>
              Failed to send message. Please try again.
            </p>
          </div>
        )}

        <div className="text-center pt-2">
          <Button
            type="submit"
            disabled={!message.trim() || !name.trim() || mutation.isPending}
            loading={mutation.isPending}
            size="lg"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-bg)" }}
          >
            {mutation.isPending ? "Sending..." : "Send"}
          </Button>
        </div>
      </form>

      <section>
        <h2 className="text-xl font-light tracking-wide text-center mb-6" style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
          Recent Messages
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <EmptyState title="No messages yet" description="Be the first to leave a well wish." />
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-xl p-5 border shadow-sm"
                style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-lg font-medium" style={{ color: "var(--color-primary)", fontFamily: "var(--font-script)" }}>
                    {msg.guest_name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {formatDate(msg.created_at)}
                  </p>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--color-text)" }}>
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
