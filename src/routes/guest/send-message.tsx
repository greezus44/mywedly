import { useState } from "react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getCoverContent } from "../../lib/theme";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Textarea, Label } from "../../components/ui/Input";
import { Check, Send } from "lucide-react";

const MAX_CHARS = 500;

export function SendMessage() {
  const { session } = useGuestAuth();
  const { lang, t } = useLang();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  if (!session) return null;

  const { guest, wedding } = session;
  const content = getCoverContent(wedding);
  const theme = wedding.theme_config && "colors" in wedding.theme_config ? wedding.theme_config : null;

  const charsRemaining = MAX_CHARS - message.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;
    setError(null);
    setSubmitting(true);

    const { error: insertError } = await supabase.from("guestbook_entries").insert({
      wedding_id: wedding.id,
      author_name: guest.full_name,
      message: message.trim(),
      is_approved: false,
    });

    if (insertError) {
      setError(lang === "ms" ? "Gagal menghantar mesej. Sila cuba lagi." : "Failed to send message. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmittedAt(new Date().toLocaleString(lang === "ms" ? "ms-MY" : "en-US"));
    setSuccess(true);
    setSubmitting(false);
    setMessage("");
  };

  const handleReset = () => {
    setSuccess(false);
    setSubmittedAt(null);
    setError(null);
  };

  return (
    <div
      style={themeToCssVars(theme) as React.CSSProperties}
      className="min-h-full bg-[var(--color-bg)] py-16 md:py-24 px-6"
    >
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-up opacity-0-init">
          <h2 className="font-heading text-3xl md:text-4xl text-[var(--color-primary)] mb-3">
            {t("sendMessage")}
          </h2>
          {content.message_intro && (
            <p className="font-body text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
              {content.message_intro}
            </p>
          )}
        </div>

        {/* Success State */}
        {success ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg p-10 text-center shadow-[var(--shadow-card)] animate-success-pop">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-success)]/15 flex items-center justify-center">
              <Check size={28} className="text-[var(--color-success)]" />
            </div>
            <h3 className="font-heading text-xl md:text-2xl text-[var(--color-primary)] mb-2">
              {t("messageSent")}
            </h3>
            <p className="font-body text-sm text-[var(--color-text-muted)] mb-2">
              {t("messageSentDesc")}
            </p>
            {submittedAt && (
              <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-6">
                {submittedAt}
              </p>
            )}
            <Button variant="outline" size="md" onClick={handleReset}>
              {lang === "ms" ? "Hantar Mesej Lain" : "Send Another Message"}
            </Button>
          </div>
        ) : (
          /* Message Form */
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg p-6 md:p-8 shadow-[var(--shadow-soft)] animate-fade-in-up opacity-0-init delay-200">
            <form onSubmit={handleSubmit}>
              {/* Guest Name (Read-Only) */}
              <div className="mb-6">
                <Label>{t("guestName")}</Label>
                <div className="w-full px-4 py-3 border border-[var(--color-border)]/30 bg-[var(--color-bg)]/50 rounded-lg font-ui text-sm text-[var(--color-text)] cursor-not-allowed">
                  {guest.full_name}
                </div>
              </div>

              {/* Message Textarea */}
              <div className="mb-2">
                <Label>{t("yourMessage")}</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
                  placeholder={lang === "ms" ? "Tulis ucapan doa anda..." : "Write your well wishes..."}
                  maxLength={MAX_CHARS}
                  className="min-h-[140px]"
                  style={{ borderRadius: "var(--button-radius, 8px)" }}
                />
              </div>

              {/* Character Counter */}
              <div className="flex justify-end mb-6">
                <span
                  className={cn(
                    "font-ui text-xs",
                    charsRemaining < 50
                      ? "text-[var(--color-error)]"
                      : "text-[var(--color-text-muted)]"
                  )}
                >
                  {charsRemaining} {t("charactersRemaining")}
                </span>
              </div>

              {/* Error */}
              {error && (
                <p className="font-ui text-xs text-[var(--color-error)] text-center mb-4 animate-fade-in">
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!message.trim() || submitting}
                className="w-full"
              >
                {submitting ? (
                  t("loading")
                ) : (
                  <span className="flex items-center gap-2">
                    <Send size={14} />
                    {t("submit")}
                  </span>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default SendMessage;
