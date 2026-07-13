import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ChevronRight } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getCoverContent } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Input";
import { supabase } from "../../lib/supabase";
import type { Wedding } from "../../lib/supabase";

export function GuestLogin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { signIn, session } = useGuestAuth();
  const { lang, setLang, t } = useLang();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [wedding, setWedding] = useState<Wedding | null>(null);

  const theme = getTheme(wedding);
  const cssVars = themeToCssVars(theme);
  const content = getCoverContent(wedding || {});

  useEffect(() => {
    if (session && slug) {
      navigate(`/w/${slug}`, { replace: true });
    }
  }, [session, slug, navigate]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("weddings")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (data) setWedding(data as Wedding);
    })();
  }, [slug]);

  const coupleNames =
    content.cover_heading ||
    (wedding ? `${wedding.couple_name_one} & ${wedding.couple_name_two}` : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !slug) return;
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn(username, slug);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
    } else {
      navigate(`/w/${slug}`, { replace: true });
    }
  };

  return (
    <div
      style={cssVars}
      className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-6 py-12"
    >
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Language selector */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setLang("en")}
            className={`font-ui text-xs uppercase tracking-wider-luxe transition-opacity ${
              lang === "en"
                ? "text-[var(--color-primary)] opacity-100"
                : "text-[var(--color-text-muted)] opacity-50 hover:opacity-80"
            }`}
          >
            {t("english")}
          </button>
          <span className="text-[var(--color-border)]/40 text-xs">|</span>
          <button
            onClick={() => setLang("ms")}
            className={`font-ui text-xs uppercase tracking-wider-luxe transition-opacity ${
              lang === "ms"
                ? "text-[var(--color-primary)] opacity-100"
                : "text-[var(--color-text-muted)] opacity-50 hover:opacity-80"
            }`}
          >
            {t("bahasaMelayu")}
          </button>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg shadow-[var(--shadow-soft)] px-8 py-12 md:px-12 md:py-16">
          {/* Couple names */}
          {coupleNames && (
            <h1 className="font-script text-3xl md:text-4xl text-[var(--color-primary)] text-center mb-2">
              {coupleNames}
            </h1>
          )}

          {/* Subtitle */}
          <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] text-center mb-10">
            {t("guestLogin")}
          </p>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px w-12 bg-[var(--color-border)]/30" />
            <div className="w-1.5 h-1.5 rounded-full border border-[var(--color-border)]/40" />
            <div className="h-px w-12 bg-[var(--color-border)]/30" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <Label>{t("username")}</Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("username")}
                autoFocus
                autoComplete="off"
                className="text-center font-ui tracking-wider-luxe"
                style={{ borderRadius: "var(--button-radius, 8px)" }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[var(--color-error)] animate-fade-in">
                <AlertCircle size={16} className="shrink-0" />
                <p className="font-ui text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="outline"
              size="lg"
              disabled={submitting || !username.trim()}
              className="w-full"
            >
              {submitting ? t("loading") : t("enter")}
              {!submitting && <ChevronRight size={16} className="ml-2" />}
            </Button>
          </form>
        </div>

        {/* Helper text */}
        {wedding?.signin_helper && (
          <p className="font-heading text-sm text-[var(--color-text-muted)] text-center mt-6 italic">
            {wedding.signin_helper}
          </p>
        )}
      </div>
    </div>
  );
}

export default GuestLogin;
