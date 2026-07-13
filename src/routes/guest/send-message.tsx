import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Send } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, coverToCssVars, getTheme, getCoverConfig, getCoverContent, getLogoConfig, getLogoStyle } from "../../lib/theme";
import { getDeviceType, cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Textarea, Label } from "../../components/ui/Input";

const MAX_CHARS = 500;

export function SendMessage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session } = useGuestAuth();
  const { lang, t } = useLang();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) navigate(`/w/${slug}/login`, { replace: true });
  }, [session, slug, navigate]);

  if (!session) return null;

  const wedding = session.wedding;
  const theme = getTheme(wedding);
  const cover = getCoverConfig(wedding);
  const content = getCoverContent(wedding);
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const authorName = session.guest.full_name;

  const showLogo = logo.visible && logo.url && (logo.showOnPages === "all-pages" || (logo.showOnPages === "custom" && logo.customPages.includes("send-message")));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);
    const { error: insertError } = await supabase.from("guestbook_entries").insert({
      wedding_id: wedding.id,
      author_name: authorName,
      message: message.trim(),
      is_approved: false,
    });
    if (insertError) { setError("Failed to send message. Please try again."); setSubmitting(false); return; }
    setSuccess(true);
    setMessage("");
    setSubmitting(false);
    setTimeout(() => setSuccess(false), 4000);
  };

  const charsRemaining = MAX_CHARS - message.length;
  const isOverLimit = message.length > MAX_CHARS;

  return (
    <div
      className="min-h-screen px-6 py-12 md:py-20"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover) } as React.CSSProperties}
    >
      <div className="max-w-2xl mx-auto">
        {showLogo && (
          <div className="flex justify-center mb-8 animate-fade-in">
            <img src={logo.url!} alt="Logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="font-script text-4xl text-[var(--color-primary)] mb-3">{t("sendMessage")}</h1>
          {content.message_intro && (
            <p className="font-body text-lg text-[var(--color-text-muted)]">{content.message_intro}</p>
          )}
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg p-6 md:p-8 animate-fade-in-up opacity-0-init delay-200">
          {success && (
            <div className="mb-6 px-4 py-3 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-lg text-center animate-success-pop">
              <p className="font-ui text-sm text-[var(--color-success)]">{t("messageSent")}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>{t("username")}</Label>
              <div className="px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)]/20 rounded-lg font-ui text-sm text-[var(--color-text-muted)]">
                {authorName}
              </div>
            </div>

            <div>
              <Label>{t("sendMessage")}</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message to the couple..."
                rows={5}
                maxLength={MAX_CHARS}
              />
              <div className="flex justify-end mt-1.5">
                <span className={cn(
                  "font-ui text-xs",
                  isOverLimit ? "text-[var(--color-error)]" : "text-[var(--color-text-muted)]"
                )}>
                  {charsRemaining} {t("charactersRemaining")}
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
              disabled={submitting || !message.trim() || isOverLimit}
              className="w-full"
            >
              <Send size={14} className="mr-2" />
              {submitting ? t("loading") : t("submit")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SendMessage;
