import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import {
  themeToCssVars,
  getTheme,
  getLogoConfig,
  getLogoStyle,
  shouldShowLogo,
} from "../../lib/theme";
import { getDeviceType } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { Heart, Send, Check } from "lucide-react";

const MAX_CHARS = 500;

function SendMessageInner() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, loading } = useGuestAuth();
  const { lang, t } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session || (slug && session.wedding_slug !== slug)) {
      navigate(`/w/${slug}/login`, { replace: true });
    }
  }, [session, loading, slug, navigate]);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("weddings")
      .select("*")
      .eq("id", session.wedding_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setWedding(data as Wedding);
      });
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !message.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("guestbook_entries").insert({
      wedding_id: session.wedding_id,
      guest_id: session.guest_id,
      author_name: session.guest_name,
      message: message.trim(),
      status: "pending",
    });
    if (!error) {
      setSubmitted(true);
      setMessage("");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <Heart className="h-8 w-8 animate-pulse" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!session) return null;

  const theme = getTheme(wedding);
  const content = (wedding?.content || wedding?.draft_content || {}) as Record<string, unknown>;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const remaining = MAX_CHARS - message.length;

  return (
    <div
      className="min-h-screen"
      style={{ ...themeToCssVars(theme) } as React.CSSProperties}
    >
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Logo */}
        {shouldShowLogo(logo, "send-message") && logo.url && (
          <div className="mb-8 flex justify-center animate-fade-in">
            <img src={logo.url} alt="Logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center animate-fade-in-up">
          <h1
            className="mb-2"
            style={{
              color: "var(--color-text)",
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
            }}
          >
            {t.sendMessage}
          </h1>
          <div className="mx-auto flex w-16 items-center justify-center gap-2">
            <span className="h-px flex-1" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
            <Heart className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
            <span className="h-px flex-1" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
          </div>
        </div>

        {/* Message intro */}
        {typeof content.message_intro === "string" && content.message_intro && (
          <p
            className="mb-6 text-center leading-relaxed animate-fade-in-up"
            style={{
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-body)",
              animationDelay: "0.1s",
            }}
          >
            {content.message_intro}
          </p>
        )}

        {/* Success message */}
        {submitted ? (
          <div
            className="rounded-2xl p-8 text-center animate-fade-in-up"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "color-mix(in srgb, var(--color-primary) 15%, transparent)" }}
            >
              <Check className="h-8 w-8" style={{ color: "var(--color-primary)" }} />
            </div>
            <h3
              className="mb-2"
              style={{
                color: "var(--color-text)",
                fontFamily: "var(--font-heading)",
                fontSize: "1.5rem",
              }}
            >
              {t.thankYou}
            </h3>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontFamily: "var(--font-body)",
              }}
            >
              {t.messageSent}
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSubmitted(false);
                setMessage("");
              }}
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              {lang === "ms" ? "Hantar Mesej Lain" : "Send Another Message"}
            </Button>
          </div>
        ) : (
          /* Message form */
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl p-6 animate-fade-in-up"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              animationDelay: "0.15s",
            }}
          >
            {/* Auto-filled name */}
            <div className="mb-4">
              <label
                className="mb-1.5 block text-sm font-medium"
                style={{ color: "var(--color-text)", fontFamily: "var(--font-body)" }}
              >
                {lang === "ms" ? "Nama" : "Name"}
              </label>
              <input
                type="text"
                value={session.guest_name}
                readOnly
                className="w-full cursor-not-allowed rounded-lg px-4 py-3 text-sm outline-none"
                style={{
                  background: "color-mix(in srgb, var(--color-text-muted) 8%, transparent)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontFamily: "var(--font-body)",
                }}
              />
            </div>

            {/* Message textarea */}
            <div className="mb-2">
              <label
                className="mb-1.5 block text-sm font-medium"
                style={{ color: "var(--color-text)", fontFamily: "var(--font-body)" }}
              >
                {lang === "ms" ? "Mesej" : "Message"}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
                placeholder={t.messagePlaceholder}
                maxLength={MAX_CHARS}
                rows={5}
                className="w-full resize-y rounded-lg px-4 py-3 text-sm outline-none transition focus:ring-2"
                style={{
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontFamily: "var(--font-body)",
                  // @ts-expect-error CSS custom property
                  "--tw-ring-color": "var(--color-primary)",
                }}
              />
            </div>

            {/* Character counter */}
            <div className="mb-4 flex justify-end">
              <span
                className="text-xs"
                style={{
                  color: remaining < 50 ? "#e57373" : "var(--color-text-muted)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {message.length} / {MAX_CHARS}
              </span>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.01] active:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "var(--color-button-bg)",
                color: "var(--color-button-text)",
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              <Send className="h-4 w-4" />
              {submitting ? t.loading : t.submit}
            </button>
          </form>
        )}
      </div>
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
