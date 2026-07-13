import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToEventCssVars } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { Card, EmptyState, Skeleton, Toast, type ToastType } from "../../components/ui";
import { formatDateShort, formatTime12 } from "../../lib/utils";

async function fetchMessages(eventId: string): Promise<EventMessage[]> {
  const { data, error } = await supabase
    .from("event_messages")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventMessage[];
}

export default function GuestWishesPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const cssVars = themeToEventCssVars(event.theme);

  // Redirect to login if not signed in
  if (!guestName) {
    navigate("login");
    return null;
  }

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", event.id],
    queryFn: () => fetchMessages(event.id),
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guestName,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", event.id] });
      setMessage("");
      setToast({ message: "Wish posted!", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    postMutation.mutate();
  };

  return (
    <div className="event-themed min-h-screen" style={cssVars}>
      <section className="px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-heading text-center text-3xl">Wishes</h2>
          <p className="font-body mt-2 text-center text-sm text-muted">
            Share your well wishes with {event.name}.
          </p>

          {/* Post form */}
          <form onSubmit={handleSubmit} className="mt-8">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your wish..."
              rows={3}
            />
            <div className="mt-3 flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={postMutation.isPending || !message.trim()}
                style={{
                  backgroundColor: "var(--event-primary)",
                  color: "var(--event-bg)",
                  borderRadius: "var(--event-button-radius)",
                }}
              >
                {postMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Post Wish
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Messages list */}
          <div className="mt-8 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : !messages || messages.length === 0 ? (
              <EmptyState
                title="No wishes yet"
                description="Be the first to leave a wish!"
              />
            ) : (
              messages.map((msg) => (
                <Card key={msg.id} className="p-4">
                  <p className="text-sm text-current">{msg.message}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span className="font-medium">— {msg.guest_name}</span>
                    <span>
                      {formatDateShort(msg.created_at)}{" "}
                      {msg.created_at &&
                        formatTime12(msg.created_at.slice(11, 16))}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

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
