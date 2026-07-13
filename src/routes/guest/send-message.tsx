import { useState } from "react";
import { Send, Check, Heart } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getContent } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Textarea, Label } from "../../components/ui/Input";
import { supabase } from "../../lib/supabase";

const MAX_CHARS = 500;

export function SendMessage() {
  const { session } = useGuestAuth();
  const { lang, t } = useLang();

  const wedding = session?.wedding || null;
  const theme = getTheme(wedding);
  const cssVars = themeToCssVars(theme);
  const content = getContent(wedding!);

  const guest = session?.guest || null;

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  if (!wedding || !guest) return null;

  const guestName = guest.full_name || `${guest.first_name || ""} ${guest.last_name || ""}`.trim();
  const intro = content.message_intro || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;
    setError(null);
    setSubmitting(true);

    const now = new Date();
    const { error: insertError } = await supabase
      .from("guestbook_entries")
      .insert({
        wedding_id: wedding.id,
        author_name: guestName,
        message: message.trim(),
        is_approved: false,
        created_at: now.toISOString(),
      });

    setSubmitting(false);

    if (insertError) {
      setError(t("error"));
    } else {
      setSuccess(true);
      setTimestamp(now.toLocaleString(lang === "ms" ? "ms-MY" : "en-US"));
      setMessage("");
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setError(null);
    setTimestamp(null);
  };

  const charsRemaining = MAX_CHARS - message.length;

  return (
    <div style={cssVars} className="bg-[var(--color-bg)] min-h-screen pb-20">
      {/* Header */}
      <section className="max-w-2xl mx-auto px-6 pt-16 md:pt-24 pb-10 text-center">
        <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] mb-4 animate-fade-in-down opacity-0-init">
          {t("wellWishes")}
        </p>
        <h1 className="font-script text-4xl md:text-5xl text-[var(--color-primary)] mb-6 animate-fade-in-up opacity-0-init delay-100">
          {t("sendMessage")}
        </h1>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-12 bg-[var(--color-border)]/30" />
          <div className="w-1.5 h-1.5 rounded-full border border-[var(--color-border)]/40" />
          <div className="h-px w-12 bg-[var(--color-border)]/30" />
        </div>
        {intro && (
          <p className="font-body text-lg text-[var(--color-text)] leading-relaxed animate-fade-in-up opacity-0-init delay-200">
            {intro}
          </p>
        )}
      </section>

      {/* Form / Success */}
      <section className="max-w-xl mx-auto px-6">
        {success ? (
          /* Success confirmation */
          <div className="bg-[var(--color-surface)] border border-[var(--color-success)]/30 rounded-lg px-8 py-12 md:px-12 md:py-16 text-center animate-success-pop" style={{ borderRadius: "var(--button-radius, 8px)" }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-success)]/15 mb-6">
              <Heart size={28} className="text-[var(--color-success)]" fill="currentColor" />
            </div>
            <h2 className="font-script text-3xl text-[var(--color-primary)] mb-3">
              {t("messageSent")}
            </h2>
            <p className="font-body text-base text-[var(--color-text-muted)] mb-2">
              {t("messageSentDesc")}
            </p>
            {timestamp && (
              <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-8">
                {timestamp}
              </p>
            )}
            <Button variant="outline" size="md" onClick={handleReset}>
              {t("sendMessage")}
            </Button>
          </div>
        ) : (
          /* Message form */
          <form
            onSubmit={handleSubmit}
            className="bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg px-8 py-10 md:px-12 md:py-12 animate-fade-in-up opacity-0-init delay-200"
            style={{ borderRadius: "var(--button-radius, 8px)" }}
          >
            {/* Guest name (auto-filled, read-only) */}
            <div className="mb-6">
              <Label>{t("yourName")}</Label>
              <div className="px-4 py-3 bg-[var(--color-bg-light)] border border-[var(--color-border)]/15 rounded-lg font-body text-base text-[var(--color-text)]" style={{ borderRadius: "var(--button-radius, 8px)" }}>
                {guestName}
              </div>
            </div>

            {/* Message textarea */}
            <div className="mb-2">
              <Label>{t("yourMessage")}</Label>
              <Textarea
                value={message}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) setMessage(e.target.value);
                }}
                placeholder={t("yourMessage")}
                rows={6}
                maxLength={MAX_CHARS}
                className="font-body text-base"
                style={{ borderRadius: "var(--button-radius, 8px)" }}
              />
            </div>

            {/* Character counter */}
            <div className="flex justify-end mb-6">
              <p
                className={`font-ui text-xs tracking-wider ${
                  charsRemaining < 50
                    ? "text-[var(--color-error)]"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {charsRemaining} {t("charactersRemaining")}
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="font-ui text-sm text-[var(--color-error)] mb-4 text-center animate-fade-in">
                {error}
              </p>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              variant="outline"
              size="lg"
              disabled={submitting || !message.trim()}
              className="w-full"
            >
              {submitting ? (
                t("loading")
              ) : (
                <>
                  <Send size={14} className="mr-2" />
                  {t("submit")}
                </>
              )}
            </Button>
          </form>
        )}

        {/* Decorative footer */}
        <div className="flex items-center justify-center gap-3 mt-12">
          <div className="h-px w-16 bg-[var(--color-border)]/30" />
          <Check size={14} className="text-[var(--color-primary)]/50" />
          <div className="h-px w-16 bg-[var(--color-border)]/30" />
        </div>
      </section>
    </div>
  );
}

export default SendMessage;
