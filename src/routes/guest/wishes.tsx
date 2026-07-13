import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGuestContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { MessageCircle, Send, Loader2, AlertCircle, CheckCircle2, X, Heart } from "lucide-react";

export default function GuestWishes() {
  const { event } = useGuestContext();
  const { guestName, isAuthenticated } = useGuestAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

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
      if (!guestName) throw new Error("Please sign in to leave a message");
      if (!message.trim()) throw new Error("Message cannot be empty");
      if (message.trim().length < 2) throw new Error("Message is too short");
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guestName,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["guest-messages", event.id] });
      setToast({ type: "success", msg: "Thank you for your message!" });
    },
    onError: (err: Error) => {
      setToast({ type: "error", msg: err.message || "Failed to send message." });
    },
  });

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-[var(--color-text-muted)] mb-6">Please sign in to leave a message.</p>
        <Button onClick={() => navigate("./login")}>Sign In</Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-border)]">
        <div className="max-w-2xl mx-auto px-6 py-10 text-center">
          <MessageCircle className="w-6 h-6 mx-auto text-[var(--color-accent)] mb-3" />
          <h1 className="font-[var(--font-heading)] text-3xl">Wishes & Messages</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">Share your love and congratulations</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Submit form */}
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="border border-[var(--color-border)] p-5" style={{ borderRadius: "var(--radius)" }}>
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
              Writing as <span className="text-[var(--color-text)] font-medium">{guestName}</span>
            </p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your wishes here..."
              maxLength={500}
              className="min-h-[120px]"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-[var(--color-text-muted)]">{message.length}/500</p>
              <Button type="submit" disabled={!message.trim() || submitMutation.isPending} loading={submitMutation.isPending} size="sm">
                <Send className="w-3.5 h-3.5" />
                Send
              </Button>
            </div>
          </div>
        </form>

        {/* Messages list */}
        <div>
          <h2 className="font-[var(--font-heading)] text-xl mb-5 flex items-center gap-2">
            <Heart className="w-4 h-4 text-[var(--color-accent)]" />
            {messages.length} {messages.length === 1 ? "Message" : "Messages"}
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
              <MessageCircle className="w-8 h-8 mx-auto text-[var(--color-text-muted)] opacity-30 mb-3" />
              <p className="text-sm text-[var(--color-text-muted)]">No messages yet. Be the first to leave a wish!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <div key={m.id} className="border border-[var(--color-border)] p-5" style={{ borderRadius: "var(--radius)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{m.guest_name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed whitespace-pre-wrap">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inline toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-4 py-3 shadow-lg ${toast.type === "success" ? "bg-[var(--color-primary)] text-[var(--color-bg)]" : "bg-red-600 text-white"}`} style={{ borderRadius: "var(--radius)" }}>
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm">{toast.msg}</span>
            <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
