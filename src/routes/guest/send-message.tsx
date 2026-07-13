import { useState } from "react";
import { Send } from "lucide-react";
import { supabase, type GuestbookEntry } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { getTheme, themeToCssVars } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label } from "../../components/ui/Input";

const MAX_CHARS = 500;

export function SendMessage() {
  const { session } = useGuestAuth();
  const { t } = useLang();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!session) return null;

  const { wedding, guest } = session;
  const theme = getTheme(wedding);
  const content = (wedding.content || {}) as Record<string, unknown>;
  const draftContent = (wedding.draft_content || {}) as Record<string, never>;
  const c = { ...content, ...draftContent };
  const messageIntro = (c.message_intro as string) || "";

  // Auto-fill name from session
  const displayName = name || guest.first_name || guest.full_name || guest.username;
  const remaining = MAX_CHARS - message.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { error: insertErr } = await supabase
        .from("guestbook_entries")
        .insert({
          wedding_id: wedding.id,
          author_name: displayName,
          message: message.trim(),
          is_approved: false,
        });

      if (insertErr) throw insertErr;

      setSuccess(true);
      setMessage("");
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 py-16"
      style={themeToCssVars(theme) as React.CSSProperties}
    >
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] mb-4 opacity-0-init animate-fade-in">
            {t("invitation")}
          </p>
          <h1 className="font-script text-4xl md:text-5xl text-[var(--color-text)] mb-6 opacity-0-init animate-fade-in-up">
            {t("sendMessage")}
          </h1>
          <div className="flex items-center justify-center gap-4 opacity-0-init animate-fade-in-up delay-100">
            <span className="h-px w-12 bg-[var(--color-primary)]/30" />
            <span className="text-[var(--color-primary)] text-xs">✦</span>
            <span className="h-px w-12 bg-[var(--color-primary)]/30" />
          </div>
          {messageIntro && (
            <p className="font-body text-lg text-[var(--color-text)] leading-relaxed mt-6 opacity-0-init animate-fade-in-up delay-200">
              {messageIntro}
            </p>
          )}
        </div>

        {/* Success state */}
        {success && (
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-primary)]/20 p-8 text-center mb-6 animate-success-pop"
            style={{ borderRadius: "8px" }}
          >
            <p className="font-heading text-xl text-[var(--color-primary)] mb-2">
              {t("messageSent")}
            </p>
            <p className="font-body text-sm text-[var(--color-text-muted)]">
              {t("sendMessage")}
            </p>
            <Button
              variant="outline"
              size="md"
              className="mt-6"
              onClick={() => setSuccess(false)}
            >
              {t("sendMessage")}
            </Button>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form
            onSubmit={handleSubmit}
            className="bg-[var(--color-surface)] border border-[var(--color-primary)]/15 p-6 md:p-8 space-y-5 opacity-0-init animate-fade-in-up delay-300"
            style={{ borderRadius: "8px" }}
          >
            {/* Name (auto-filled) */}
            <div>
              <Label>{t("username")}</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={guest.first_name || guest.full_name || guest.username}
                className="w-full"
                style={{ borderRadius: "8px" }}
              />
            </div>

            {/* Message */}
            <div>
              <Label>{t("sendMessage")}</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
                required
                rows={5}
                placeholder={t("sendMessage")}
                className="w-full"
                style={{ borderRadius: "8px" }}
              />
              {/* Character counter */}
              <div className="flex justify-end mt-1.5">
                <span
                  className={cn(
                    "font-ui text-xs",
                    remaining < 50
                      ? "text-[var(--color-error)]"
                      : "text-[var(--color-text-muted)]"
                  )}
                >
                  {remaining} {t("charactersRemaining")}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="font-ui text-sm text-[var(--color-error)] text-center">
                {error}
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading || !message.trim()}
              style={{ borderRadius: "8px" }}
            >
              {loading ? t("loading") : t("submit")}
              <Send size={16} className="ml-2" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default SendMessage;
