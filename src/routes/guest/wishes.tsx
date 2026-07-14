import { useState } from "react";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase } from "../../lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate } from "../../lib/utils";

export default function GuestWishes() {
  const { event } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!guest) throw new Error("Not authenticated");
      if (!message.trim()) throw new Error("Please write a message");
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_id: guest.id,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-messages", event.id] });
      setMessage("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to submit"),
  });

  return (
    <div>
      <section className="guest-section">
        <div className="mx-auto max-w-2xl">
          <h1 className="guest-title mb-2 text-center">Leave a Wish</h1>
          <p className="guest-subtitle mb-6 text-center">
            Share your love and best wishes with {event.name || "the couple"}.
          </p>

          <div className="event-card space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="event-input"
              placeholder="Write your message here..."
              maxLength={1000}
            />
            {error && <p className="text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>}
            {submitted && <p className="text-sm" style={{ color: "var(--event-primary)" }}>Thank you for your wish!</p>}
            <div className="text-center">
              <button
                type="button"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="event-btn-primary"
                style={{ opacity: submitMutation.isPending ? 0.6 : 1 }}
              >
                {submitMutation.isPending ? "Sending..." : "Send Wish"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
