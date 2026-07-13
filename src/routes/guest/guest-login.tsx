import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getCoverContent } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Input";

export function GuestLogin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { signIn, session } = useGuestAuth();
  const { lang, setLang, t } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchWedding() {
      if (!slug) return;
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (!error && data) setWedding(data as Wedding);
      setLoading(false);
    }
    fetchWedding();
  }, [slug]);

  // Redirect if already logged in
  useEffect(() => {
    if (session && slug) {
      navigate(`/w/${slug}`, { replace: true });
    }
  }, [session, slug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !slug) return;
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn(username.trim(), slug);
    if (signInError) {
      setError(signInError);
      setSubmitting(false);
    } else {
      navigate(`/w/${slug}`, { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] animate-pulse">
          {t("loading")}
        </p>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-6">
        <p className="font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
          {lang === "ms" ? "Jemputan tidak dijumpai" : "Invitation not found"}
        </p>
      </div>
    );
  }

  const content = getCoverContent(wedding);
  const theme = wedding.theme_config && "colors" in wedding.theme_config ? wedding.theme_config : null;

  return (
    <div
      style={themeToCssVars(theme) as React.CSSProperties}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[var(--color-bg)]"
    >
      <div className="w-full max-w-sm animate-fade-in-up opacity-0-init">
        {/* Language Selector */}
        <div className="text-center mb-8">
          <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-primary)] mb-3">
            {t("selectLanguage")}
          </p>
          <div className="inline-flex gap-2">
            <button
              onClick={() => setLang("en")}
              className={cn(
                "px-4 py-1.5 border font-ui text-xs uppercase tracking-wider-luxe rounded-lg transition-all",
                lang === "en"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5"
                  : "border-[var(--color-border)]/30 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
              )}
            >
              {t("english")}
            </button>
            <button
              onClick={() => setLang("ms")}
              className={cn(
                "px-4 py-1.5 border font-ui text-xs uppercase tracking-wider-luxe rounded-lg transition-all",
                lang === "ms"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5"
                  : "border-[var(--color-border)]/30 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
              )}
            >
              {t("bahasaMelayu")}
            </button>
          </div>
        </div>

        {/* Couple Names */}
        <div className="text-center mb-8">
          <h2 className="font-script text-3xl md:text-4xl text-[var(--color-primary)] mb-1">
            {wedding.couple_name_one}
          </h2>
          <p className="font-script text-xl text-[var(--color-primary)]/50 mb-1">&</p>
          <h2 className="font-script text-3xl md:text-4xl text-[var(--color-primary)] mb-3">
            {wedding.couple_name_two}
          </h2>
          <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)]">
            {t("guestLogin")}
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg p-8 shadow-[var(--shadow-card)]">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <Label>{t("username")}</Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={lang === "ms" ? "Masukkan nama pengguna" : "Enter your username"}
                autoFocus
                autoComplete="off"
                className="text-center"
                style={{ borderRadius: "var(--button-radius, 8px)" }}
              />
            </div>

            {error && (
              <p className="font-ui text-xs text-[var(--color-error)] text-center mb-4 animate-fade-in">
                {error}
              </p>
            )}

            {wedding.signin_helper && (
              <p className="font-ui text-xs text-[var(--color-text-muted)] text-center mb-4 italic">
                {wedding.signin_helper}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!username.trim() || submitting}
              className="w-full"
            >
              {submitting ? t("loading") : t("enter")}
            </Button>
          </form>
        </div>

        {/* Cover Subtitle if provided */}
        {content.cover_subtitle && (
          <p className="font-body text-sm text-[var(--color-text-muted)] text-center mt-6 italic">
            {content.cover_subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default GuestLogin;
