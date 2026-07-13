import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Loader2, Send } from "lucide-react";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { timeAgo } from "../../lib/utils";
import { Toast } from "../../components/ui";

export default function GuestWishesPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const { guestName } = useGuestAuth();
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // If not signed in, redirect to login
  useEffect(() => {
    if (!guestName) {
      navigate("login");
    }
  }, [guestName, navigate]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("event_messages")
          .select("*")
          .eq("event_id", event.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setMessages((data || []) as EventMessage[]);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [event.id]);

  if (!guestName) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("event_messages")
        .insert({
          event_id: event.id,
          guest_name: guestName,
          message: newMessage.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      setMessages((prev) => [data as EventMessage, ...prev]);
      setNewMessage("");
      setToast({ message: "Wish posted!", type: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to post wish",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="event-themed flex min-h-screen flex-col items-center px-6 py-12">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="text-center">
          <h1
            className="text-3xl font-semibold"
            style={{ fontFamily: "var(--event-heading-font)", color: "var(--event-text)" }}
          >
            Wishes
          </h1>
          <p
            className="mt-1 text-sm opacity-70"
            style={{ color: "var(--event-text)" }}
          >
            Leave a message for {event.name || "the event"}
          </p>
        </div>

        {/* New message form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-lg border p-4"
          style={{
            borderColor: "var(--event-border)",
            backgroundColor: "var(--event-surface)",
          }}
        >
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write your wish…"
            className="min-h-[100px] rounded-md border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--event-border)",
              backgroundColor: "var(--event-surface)",
              color: "var(--event-text)",
            }}
          />
          <button
            type="submit"
            disabled={submitting || !newMessage.trim()}
            className="flex items-center justify-center gap-2 rounded px-6 py-2.5 text-sm font-medium uppercase tracking-wider transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: "var(--event-primary)",
              color: "var(--event-bg)",
              borderRadius: "var(--event-button-radius, 6px)",
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Post Wish
              </>
            )}
          </button>
        </form>

        {/* Messages list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--event-muted)" }} />
          </div>
        ) : messages.length === 0 ? (
          <p
            className="py-8 text-center text-sm opacity-60"
            style={{ color: "var(--event-text)" }}
          >
            No wishes yet. Be the first to leave a message!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-lg border p-4"
                style={{
                  borderColor: "var(--event-border)",
                  backgroundColor: "var(--event-surface)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--event-text)" }}
                  >
                    {msg.guest_name || "Anonymous"}
                  </span>
                  <span
                    className="text-xs opacity-50"
                    style={{ color: "var(--event-muted)" }}
                  >
                    {timeAgo(msg.created_at)}
                  </span>
                </div>
                <p
                  className="mt-2 text-sm opacity-80"
                  style={{ color: "var(--event-text)" }}
                >
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
