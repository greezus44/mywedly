import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth } from "../../lib/guest-auth";
import {
  themeToCssVars,
  getTheme,
  getLogoConfig,
  getLogoStyle,
  shouldShowLogo,
} from "../../lib/theme";
import { getDeviceType, cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { Send, Check } from "lucide-react";

const MAX_CHARS = 500;

export function SendMessage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLang();
  const { session } = useGuestAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    supabase.from("weddings").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (data) setWedding(data as Wedding);
    });
  }, [slug]);

  // Auto-fill name from session
  useEffect(() => {
    if (session?.guest_name) {
      setAuthorName(session.guest_name);
    }
  }, [session?.guest_name]);

  const theme = getTheme(wedding);
  const content = (wedding?.draft_content || wedding?.content || {}) as WeddingContent;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showLogo = shouldShowLogo(logo, "send-message");

  const charCount = message.length;
  const remaining = MAX_CHARS - charCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !wedding) return;
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("guestbook_entries").insert({
      wedding_id: wedding.id,
      guest_id: session?.guest_id || null,
      author_name: authorName.trim() || (lang === "ms" ? "Tetamu" : "Guest"),
      message: message.trim(),
      status: "pending",
    });

    if (insertError) {
      setError(lang === "ms" ? "Gagal menghantar. Sila cuba lagi." : "Failed to send. Please try again.");
    } else {
      setSuccess(true);
      setMessage("");
    }
    setSubmitting(false);
  };

  return (
    <div
      className="min-h-screen"
      style={{ ...themeToCssVars(theme), background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" } as React.CSSProperties}
    >
      {/* Logo */}
      {showLogo && logo.url && (
        <div className="flex justify-center pt-12">
          <img src={logo.url} alt="logo" style={getLogoStyle(logo, device)} />
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-12 text-center md:py-16">
        <p className="animate-fade-in-up text-[0.625rem] uppercase tracking-[0.4em]" style={{ color: "var(--color-text-muted)" }}>
          {lang === "ms" ? "Buku Tetamu" : "Guestbook"}
        </p>
        <h1 className="mt-4 animate-fade-in-up font-heading text-3xl md:text-5xl" style={{ color: "var(--color-primary)", animationDelay: "0.1s" }}>
          {t.sendMessage}
        </h1>
        {content.message_intro && (
          <p className="mx-auto mt-4 max-w-lg animate-fade-in-up font-body text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-muted)", animationDelay: "0.2s" }}>
            {content.message_intro}
          </p>
        )}
      </div>

      {/* Form */}
      <div className="mx-auto max-w-xl px-6 pb-16">
        {success ? (
          <div className="animate-fade-in-up rounded-2xl border p-8 text-center" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--color-primary)" }}>
              <Check className="h-6 w-6" style={{ color: "var(--color-button-text)" }} />
            </div>
            <h3 className="font-heading text-xl" style={{ color: "var(--color-primary)" }}>{t.thankYou}</h3>
            <p className="mt-2 font-body text-sm" style={{ color: "var(--color-text-muted)" }}>
              {t.messageSent}
            </p>
            <Button
              onClick={() => setSuccess(false)}
              variant="outline"
              className="mt-6"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" } as React.CSSProperties}
            >
              {lang === "ms" ? "Hantar Mesej Lain" : "Send Another Message"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="animate-fade-in-up space-y-5" style={{ animationDelay: "0.1s" }}>
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: "var(--color-text)" }}>
                {lang === "ms" ? "Nama Anda" : "Your Name"}
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="w-full rounded-lg border px-4 py-2.5 font-body text-sm outline-none transition"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: "var(--color-text)" }}>
                {lang === "ms" ? "Mesej Anda" : "Your Message"}
              </label>
              <Textarea
                value={message}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) setMessage(e.target.value);
                }}
                placeholder={t.messagePlaceholder}
                rows={5}
                className="resize-none"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text)",
                } as React.CSSProperties}
              />
              {/* Character counter */}
              <div className="flex justify-end">
                <span className={cn("text-xs", remaining < 50 ? "text-red-500" : "")} style={remaining >= 50 ? { color: "var(--color-text-muted)" } : undefined}>
                  {charCount} / {MAX_CHARS}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="font-body text-sm text-red-500">{error}</p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting || !message.trim()}
              className="flex w-full items-center justify-center gap-2 transition"
              style={{
                background: "var(--color-button-bg)",
                color: "var(--color-button-text)",
              } as React.CSSProperties}
            >
              {submitting ? (
                t.loading
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {t.submit}
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default SendMessage;
