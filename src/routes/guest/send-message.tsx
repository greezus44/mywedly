import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getLogoConfig, getLogoStyle, shouldShowLogo } from "../../lib/theme";
import { getDeviceType, cn } from "../../lib/utils";
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
    supabase.from("weddings").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (data) setWedding(data as Wedding);
    });
  }, [slug]);

  const theme = getTheme(wedding);
  const content = (wedding?.draft_content || wedding?.content || {}) as Record<string, unknown>;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showLogo = shouldShowLogo(logo, "send-message");

  const messageIntro = content.message_intro ? String(content.message_intro) : "";
  const authorName = session?.guest_name || "";
  const charCount = message.length;
  const remaining = MAX_CHARS - charCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !wedding || !session) return;
    setSubmitting(true);
    setError(null);

    try {
      const { error: iError } = await supabase.from("guestbook_entries").insert({
        wedding_id: wedding.id,
        guest_id: session.guest_id,
        author_name: authorName,
        message: message.trim(),
        status: "pending",
      });

      if (iError) throw iError;

      setSubmitted(true);
      setMessage("");
    } catch {
      setError(lang === "en" ? "Failed to send message. Please try again." : "Gagal menghantar mesej. Sila cuba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen px-6 py-12 md:py-16"
      style={{
        ...themeToCssVars(theme),
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
      } as React.CSSProperties}
    >
      <div className="max-w-xl mx-auto">
        {/* Logo */}
        {showLogo && logo.url && (
          <div className="flex justify-center mb-8 animate-fade-in">
            <img src={logo.url} alt="logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: "var(--color-text-muted)" }}>
            {lang === "en" ? "Share Your Wishes" : "Kongsi Ucapan"}
          </p>
          <h1
            className="font-heading"
            style={{ color: "var(--color-primary)", fontSize: "2.5rem", fontWeight: 400, letterSpacing: "-0.01em" }}
          >
            {t.sendMessage}
          </h1>
        </div>

        {/* Intro */}
        {messageIntro && (
          <p
            className="text-center text-sm leading-relaxed mb-8 max-w-md mx-auto animate-fade-in-up"
            style={{ color: "var(--color-text-muted)", animationDelay: "0.1s" }}
          >
            {messageIntro}
          </p>
        )}

        {/* Success state */}
        {submitted ? (
          <div
            className="rounded-2xl border p-10 text-center animate-fade-in-up"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
            }}
          >
            <div className="flex justify-center mb-4">
              <div
                className="rounded-full p-3"
                style={{ background: "var(--color-button-bg)" }}
              >
                <Check className="w-6 h-6" style={{ color: "var(--color-button-text)" }} />
              </div>
            </div>
            <h3
              className="font-heading text-xl mb-2"
              style={{ color: "var(--color-primary)" }}
            >
              {t.thankYou}
            </h3>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {t.messageSent}
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 text-sm underline transition-opacity hover:opacity-70"
              style={{ color: "var(--color-primary)" }}
            >
              {lang === "en" ? "Send another message" : "Hantar mesej lain"}
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            {/* Name (auto-filled, read-only) */}
            <div className="mb-6">
              <label
                className="block text-xs tracking-widest uppercase mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                {lang === "en" ? "Your Name" : "Nama Anda"}
              </label>
              <input
                type="text"
                value={authorName}
                readOnly
                className="w-full rounded-xl border px-4 py-3 text-sm cursor-not-allowed"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-muted)",
                }}
              />
            </div>

            {/* Message textarea */}
            <div className="mb-2">
              <label
                className="block text-xs tracking-widest uppercase mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                {lang === "en" ? "Message" : "Mesej"}
              </label>
              <textarea
                value={message}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) {
                    setMessage(e.target.value);
                  }
                }}
                placeholder={t.messagePlaceholder}
                rows={5}
                maxLength={MAX_CHARS}
                className="w-full rounded-xl border px-4 py-3 text-sm resize-none transition-all focus:outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            {/* Character counter */}
            <div className="flex justify-end mb-6">
              <span
                className={cn("text-xs", remaining < 50 ? "text-red-500" : "")}
                style={remaining < 50 ? {} : { color: "var(--color-text-muted)" }}
              >
                {charCount} / {MAX_CHARS}
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="w-full rounded-xl py-4 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: "var(--color-button-bg)",
                color: "var(--color-button-text)",
              }}
            >
              {submitting ? (
                <span className="animate-pulse">{t.loading}</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t.submit}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default SendMessage;
