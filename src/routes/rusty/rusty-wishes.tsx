import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRustyContext } from "./rusty-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type EventMessage, type UserEvent } from "../../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RUSTY_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { MessageCircle, Send, Loader2, AlertCircle, CheckCircle2, X, Heart } from "lucide-react";

export type Lang = "en" | "id";

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-6">
      <div className="h-px w-16" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
      <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
      <div className="h-px w-16" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
    </div>
  );
}

export default function RustyWishes() {
  const { event } = useRustyContext();
  const { guestName, isAuthenticated } = useGuestAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ["rusty-messages", event.id] });
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
        <p className="text-sm mb-6" style={{ color: RUSTY_THEME.textMutedColor! }}>Please sign in to leave a message.</p>
        <Button onClick={() => navigate("./login")} style={{ backgroundColor: RUSTY_THEME.accentColor!, color: "#F5ECD7", borderRadius: "2px" }}>Sign In</Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: RUSTY_THEME.bgColor!, color: RUSTY_THEME.textColor! }}>
      <header className="pt-16 pb-8 text-center px-6">
        <MessageCircle className="w-6 h-6 mx-auto mb-3" style={{ color: RUSTY_THEME.accentColor! }} />
        <h1 className="font-serif text-3xl" style={{ fontFamily: RUSTY_THEME.headingFont }}>Wishes & Messages</h1>
        <p className="text-sm mt-2 font-serif italic" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.textMutedColor! }}>
          Share your love and congratulations
        </p>
        <GoldDivider />
      </header>

      <div className="max-w-xl mx-auto px-6 pb-12">
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="p-5" style={{ border: `1px solid ${RUSTY_THEME.borderColor}`, borderRadius: "2px", backgroundColor: RUSTY_THEME.bgSubtleColor }}>
            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: RUSTY_THEME.accentColor! }}>
              Writing as <span className="font-medium font-serif" style={{ fontFamily: RUSTY_THEME.headingFont, color: RUSTY_THEME.textColor! }}>{guestName}</span>
            </p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your wishes here..."
              maxLength={500}
              className="min-h-[120px]"
              style={{ backgroundColor: "#F5ECD7", borderColor: RUSTY_THEME.borderColor, color: RUSTY_THEME.textColor, borderRadius: "2px" }}
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs" style={{ color: RUSTY_THEME.textMutedColor! }}>{message.length}/500</p>
              <Button
                type="submit"
                disabled={!message.trim() || submitMutation.isPending}
                loading={submitMutation.isPending}
                size="sm"
                style={{ backgroundColor: RUSTY_THEME.accentColor!, color: "#F5ECD7", borderRadius: "2px" }}
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </Button>
            </div>
          </div>
        </form>

        <div>
          <h2 className="font-serif text-xl mb-5 flex items-center gap-2" style={{ fontFamily: RUSTY_THEME.headingFont }}>
            <Heart className="w-4 h-4" style={{ color: RUSTY_THEME.accentColor! }} />
            {messages.length} {messages.length === 1 ? "Message" : "Messages"}
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: RUSTY_THEME.accentColor! }} />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12" style={{ border: `1px dashed ${RUSTY_THEME.borderColor}`, borderRadius: "2px" }}>
              <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: RUSTY_THEME.textMutedColor! }} />
              <p className="text-sm font-serif italic" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.textMutedColor! }}>
                No messages yet. Be the first to leave a wish!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <div key={m.id} className="p-5" style={{ border: `1px solid ${RUSTY_THEME.borderColor}`, borderRadius: "2px", backgroundColor: RUSTY_THEME.bgSubtleColor }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium font-serif" style={{ fontFamily: RUSTY_THEME.headingFont }}>{m.guest_name}</p>
                    <p className="text-xs" style={{ color: RUSTY_THEME.textMutedColor! }}>
                      {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed font-serif italic whitespace-pre-wrap" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.textMutedColor! }}>
                    {m.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="flex items-center gap-3 px-4 py-3 shadow-lg" style={{ borderRadius: "2px", backgroundColor: toast.type === "success" ? RUSTY_THEME.accentColor : "#B91C1C", color: "#F5ECD7" }}>
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm">{toast.msg}</span>
            <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
