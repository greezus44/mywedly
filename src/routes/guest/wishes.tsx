import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Loader2, Send } from "lucide-react";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useToast } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { timeAgo } from "../../lib/utils";

export default function GuestWishesPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const { guestName } = useGuestAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!guestName) {
    navigate("login");
  }

  useEffect(() => {
    supabase
      .from("event_messages")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setMessages(data as EventMessage[]);
        setLoading(false);
      });
  }, [event.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !guestName) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("event_messages")
        .insert({
          event_id: event.id,
          guest_name: guestName,
          message: text.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      setMessages((prev) => [data as EventMessage, ...prev]);
      setText("");
      toast("Wish posted!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to post wish", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-10" style={{ backgroundColor: "var(--event-bg)", color: "var(--event-text)" }}>
      <h1 className="text-3xl font-semibold" style={{ fontFamily: "var(--event-font-heading)" }}>
        Wishes
      </h1>
      <p style={{ color: "var(--event-text-muted)" }} className="text-sm">
        Share your well wishes with {event.name || "the couple"}.
      </p>

      <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your wish..."
          className="min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)", color: "var(--event-text)" }}
        />
        <Button type="submit" loading={submitting} disabled={!text.trim()} className="w-full">
          <Send className="h-4 w-4" />
          Post wish
        </Button>
      </form>

      <div className="w-full max-w-md">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--event-text-muted)" }} />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm" style={{ color: "var(--event-text-muted)" }}>
            No wishes yet. Be the first!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className="rounded-md border p-4"
                style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "var(--event-text)" }}>
                    {m.guest_name}
                  </span>
                  <span className="text-xs" style={{ color: "var(--event-text-muted)" }}>
                    {timeAgo(m.created_at)}
                  </span>
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--event-text)" }}>
                  {m.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
