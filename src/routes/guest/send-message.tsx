import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import {
  themeToCssVars,
  getTheme,
  getLogoConfig,
  getLogoStyle,
  shouldShowLogo,
} from "../../lib/theme";
import { getDeviceType } from "../../lib/utils";
import { Send, Check } from "lucide-react";

const MAX_CHARS = 500;

export function SendMessage() {
  const { slug } = useParams<{ slug: string }>();
  const { session } = useGuestAuth();
  const { lang, t } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("weddings")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setWedding(data as Wedding);
      });
  }, [slug]);

  const theme = getTheme(wedding);
  const content = (wedding?.content || {}) as WeddingContent;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showLogo = shouldShowLogo(logo, "send-message") && logo.url;

  const authorName = session?.guest_name || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !wedding || !session) return;
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("guestbook_entries").insert({
      wedding_id: wedding.id,
      guest_id: session.guest_id,
      author_name: authorName,
      message: message.trim(),
      status: "pending" as const,
    });

    if (insertError) {
      setError(lang === "ms" ? "Gagal menghantar mesej. Sila cuba lagi." : "Failed to send message. Please try again.");
    } else {
      setSubmitted(true);
      setMessage("");
    }
    setSubmitting(false);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        ...themeToCssVars(theme),
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
      } as React.CSSProperties}
    >
      {/* Header */}
      <section className="px-6 py-16 md:py-20">
        {/* Logo */}
        {showLogo && (
          <div className="mb-10 flex justify-center animate-fade-in" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <img src={logo.url!} alt="logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        <p
          className="mb-4 text-center font-body text-xs uppercase tracking-[0.3em] text-gray-400 animate-fade-in-up"
          style={{ animationDelay: "0.2s", opacity: 0 }}
        >
          {lang === "ms" ? "Tinggalkan Pesanan" : "Leave a Message"}
        </p>
        <h1
          className="text-center font-heading text-3xl font-light md:text-5xl animate-fade-in-up"
          style={{
            animationDelay: "0.3s",
            opacity: 0,
            color: "var(--color-text)",
            fontFamily: "var(--font-heading)",
          }}
        >
          {lang === "ms" ? "Hantar Mesej" : "Send Message"}
        </h1>

        {/* Message intro */}
        {content.message_intro && (
          <p
            className="mx-auto mt-6 max-w-lg text-center font-body text-sm leading-relaxed text-gray-500 md:text-base animate-fade-in-up"
            style={{ animationDelay: "0.4s", opacity: 0 }}
          >
            {content.message_intro}
          </p>
        )}
      </section>

      {/* Form */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-xl">
          {submitted ? (
            <div
              className="flex flex-col items-center justify-center border border-gray-200 bg-white px-6 py-16 animate-fade-in-up"
              style={{ animationDelay: "0.1s", opacity: 0, borderRadius: "0px" }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "var(--color-text)" }}
              >
                <Check className="h-6 w-6" style={{ color: "var(--color-bg)" }} />
              </div>
              <p className="font-heading text-xl font-light text-gray-800">{t.thankYou}</p>
              <p className="mt-2 font-body text-sm text-gray-500">{t.messageSent}</p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setMessage("");
                }}
                className="mt-6 font-body text-xs uppercase tracking-[0.2em] text-gray-400 transition-opacity hover:opacity-70"
              >
                {lang === "ms" ? "Tulis lagi" : "Write another"}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="border border-gray-200 bg-white p-6 md:p-8 animate-fade-in-up"
              style={{ animationDelay: "0.2s", opacity: 0, borderRadius: "0px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              {/* Auto-filled name */}
              <div className="mb-5">
                <label className="mb-2 block font-body text-xs uppercase tracking-[0.2em] text-gray-400">
                  {lang === "ms" ? "Nama" : "Name"}
                </label>
                <div
                  className="w-full border border-gray-200 px-4 py-3 font-body text-sm text-gray-700"
                  style={{ background: "var(--color-surface)" }}
                >
                  {authorName}
                </div>
              </div>

              {/* Message textarea */}
              <div className="mb-3">
                <label className="mb-2 block font-body text-xs uppercase tracking-[0.2em] text-gray-400">
                  {lang === "ms" ? "Mesej" : "Message"}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CHARS) setMessage(e.target.value);
                  }}
                  placeholder={t.messagePlaceholder}
                  rows={5}
                  className="w-full resize-none border border-gray-200 px-4 py-3 font-body text-sm text-gray-800 placeholder-gray-300 outline-none transition focus:border-gray-400"
                  style={{ background: "var(--color-bg)" }}
                  disabled={submitting}
                />
              </div>

              {/* Character counter */}
              <div className="mb-5 flex justify-end">
                <span className={`font-body text-xs ${message.length > MAX_CHARS * 0.9 ? "text-gray-600" : "text-gray-300"}`}>
                  {message.length} / {MAX_CHARS}
                </span>
              </div>

              {/* Error */}
              {error && (
                <p className="mb-4 font-body text-sm text-red-500">{error}</p>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="flex w-full items-center justify-center gap-2 px-6 py-3 font-body text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "var(--color-text)",
                  color: "var(--color-bg)",
                } as React.CSSProperties}
              >
                <Send className="h-4 w-4" />
                {submitting ? (lang === "ms" ? "Menghantar..." : "Sending...") : t.submit}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

export default SendMessage;
