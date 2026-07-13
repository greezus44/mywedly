import { useState, useEffect, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Send } from "lucide-react";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { RUSTY_THEME } from "../../lib/theme";
import { formatDate } from "../../lib/utils";
import type { Lang } from "./rusty-layout";

const LANG_STORAGE_KEY = "guest-lang";
const MAX_MESSAGE_LENGTH = 500;

interface OutletContext {
  event: UserEvent;
  lang: Lang;
}

export default function RustyMessage() {
  const { event } = useOutletContext<OutletContext>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const [lang, setLang] = useState<Lang>("en");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "en" || saved === "bm") setLang(saved);
  }, []);

  const { data: messages, isLoading } = useQuery<EventMessage[], Error>({
    queryKey: ["event-messages", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EventMessage[];
    },
  });

  const submitMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: guestName!,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSent(true);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["event-messages", event.id] });
      setTimeout(() => setSent(false), 4000);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !guestName) return;
    submitMutation.mutate();
  };

  const theme = event.theme || RUSTY_THEME;
  const headingFont = theme.headingFont || "Cormorant Garamond";
  const scriptFont = theme.scriptFont || "Cormorant Garamond";

  const t = {
    en: {
      title: "Send a Message",
      subtitle: "Share your wishes with us",
      name: "Your Name",
      message: "Message",
      placeholder: "Write your heartfelt message...",
      send: "Send",
      thankYou: "Thank you for your message!",
      recent: "Recent Messages",
      noMessages: "No messages yet. Be the first to share your wishes.",
      from: "From",
    },
    bm: {
      title: "Hantar Mesej",
      subtitle: "Kongsi ucapan anda dengan kami",
      name: "Nama Anda",
      message: "Mesej",
      placeholder: "Tulis mesej ikhlas anda...",
      send: "Hantar",
      thankYou: "Terima kasih atas mesej anda!",
      recent: "Mesej Terkini",
      noMessages: "Belum ada mesej. Jadilah yang pertama berkongsi ucapan.",
      from: "Daripada",
    },
  }[lang];

  return (
    <div className="animate-fade-in py-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="h-px w-10 bg-rusty-gold-dark/40" />
          <span className="w-1.5 h-1.5 rounded-full bg-rusty-gold-dark" />
          <span className="h-px w-10 bg-rusty-gold-dark/40" />
        </div>
        <h1 className="font-serif text-3xl text-rusty-text mb-1" style={{ fontFamily: `"${headingFont}", serif` }}>
          {t.title}
        </h1>
        <p className="text-sm italic text-rusty-text-light" style={{ fontFamily: `"${scriptFont}", serif` }}>
          {t.subtitle}
        </p>
      </div>

      {sent && (
        <div className="mb-6 p-4 rounded-lg bg-rusty-cream border border-rusty-gold-dark/30 flex items-center gap-2.5 animate-fade-in-up">
          <Check className="w-4 h-4 text-rusty-gold-dark flex-shrink-0" />
          <p className="text-xs text-rusty-text">{t.thankYou}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mb-10">
        <div>
          <label className="block text-xs tracking-[0.15em] uppercase text-rusty-text-light mb-2">
            {t.name}
          </label>
          <input
            type="text"
            value={guestName || ""}
            disabled
            className="w-full px-4 py-2.5 text-sm rounded-md border border-rusty-border bg-rusty-cream/50 text-rusty-text-light cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs tracking-[0.15em] uppercase text-rusty-text-light mb-2">
            {t.message}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder={t.placeholder}
            rows={4}
            required
            className="w-full px-4 py-2.5 text-sm rounded-md border border-rusty-border bg-white/60 focus:outline-none focus:ring-2 focus:ring-rusty-gold-dark/20 focus:border-rusty-gold-dark transition-colors resize-none text-rusty-text"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-[10px] ${message.length >= MAX_MESSAGE_LENGTH ? "text-rusty-gold-dark" : "text-rusty-text-light/60"}`}>
              {message.length} / {MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </div>

        {(submitMutation as any).error && (
          <p className="text-xs text-red-600 text-center">
            {(submitMutation as any).error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={!message.trim() || submitMutation.isPending}
          className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm tracking-[0.2em] uppercase font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: theme.primaryColor || "#B8962E",
            color: "#FAF3E0",
            borderRadius: "4px",
          }}
        >
          <Send className="w-3.5 h-3.5" />
          {submitMutation.isPending ? "..." : t.send}
        </button>
      </form>

      <div className="border-t border-rusty-border/50 pt-6">
        <h2 className="font-serif text-lg text-rusty-text text-center mb-4" style={{ fontFamily: `"${headingFont}", serif` }}>
          {t.recent}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-rusty-cream/50 animate-pulse" />
            ))}
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-rusty-text-light italic" style={{ fontFamily: `"${scriptFont}", serif` }}>
              {t.noMessages}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-lg border border-rusty-border bg-rusty-cream/50 p-4 animate-fade-in"
              >
                <p className="text-sm text-rusty-text leading-relaxed mb-2">
                  {msg.message}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-rusty-gold-dark font-medium">
                    {t.from} {msg.guest_name}
                  </p>
                  <p className="text-[10px] text-rusty-text-light/60">
                    {formatDate(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
