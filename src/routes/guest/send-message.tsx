import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, Send, Check } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import { themeToCssVars, getTheme, coverToCssVars, getCoverConfig, getCoverContent } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Textarea, Label } from "../../components/ui/Input";

const MAX_CHARS = 500;

function SendMessageInner() {
  const navigate = useNavigate();
  const params = useParams();
  const slug = params.slug || "";
  const { session, loading } = useGuestAuth();
  const { lang, t } = useLang();

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wedding = session?.wedding ?? null;

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate(`/w/${slug}/login`, { replace: true });
    }
  }, [session, loading, slug, navigate]);

  const guestName = session?.guest?.full_name || session?.guest?.first_name || session?.guest?.username || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !message.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const { error: insErr } = await supabase.from("guestbook_entries").insert({
        wedding_id: session.wedding.id,
        author_name: guestName,
        message: message.trim(),
        is_approved: false,
      });

      if (insErr) {
        setError(insErr.message);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setMessage("");
      setSubmitting(false);

      // Reset success after 3s
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to send message. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading || !session) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg)" } as CSSProperties}
      >
        <Heart size={24} className="animate-pulse" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  const theme = getTheme(wedding);
  const cover = getCoverConfig(wedding);
  const content = getCoverContent(wedding);

  const remaining = MAX_CHARS - message.length;

  return (
    <div
      className="min-h-screen pb-16"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover) } as CSSProperties}
    >
      {/* Header */}
      <section className="px-6 md:px-12 pt-12 md:pt-16 text-center animate-fade-in opacity-0-init">
        <p
          className="font-ui text-xs uppercase tracking-luxe mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          {t("sendMessage")}
        </p>
        <h1
          className="font-script text-3xl md:text-5xl mb-4"
          style={{ color: "var(--color-text)" }}
        >
          {t("sendMessage")}
        </h1>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-12" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
          <Heart size={14} style={{ color: "var(--color-primary)" }} />
          <div className="h-px w-12" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
        </div>
        {content.message_intro && (
          <p
            className="font-body text-base md:text-lg max-w-xl mx-auto leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            {content.message_intro}
          </p>
        )}
      </section>

      {/* Message Form */}
      <section className="px-6 md:px-12 py-8 max-w-2xl mx-auto animate-fade-in-up opacity-0-init delay-200">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-8 md:p-10"
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius, 8px)",
            border: "1px solid var(--color-border)",
            borderColor: "color-mix(in srgb, var(--color-border) 20%, transparent)",
            boxShadow: "0 4px 24px rgba(184, 151, 58, 0.10)",
          }}
        >
          {/* Auto-filled name (read-only) */}
          <div>
            <Label>{t("username")}</Label>
            <div
              className="px-4 py-3 font-ui text-sm"
              style={{
                background: "var(--color-bg-light)",
                border: "1px solid var(--color-border)",
                borderColor: "color-mix(in srgb, var(--color-border) 15%, transparent)",
                borderRadius: "var(--radius, 8px)",
                color: "var(--color-text)",
              }}
            >
              {guestName}
            </div>
          </div>

          {/* Message textarea */}
          <div>
            <Label>{t("sendMessage")}</Label>
            <Textarea
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setMessage(e.target.value);
                }
              }}
              required
              maxLength={MAX_CHARS}
              placeholder="Write your wishes and message..."
              disabled={submitting}
              rows={6}
            />
            {/* Character counter */}
            <div className="flex justify-end mt-2">
              <p
                className="font-ui text-xs"
                style={{
                  color: remaining < 50 ? "var(--color-warning)" : "var(--color-text-muted)",
                }}
              >
                {remaining} {t("charactersRemaining")}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              className="font-ui text-sm animate-fade-in"
              style={{ color: "var(--color-error)" }}
            >
              {error}
            </p>
          )}

          {/* Success message */}
          {success && (
            <div
              className="flex items-center justify-center gap-2 py-3 animate-success-pop"
              style={{
                background: "color-mix(in srgb, var(--color-success) 12%, transparent)",
                borderRadius: "var(--radius, 8px)",
                color: "var(--color-success)",
              }}
            >
              <Check size={16} />
              <p className="font-ui text-sm uppercase tracking-wider-luxe">
                {t("messageSent")}
              </p>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={submitting || !message.trim()}
          >
            {submitting ? t("loading") : t("submit")}
            {!submitting && <Send size={14} className="ml-2" />}
          </Button>
        </form>
      </section>
    </div>
  );
}

export function SendMessage() {
  return (
    <GuestAuthProvider>
      <SendMessageInner />
    </GuestAuthProvider>
  );
}

export default SendMessage;
