import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase, type EventMessage } from "../../lib/supabase";
import { Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useGuestAuth } from "../../lib/guest-auth";
import { useRustyOutletContext } from "./rusty-layout";

export type Lang = "en" | "id";

/**
 * RustyWishes — guest wishes with cream/gold styling.
 */
export default function RustyWishes() {
  const { event } = useRustyOutletContext();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const headingFont: React.CSSProperties = { fontFamily: "var(--event-font-heading)" };
  const scriptFont: React.CSSProperties = { fontFamily: "var(--event-font-script)" };

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["rusty-messages", event.id],
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
      if (!guestName) throw new Error("Please sign in first.");
      if (!message.trim()) throw new Error("Message cannot be empty.");
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guestName,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSuccess("Your wish has been sent!");
      setError(null);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["rusty-messages", event.id] });
    },
    onError: (err: Error) => {
      setError(`Failed to send wish: ${err.message}`);
      setSuccess(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const GoldDivider = () => (
    <div className="flex items-center justify-center gap-4 my-6">
      <div className="h-px w-16" style={{ backgroundColor: "var(--event-primary)" }} />
      <div className="w-2 h-2 rotate-45" style={{ backgroundColor: "var(--event-primary)" }} />
      <div className="h-px w-16" style={{ backgroundColor: "var(--event-primary)" }} />
    </div>
  );

  return (
    <div className="min-h-screen px-6 py-16" style={{ backgroundColor: "var(--event-bg)", color: "var(--event-text)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Heart className="w-8 h-8 mx-auto mb-4" style={{ color: "var(--event-primary)" }} />
          <h1 className="text-4xl mb-2" style={headingFont}>Guest Wishes</h1>
          <p className="text-sm" style={{ ...scriptFont, color: "var(--event-text-muted)" }}>
            Share your love and well wishes
          </p>
        </div>
        <GoldDivider />

        {/* Submit form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 border mb-10"
          style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)", borderRadius: "var(--event-radius)" }}
        >
          <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: "var(--event-text-muted)" }}>
            Your message
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your wish here..."
            rows={4}
            style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-bg)", color: "var(--event-text)", borderRadius: "var(--event-radius)" }}
          />
          {success && (
            <div className="flex items-center gap-2 text-sm mt-3" style={{ color: "var(--event-primary)" }}>
              <CheckCircle2 className="w-4 h-4" /> {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 mt-3">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={!message.trim()}
            className="mt-4"
            style={{ backgroundColor: "var(--event-primary)", color: "#fff", borderRadius: "var(--event-radius)" }}
          >
            <Send className="w-4 h-4" /> Send Wish
          </Button>
        </form>

        {/* Messages list */}
        {isLoading ? (
          <div className="text-center py-10" style={{ color: "var(--event-text-muted)" }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10" style={{ color: "var(--event-text-muted)" }}>
            <p className="text-sm" style={scriptFont}>No wishes yet. Be the first to share your love!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-5 border"
                style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)", borderRadius: "var(--event-radius)" }}
              >
                <p className="text-sm leading-relaxed mb-3" style={{ ...scriptFont, color: "var(--event-text)" }}>
                  {msg.message}
                </p>
                <p className="text-xs uppercase tracking-wider" style={{ color: "var(--event-primary)" }}>
                  — {msg.guest_name}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="home" className="text-sm hover:underline" style={{ color: "var(--event-text-muted)" }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
