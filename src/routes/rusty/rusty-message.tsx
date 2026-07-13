import { useState, useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import type { Lang } from "./rusty-layout";
import type { RustyOutletContext } from "./rusty-layout";
import type { CSSProperties, FormEvent } from "react";

const translations = {
  en: {
    title: "Leave a Message",
    subtitle: "Share your well wishes with us",
    yourName: "Your Name",
    message: "Message",
    messagePlaceholder: "Write your message here...",
    send: "Send",
    sending: "Sending...",
    success: "Thank you! Your message has been sent.",
    error: "Failed to send message. Please try again.",
    empty: "No messages yet",
    emptyDesc: "Be the first to leave a well wish.",
    recent: "Recent Messages",
    charsRemaining: "characters remaining",
  },
  bm: {
    title: "Tinggalkan Mesej",
    subtitle: "Kongsi ucapan tahniah anda",
    yourName: "Nama Anda",
    message: "Mesej",
    messagePlaceholder: "Tulis mesej anda di sini...",
    send: "Hantar",
    sending: "Menghantar...",
    success: "Terima kasih! Mesej anda telah dihantar.",
    error: "Gagal menghantar mesej. Sila cuba lagi.",
    empty: "Belum ada mesej",
    emptyDesc: "Jadilah yang pertama meninggalkan ucapan.",
    recent: "Mesej Terkini",
    charsRemaining: "aksara lagi",
  },
};

const MAX_CHARS = 500;

export default function RustyMessage() {
  const { event, lang } = useOutletContext<RustyOutletContext>();
  const { eventId } = useParams<{ eventId: string }>();
  const { guestName } = useGuestAuth();
  const t = translations[lang];

  const [name, setName] = useState(guestName || "");
  const [message, setMessage] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (guestName) setName(guestName);
  }, [guestName]);

  const { data: messages, isLoading, refetch } = useQuery<EventMessage[], Error>({
    queryKey: ["rusty-messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EventMessage[];
    },
    enabled: !!eventId,
  });

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId || !name.trim() || !message.trim()) throw new Error("Missing fields");
      const { error } = await supabase.from("event_messages").insert({
        event_id: eventId,
        guest_name: name.trim(),
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      setSubmitSuccess(true);
      refetch();
      setTimeout(() => setSubmitSuccess(false), 5000);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !name.trim()) return;
    mutation.mutate();
  };

  const charsRemaining = MAX_CHARS - message.length;

  if (!event) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-serif text-lg text-[#8B7355]">{t.empty}</p>
      </div>
    );
  }

  const cssVars = {} as CSSProperties;

  return (
    <div style={cssVars} className="animate-fade-in px-6 py-10 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-12" style={{ backgroundColor: "#B8962E" }} />
          <div className="w-2 h-2 rotate-45" style={{ backgroundColor: "#B8962E" }} />
          <div className="h-px w-12" style={{ backgroundColor: "#B8962E" }} />
        </div>
        <h1
          className="font-serif text-4xl font-light mb-2"
          style={{ color: "#3D3528", fontFamily: '"Cormorant Garamond", serif' }}
        >
          {t.title}
        </h1>
        <p className="text-sm" style={{ color: "#8B7355" }}>
          {t.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 mb-12">
        <div>
          <label
            className="block font-serif text-sm tracking-[0.15em] uppercase mb-2"
            style={{ color: "#B8962E" }}
          >
            {t.yourName}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2.5 text-sm rounded-lg border bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#B8962E]/20 focus:border-[#B8962E] transition-colors"
            style={{ borderColor: "#D4C695", color: "#3D3528" }}
          />
        </div>

        <div>
          <label
            className="block font-serif text-sm tracking-[0.15em] uppercase mb-2"
            style={{ color: "#B8962E" }}
          >
            {t.message}
          </label>
          <Textarea
            value={message}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) setMessage(e.target.value);
            }}
            placeholder={t.messagePlaceholder}
            required
            rows={5}
            className="border-[#D4C695] bg-white/60 focus:border-[#B8962E]"
            style={{ color: "#3D3528" }}
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs" style={{ color: charsRemaining < 50 ? "#B8962E" : "#8B7355" }}>
              {charsRemaining} {t.charsRemaining}
            </span>
          </div>
        </div>

        {submitSuccess && (
          <div
            className="text-center py-4 px-4 rounded-lg border animate-fade-in"
            style={{ backgroundColor: "#FAF3E0", borderColor: "#B8962E" }}
          >
            <p className="font-serif text-lg" style={{ color: "#B8962E" }}>
              {t.success}
            </p>
          </div>
        )}

        {(mutation as any).error && (
          <div
            className="text-center py-4 px-4 rounded-lg border"
            style={{ backgroundColor: "#FAF3E0", borderColor: "#dc2626" }}
          >
            <p className="text-sm" style={{ color: "#dc2626" }}>
              {t.error}
            </p>
          </div>
        )}

        <div className="text-center pt-2">
          <Button
            type="submit"
            disabled={!message.trim() || !name.trim() || mutation.isPending}
            loading={mutation.isPending}
            size="lg"
            className="px-16 py-4 font-serif text-lg tracking-[0.3em] uppercase"
            style={{
              backgroundColor: "#B8962E",
              color: "#FAF3E0",
              border: "1px solid #B8962E",
            }}
          >
            {mutation.isPending ? t.sending : t.send}
          </Button>
        </div>
      </form>

      <section>
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-12" style={{ backgroundColor: "#B8962E", opacity: 0.5 }} />
          <h2
            className="font-serif text-xl font-light tracking-wide"
            style={{ color: "#3D3528", fontFamily: '"Cormorant Garamond", serif' }}
          >
            {t.recent}
          </h2>
          <div className="h-px w-12" style={{ backgroundColor: "#B8962E", opacity: 0.5 }} />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-[#B8962E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <EmptyState title={t.empty} description={t.emptyDesc} />
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-lg p-5 border"
                style={{
                  backgroundColor: "#FAF3E0",
                  borderColor: "#D4C695",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p
                    className="font-serif text-lg"
                    style={{ color: "#3D3528", fontFamily: '"Cormorant Garamond", serif' }}
                  >
                    {msg.guest_name}
                  </p>
                  <p className="text-xs" style={{ color: "#8B7355" }}>
                    {formatDate(msg.created_at)}
                  </p>
                </div>
                <p
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: "#3D3528" }}
                >
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
