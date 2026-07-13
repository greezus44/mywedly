import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CSSProperties, FormEvent } from "react";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { formatDate } from "../../lib/utils";
import type { Lang } from "./rusty-layout";

const CREAM = "#F5ECD7";
const CREAM_LIGHT = "#FAF3E0";
const GOLD = "#B8962E";
const TEXT = "#3D3528";
const TEXT_MUTED = "#8B7355";
const BORDER = "#D4C695";
const MAX_CHARS = 500;

interface OutletContext {
  event: UserEvent;
  eventId: string;
}

export function RustyMessage() {
  const { eventId } = useOutletContext<OutletContext>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [lang, setLang] = useState<Lang>("en");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const { data: messages, isLoading, isError } = useQuery<EventMessage[]>({
    queryKey: ["event-messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EventMessage[];
    },
  });

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: eventId,
        guest_name: guestName,
        message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      setSent(true);
      queryClient.invalidateQueries({ queryKey: ["event-messages", eventId] });
    },
  });

  useEffect(() => {
    if (sent) {
      const timer = setTimeout(() => setSent(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [sent]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    mutation.mutate();
  };

  const t = {
    en: {
      title: "Messages",
      subtitle: "Share your wishes with us",
      placeholder: "Write your message...",
      send: "Send",
      sent: "Thank you for your message",
      noMessages: "No messages yet. Be the first to share your wishes.",
      from: "From",
    },
    bm: {
      title: "Mesej",
      subtitle: "Kongsi ucapan anda dengan kami",
      placeholder: "Tulis mesej anda...",
      send: "Hantar",
      sent: "Terima kasih atas mesej anda",
      noMessages: "Belum ada mesej. Jadilah yang pertama berkongsi ucapan.",
      from: "Daripada",
    },
  }[lang];

  const dividerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
  };

  return (
    <div className="max-w-2xl mx-auto py-6" style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT }}>
      <div className="flex justify-end mb-4">
        <div className="flex gap-2">
          {(["en", "bm"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="px-3 py-1 text-xs tracking-wider uppercase transition-all"
              style={{
                fontFamily: '"Inter", sans-serif',
                color: lang === l ? CREAM : GOLD,
                backgroundColor: lang === l ? GOLD : "transparent",
                border: `1px solid ${GOLD}`,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <section className="text-center mb-8">
        <div style={dividerStyle} className="mb-4">
          <span className="block h-px w-12" style={{ backgroundColor: GOLD }} />
          <span className="text-xs tracking-[0.3em] uppercase" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
            {t.title}
          </span>
          <span className="block h-px w-12" style={{ backgroundColor: GOLD }} />
        </div>
        <p className="text-lg italic" style={{ color: TEXT_MUTED }}>
          {t.subtitle}
        </p>
      </section>

      {sent && (
        <div
          className="text-center py-3 px-6 mb-6 rounded-sm"
          style={{ backgroundColor: CREAM_LIGHT, border: `1px solid ${GOLD}` }}
        >
          <p className="text-base" style={{ color: GOLD, fontFamily: '"Cormorant Garamond", serif' }}>
            {t.sent}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-10">
        <div className="mb-3">
          <label className="block text-sm tracking-[0.2em] uppercase mb-2" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
            {t.from}
          </label>
          <input
            type="text"
            value={guestName || ""}
            disabled
            className="w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900 disabled:opacity-70"
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: "1rem",
              backgroundColor: CREAM_LIGHT,
              borderColor: BORDER,
              color: TEXT,
            }}
          />
        </div>

        <div className="mb-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
            placeholder={t.placeholder}
            rows={4}
            className="w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors resize-y min-h-[100px]"
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: "1rem",
              backgroundColor: CREAM_LIGHT,
              borderColor: BORDER,
              color: TEXT,
            }}
          />
          <div className="text-right mt-1">
            <span className="text-xs" style={{ color: TEXT_MUTED, fontFamily: '"Inter", sans-serif' }}>
              {message.length} / {MAX_CHARS}
            </span>
          </div>
        </div>

        {(mutation as any).error && (
          <p className="text-sm mb-3" style={{ color: "#dc2626" }}>
            {(mutation as any).error.message}
          </p>
        )}

        <div className="text-center">
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={!message.trim()}
            className="px-10"
            style={{
              backgroundColor: GOLD,
              color: CREAM,
              fontFamily: '"Inter", sans-serif',
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontSize: "0.8rem",
              padding: "0.75rem 2.5rem",
              border: `1px solid ${GOLD}`,
            }}
          >
            {t.send}
          </Button>
        </div>
      </form>

      <section>
        <div style={dividerStyle} className="mb-6">
          <span className="block h-px w-8" style={{ backgroundColor: GOLD }} />
          <span className="text-xs tracking-[0.3em] uppercase" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
            {t.title}
          </span>
          <span className="block h-px w-8" style={{ backgroundColor: GOLD }} />
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-base" style={{ color: TEXT_MUTED }}>Loading...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <p className="text-base" style={{ color: "#dc2626" }}>Failed to load messages</p>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="text-center py-12">
            <span className="block h-px w-12 mx-auto mb-4" style={{ backgroundColor: GOLD, opacity: 0.3 }} />
            <p className="text-base" style={{ color: TEXT_MUTED, fontFamily: '"Cormorant Garamond", serif' }}>
              {t.noMessages}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-5 rounded-sm"
                style={{ backgroundColor: CREAM_LIGHT, border: `1px solid ${BORDER}` }}
              >
                <p className="text-base leading-relaxed mb-3" style={{ color: TEXT, fontFamily: '"Cormorant Garamond", serif' }}>
                  {msg.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: GOLD, fontFamily: '"Cormorant Garamond", serif' }}>
                    — {msg.guest_name}
                  </span>
                  <span className="text-xs" style={{ color: TEXT_MUTED, fontFamily: '"Inter", sans-serif' }}>
                    {formatDate(msg.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default RustyMessage;
