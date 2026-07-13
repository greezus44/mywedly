import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type ScheduleItem, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Heart, Send, MessageSquare } from "lucide-react";

interface OutletContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
}

export default function GuestWishes() {
  const { event } = useOutletContext<OutletContext>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(guestName || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["guest-messages", event.id],
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

  const submitMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim();
      const trimmedMessage = message.trim();
      if (!trimmedName) throw new Error("Please enter your name.");
      if (!trimmedMessage) throw new Error("Please write a message.");

      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: trimmedName,
        message: trimmedMessage,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["guest-messages", event.id] });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Heart className="w-8 h-8 mx-auto mb-4 text-[var(--color-accent)]" />
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">Guestbook</p>
          <h1 className="font-heading text-4xl md:text-5xl tracking-tight">Send Your Wishes</h1>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Share a message with {event.name}
          </p>
        </div>

        {/* Submit form */}
        <form onSubmit={handleSubmit} className="mb-12 space-y-4 p-6 border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Your Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Your Message
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your wishes, congratulations, or a fond memory..."
              rows={4}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {submitMutation.isSuccess && (
            <p className="text-sm text-green-600 flex items-center gap-1.5">
              <Heart className="w-4 h-4" /> Your wish has been sent!
            </p>
          )}
          <Button type="submit" loading={submitMutation.isPending} size="lg" className="w-full justify-center">
            <Send className="w-4 h-4" /> Send Wish
          </Button>
        </form>

        {/* Messages list */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-[var(--color-text-muted)]" />
            <h2 className="font-heading text-xl">
              {messages.length} {messages.length === 1 ? "Wish" : "Wishes"}
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 border border-[var(--color-border)] animate-pulse" style={{ borderRadius: "var(--radius)" }}>
                  <div className="h-4 bg-[var(--color-bg-subtle)] w-1/3 mb-3" />
                  <div className="h-3 bg-[var(--color-bg-subtle)] w-full mb-2" />
                  <div className="h-3 bg-[var(--color-bg-subtle)] w-2/3" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
              <MessageSquare className="w-10 h-10 mx-auto mb-4 text-[var(--color-text-muted)] opacity-40" />
              <p className="text-sm text-[var(--color-text-muted)]">No wishes yet. Be the first to share!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="p-6 border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-heading text-base">{msg.guest_name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {new Date(msg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--color-text-muted)] whitespace-pre-line">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
