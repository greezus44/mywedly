import { useState } from "react";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase } from "../../lib/supabase";
import { themeToCssVars, getTheme, getCoverContent } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { Textarea, Label } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Check } from "lucide-react";

const MAX_CHARS = 500;

export function SendMessage() {
  const { lang, t } = useLang();
  const { session } = useGuestAuth();
  const guest = session?.guest;
  const wedding = session?.wedding;
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ timestamp: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!wedding || !guest) return null;

  const theme = getTheme(wedding);
  const content = getCoverContent(wedding);
  const intro = content.message_intro || "";
  const guestName = guest.full_name || `${guest.first_name ?? ""} ${guest.last_name ?? ""}`.trim() || guest.username;
  const remaining = MAX_CHARS - message.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);
    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from("guestbook_entries").insert({
      wedding_id: wedding.id,
      author_name: guestName,
      message: message.trim(),
      is_approved: false,
    });
    setSubmitting(false);
    if (insertError) { setError(insertError.message); return; }
    setSuccess({ timestamp: now });
    setMessage("");
  };

  const resetSuccess = () => {
    setSuccess(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]" style={themeToCssVars(theme) as React.CSSProperties}>
      <div className="max-w-2xl mx-auto px-6 py-20 md:py-28 flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-primary)] mb-4 opacity-0-init animate-fade-in">
            {t("sendMessage")}
          </p>
          <h1 className="font-script text-4xl md:text-5xl text-[var(--color-text)] mb-4 opacity-0-init animate-fade-in-up delay-100">
            {t("sendMessage")}
          </h1>
          <div className="flex items-center justify-center gap-2 mb-6 opacity-0-init animate-fade-in delay-200">
            <span className="h-px w-12 bg-[var(--color-border)]/40" />
            <span className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-primary)]">♡</span>
            <span className="h-px w-12 bg-[var(--color-border)]/40" />
          </div>
          {intro && (
            <p className="font-body text-lg text-[var(--color-text-muted)] max-w-md mx-auto opacity-0-init animate-fade-in-up delay-300">
              {intro}
            </p>
          )}
        </div>

        {/* Success state */}
        {success ? (
          <div className="w-full max-w-md text-center animate-success-pop">
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-[var(--color-success)]/15">
              <Check size={32} className="text-[var(--color-success)]" />
            </div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] mb-3">
              {t("messageSent")}
            </h2>
            <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-8">
              {new Date(success.timestamp).toLocaleString(lang === "ms" ? "ms-MY" : "en-US", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
            <Button variant="outline" size="md" onClick={resetSuccess}>
              {t("sendMessage")}
            </Button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 opacity-0-init animate-fade-in-up delay-300">
            {/* Guest name (read-only) */}
            <div>
              <Label>{t("username")}</Label>
              <input
                type="text"
                value={guestName}
                readOnly
                className="w-full px-4 py-3 bg-[var(--color-bg-light)] border border-[var(--color-border)]/20 text-[var(--color-text-muted)] font-ui text-sm rounded-lg cursor-not-allowed"
                style={{ borderRadius: "var(--button-radius, 8px)" }}
              />
            </div>

            {/* Message */}
            <div>
              <Label>{t("sendMessage")}</Label>
              <Textarea
                value={message}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) setMessage(e.target.value);
                }}
                placeholder={t("sendMessage")}
                maxLength={MAX_CHARS}
                rows={6}
                style={{ borderRadius: "var(--button-radius, 8px)" }}
              />
              <div className="flex justify-end mt-2">
                <span className={cn(
                  "font-ui text-xs",
                  remaining < 50 ? "text-[var(--color-error)]" : "text-[var(--color-text-muted)]"
                )}>
                  {remaining} {t("charactersRemaining")}
                </span>
              </div>
            </div>

            {error && (
              <p className="font-ui text-xs text-[var(--color-error)] text-center">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting || !message.trim()}
              className="w-full"
            >
              {submitting ? t("loading") : t("submit")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default SendMessage;
