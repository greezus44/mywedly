import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, ArrowRight, Globe } from "lucide-react";
import { supabase, type Wedding } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import { themeToCssVars, getTheme, coverToCssVars, getCoverConfig } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Input";

function GuestLoginInner() {
  const params = useParams();
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();
  const { signIn } = useGuestAuth();

  const slug = params.slug || "";
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wedding, setWedding] = useState<Wedding | null>(null);

  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    const { error: err } = await signIn(username, slug);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      navigate(`/w/${slug}/home`, { replace: true });
    }
  };

  const theme = getTheme(wedding);
  const cover = getCoverConfig(wedding);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover) } as CSSProperties}
    >
      {/* Language selector top-right */}
      <div className="fixed top-6 right-6 z-10">
        <button
          onClick={() => setLang(lang === "en" ? "ms" : "en")}
          className="flex items-center gap-2 px-4 py-2 font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors border border-[var(--color-border)]/30 rounded-lg"
          style={{ background: "var(--color-surface)" }}
        >
          <Globe size={14} />
          <span>{lang === "en" ? t("english") : t("bahasaMelayu")}</span>
        </button>
      </div>

      <div className="w-full max-w-md animate-fade-in-up opacity-0-init">
        {/* Heart icon */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 animate-scale-in opacity-0-init delay-200"
            style={{ background: "var(--color-primary)" + "12" }}
          >
            <Heart size={28} style={{ color: "var(--color-primary)" }} />
          </div>

          {/* Couple names */}
          <h1
            className="font-script text-3xl md:text-4xl mb-2"
            style={{ color: "var(--color-text)" }}
          >
            {wedding?.couple_name_one} <span style={{ color: "var(--color-primary)" }}>&</span> {wedding?.couple_name_two}
          </h1>

          {/* Sign in helper text */}
          <p
            className="font-ui text-xs uppercase tracking-wider-luxe mt-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("guestLogin")}
          </p>
          {wedding?.signin_helper && (
            <p
              className="font-body text-sm mt-2 italic"
              style={{ color: "var(--color-text-muted)" }}
            >
              {wedding.signin_helper}
            </p>
          )}
        </div>

        {/* Login form card */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-8 animate-fade-in-up opacity-0-init delay-300"
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius, 8px)",
            border: "1px solid var(--color-border)",
            borderColor: "color-mix(in srgb, var(--color-border) 20%, transparent)",
            boxShadow: "0 4px 24px rgba(184, 151, 58, 0.12)",
          }}
        >
          <div>
            <Label>{t("username")}</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              placeholder={t("username")}
              disabled={loading}
            />
          </div>

          {error && (
            <p
              className="font-ui text-sm animate-fade-in"
              style={{ color: "var(--color-error)" }}
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading || !username.trim()}
          >
            {loading ? t("loading") : t("enter")}
            {!loading && <ArrowRight size={16} className="ml-2" />}
          </Button>
        </form>

        {/* Decorative footer */}
        <div className="text-center mt-8 animate-fade-in opacity-0-init delay-500">
          <div
            className="inline-block w-12 h-px mb-3"
            style={{ background: "var(--color-primary)", opacity: 0.4 }}
          />
          <p
            className="font-ui text-[10px] uppercase tracking-luxe"
            style={{ color: "var(--color-text-muted)" }}
          >
            {wedding?.hashtag || `${wedding?.couple_name_one} & ${wedding?.couple_name_two}`}
          </p>
        </div>
      </div>
    </div>
  );
}

export function GuestLogin() {
  return (
    <GuestAuthProvider>
      <GuestLoginInner />
    </GuestAuthProvider>
  );
}

export default GuestLogin;
