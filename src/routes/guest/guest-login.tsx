import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Globe } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, coverToCssVars, getTheme, getCoverConfig } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Input";

export function GuestLogin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, signIn } = useGuestAuth();
  const { lang, setLang, t } = useLang();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) navigate(`/w/${slug}/home`, { replace: true });
  }, [session, slug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError("Please enter your username"); return; }
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(username, slug || "");
    if (signInError) { setError(signInError); setSubmitting(false); }
    else { navigate(`/w/${slug}/home`, { replace: true }); }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{
        ...themeToCssVars(getTheme(null)),
        ...coverToCssVars(getCoverConfig(null)),
        background: "#1a1a1a",
      } as React.CSSProperties}
    >
      <div className="w-full max-w-md">
        {/* Language selector */}
        <div className="flex justify-center gap-2 mb-8">
          {(["en", "ms"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex items-center gap-1.5 px-4 py-1.5 font-ui text-xs uppercase tracking-wider-luxe rounded-lg transition-all ${
                lang === l ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              <Globe size={12} />
              {l === "en" ? "EN" : "MS"}
            </button>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-10 animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="font-script text-3xl text-white mb-2">{t("guestLogin")}</h1>
            <p className="font-ui text-xs uppercase tracking-wider-luxe text-white/50">
              {t("welcome")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-white/70">{t("username")}</Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("username")}
                autoFocus
                className="bg-white/5 border-white/15 text-white placeholder:text-white/30"
              />
            </div>

            {error && (
              <p className="font-ui text-xs text-red-300 text-center">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? t("loading") : t("enter")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default GuestLogin;
