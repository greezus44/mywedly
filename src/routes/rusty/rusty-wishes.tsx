import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type ScheduleItem, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { RUSTY_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Heart, Send, MessageSquare } from "lucide-react";

export type Lang = "en" | "id";

interface OutletContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
  lang: Lang;
  setLang: (lang: Lang) => void;
}

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-4 my-6">
      <div className="w-24 h-px" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
      <div className="w-2 h-2 rotate-45" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
      <div className="w-24 h-px" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
    </div>
  );
}

export default function RustyWishes() {
  const { event } = useOutletContext<OutletContext>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(guestName || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["rusty-guest-messages", event.id],
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
      queryClient.invalidateQueries({ queryKey: ["rusty-guest-messages", event.id] });
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
    <div
      className="min-h-screen"
      style={{
        backgroundColor: RUSTY_THEME.bgColor || "#F5ECD7",
        color: RUSTY_THEME.textColor || "#3D3528",
      }}
    >
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Heart className="w-8 h-8 mx-auto mb-4" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} />
          <p className="text-xs uppercase tracking-[0.3em] opacity-60 mb-2">Guestbook</p>
          <h1
            className="font-heading text-4xl md:text-5xl tracking-tight"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            Send Your Wishes
          </h1>
          <p className="mt-4 text-sm italic opacity-70" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            Share a message with {event.name}
          </p>
        </div>

        <GoldDivider />

        {/* Submit form */}
        <form
          onSubmit={handleSubmit}
          className="mb-12 space-y-4 p-8 border"
          style={{
            borderColor: RUSTY_THEME.borderColor || "#D4C695",
            borderRadius: 2,
            backgroundColor: RUSTY_THEME.bgSubtleColor || "#FAF3E0",
          }}
        >
          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.2em] opacity-60 mb-2">
              Your Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              style={{
                backgroundColor: RUSTY_THEME.bgColor || "#F5ECD7",
                borderColor: RUSTY_THEME.borderColor || "#D4C695",
                borderRadius: 2,
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.2em] opacity-60 mb-2">
              Your Message
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your wishes, congratulations, or a fond memory..."
              rows={4}
              required
              style={{
                backgroundColor: RUSTY_THEME.bgColor || "#F5ECD7",
                borderColor: RUSTY_THEME.borderColor || "#D4C695",
                borderRadius: 2,
              }}
            />
          </div>
          {error && <p className="text-sm" style={{ color: "#9c2a2a" }}>{error}</p>}
          {submitMutation.isSuccess && (
            <p className="text-sm flex items-center gap-1.5 italic" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }}>
              <Heart className="w-4 h-4" /> Your wish has been sent!
            </p>
          )}
          <Button
            type="submit"
            loading={submitMutation.isPending}
            size="lg"
            className="w-full justify-center uppercase tracking-[0.2em]"
            style={{
              backgroundColor: RUSTY_THEME.primaryColor || "#B8962E",
              color: RUSTY_THEME.bgColor || "#F5ECD7",
              borderRadius: 2,
            }}
          >
            <Send className="w-4 h-4" /> Send Wish
          </Button>
        </form>

        <GoldDivider />

        {/* Messages list */}
        <div>
          <div className="flex items-center gap-2 mb-6 justify-center">
            <MessageSquare className="w-5 h-5 opacity-60" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} />
            <h2 className="font-heading text-xl" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              {messages.length} {messages.length === 1 ? "Wish" : "Wishes"}
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-6 border animate-pulse"
                  style={{ borderColor: RUSTY_THEME.borderColor || "#D4C695", borderRadius: 2 }}
                >
                  <div className="h-4 w-1/3 mb-3" style={{ backgroundColor: RUSTY_THEME.borderColor || "#D4C695" }} />
                  <div className="h-3 w-full mb-2" style={{ backgroundColor: RUSTY_THEME.borderColor || "#D4C695" }} />
                  <div className="h-3 w-2/3" style={{ backgroundColor: RUSTY_THEME.borderColor || "#D4C695" }} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div
              className="text-center py-16 border"
              style={{ borderColor: RUSTY_THEME.borderColor || "#D4C695", borderRadius: 2 }}
            >
              <MessageSquare className="w-10 h-10 mx-auto mb-4 opacity-30" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} />
              <p className="text-sm opacity-60 italic">No wishes yet. Be the first to share!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-6 border"
                  style={{
                    borderColor: RUSTY_THEME.borderColor || "#D4C695",
                    borderRadius: 2,
                    backgroundColor: RUSTY_THEME.bgSubtleColor || "#FAF3E0",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-heading text-base" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                      {msg.guest_name}
                    </p>
                    <p className="text-xs opacity-50">
                      {new Date(msg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed italic opacity-80 whitespace-pre-line" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
