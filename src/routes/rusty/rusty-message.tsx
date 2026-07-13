import { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { EmptyState, ErrorState } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import { Loader2, Send, Check } from "lucide-react";
import type { Lang } from "./rusty-layout";
import type { CSSProperties, FormEvent } from "react";

interface OutletContext {
  event: UserEvent;
  lang: Lang;
}

const content = {
  en: {
    title: "Send a Message",
    subtitle: "Share your wishes with us",
    guestName: "Your Name",
    message: "Your Message",
    messagePlaceholder: "Write your message to the happy couple...",
    send: "Send Message",
    sending: "Sending...",
    thankYou: "Thank You",
    thankYouMsg: "Your message has been sent with love",
    sendAnother: "Send Another Message",
    messages: "Messages",
    noMessages: "No messages yet. Be the first to share your wishes!",
    loading: "Loading...",
    error: "Unable to load messages",
    charsRemaining: "characters remaining",
  },
  bm: {
    title: "Hantar Mesej",
    subtitle: "Kongsi ucapan anda dengan kami",
    guestName: "Nama Anda",
    message: "Mesej Anda",
    messagePlaceholder: "Tulis mesej anda untuk pasangan bahagia...",
    send: "Hantar Mesej",
    sending: "Menghantar...",
    thankYou: "Terima Kasih",
    thankYouMsg: "Mesej anda telah dihantar dengan penuh kasih",
    sendAnother: "Hantar Mesej Lain",
    messages: "Mesej",
    noMessages: "Tiada mesej lagi. Jadi yang pertama berkongsi ucapan!",
    loading: "Memuatkan...",
    error: "Tidak dapat memuatkan mesej",
    charsRemaining: "aksara lagi",
  },
};

export default function RustyMessage() {
  const { event, lang } = useOutletContext<OutletContext>();
  const { eventId } = useParams<{ eventId: string }>();
  const auth = useGuestAuth();
  const queryClient = useQueryClient();
  const t = content[lang];

  const [name, setName] = useState(auth.guestName || "");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: messages, isLoading, error } = useQuery<EventMessage[]>({
    queryKey: ["event-messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
    staleTime: 30000,
  });

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId || !message.trim()) throw new Error("Missing required fields");
      const { error } = await supabase.from("event_messages").insert({
        event_id: eventId,
        guest_name: name.trim() || auth.guestName || "Guest",
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSubmitted(true);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["event-messages", eventId] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    mutation.mutate();
  };

  const handleSendAnother = () => {
    setSubmitted(false);
  };

  const sectionStyle: CSSProperties = {
    maxWidth: "var(--max-width)",
    margin: "0 auto",
    paddingTop: "var(--section-padding)",
    paddingBottom: "var(--section-padding)",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: "24px",
    paddingRight: "24px",
    width: "100%",
  };

  const headingStyle: CSSProperties = {
    color: "var(--heading-color)",
    fontFamily: "var(--heading-font)",
  };

  const cardStyle: CSSProperties = {
    borderColor: "#C4A44A",
    borderWidth: "1px",
    borderStyle: "solid",
    backgroundColor: "rgba(250, 243, 224, 0.6)",
  };

  return (
    <div>
      <section style={sectionStyle} className="text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="h-px w-10 bg-[#C4A44A]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
          <span className="h-px w-10 bg-[#C4A44A]" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-medium mb-3" style={headingStyle}>
          {t.title}
        </h1>
        <p className="text-sm text-[#A07820] italic" style={{ fontFamily: "var(--script-font)" }}>
          {t.subtitle}
        </p>

        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="h-px w-10 bg-[#C4A44A]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
          <span className="h-px w-10 bg-[#C4A44A]" />
        </div>
      </section>

      <section style={{ ...sectionStyle, paddingTop: 0, paddingBottom: 0 }}>
        {submitted ? (
          <div
            className="rounded-lg p-8 mx-auto max-w-md text-center"
            style={cardStyle}
          >
            <div className="w-16 h-16 rounded-full border border-[#C4A44A] flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-[#B8962E]" />
            </div>

            <h2 className="text-3xl font-medium mb-3" style={headingStyle}>
              {t.thankYou}
            </h2>
            <p className="text-sm text-[#8B7355] italic mb-6" style={{ fontFamily: "var(--script-font)" }}>
              {t.thankYouMsg}
            </p>

            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="h-px w-8 bg-[#C4A44A]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
              <span className="h-px w-8 bg-[#C4A44A]" />
            </div>

            <button
              onClick={handleSendAnother}
              className="text-[11px] tracking-[0.15em] uppercase text-[#8B7355] hover:text-[#B8962E] transition-colors underline underline-offset-4"
            >
              {t.sendAnother}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto max-w-md">
            <div
              className="rounded-lg p-6 space-y-5"
              style={cardStyle}
            >
              <div>
                <label className="block text-[10px] uppercase tracking-[0.25em] text-[#C4A44A] mb-2">
                  {t.guestName}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-white/60 border border-[#C4A44A]/40 text-[#8B7355] placeholder:text-[#8B7355]/40 focus:outline-none focus:border-[#B8962E] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.25em] text-[#C4A44A] mb-2">
                  {t.message}
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.messagePlaceholder}
                  rows={4}
                  maxLength={500}
                  className="bg-white/60 border-[#C4A44A]/40 text-[#8B7355] placeholder:text-[#8B7355]/40 focus:border-[#B8962E]"
                />
                <p className="text-right text-[10px] text-[#8B7355]/60 mt-1">
                  {500 - message.length} {t.charsRemaining}
                </p>
              </div>

              {(mutation as any).error && (
                <p className="text-xs text-red-600 text-center">
                  {(mutation as any).error.message || "Unable to send message. Please try again."}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                loading={mutation.isPending}
                disabled={!message.trim()}
                className="w-full tracking-[0.2em] uppercase"
                style={{
                  backgroundColor: "var(--button-bg)",
                  color: "var(--button-text)",
                  borderColor: "var(--button-bg)",
                  borderRadius: "var(--button-radius)",
                }}
              >
                {mutation.isPending ? t.sending : t.send}
              </Button>
            </div>
          </form>
        )}
      </section>

      <section style={{ ...sectionStyle, paddingTop: 0 }}>
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="h-px w-8 bg-[#C4A44A]/50" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">{t.messages}</span>
          <span className="h-px w-8 bg-[#C4A44A]/50" />
        </div>

        {isLoading ? (
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#B8962E] mx-auto" />
            <p className="text-sm text-[#8B7355] mt-3">{t.loading}</p>
          </div>
        ) : error ? (
          <ErrorState message={t.error} />
        ) : messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-lg p-5"
                style={cardStyle}
              >
                <p className="text-sm leading-relaxed text-[#8B7355] mb-3 whitespace-pre-line">
                  {msg.message}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#A07820] italic" style={{ fontFamily: "var(--script-font)" }}>
                    — {msg.guest_name}
                  </p>
                  <p className="text-[10px] text-[#8B7355]/60">
                    {formatDate(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={t.noMessages} />
        )}
      </section>
    </div>
  );
}
