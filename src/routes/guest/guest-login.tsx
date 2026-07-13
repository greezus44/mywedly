import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Globe, AlertCircle } from "lucide-react";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import { Input, Label } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";

function GuestLoginInner() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();
  const { signIn } = useGuestAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError(t("username")); return; }
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(username, slug);
    setSubmitting(false);
    if (signInError) { setError(signInError); return; }
    navigate(`/w/${slug}`, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12 bg-[var(--color-bg)]" style={{ "--color-bg": "#f5edda", "--color-primary": "#b8973a", "--color-border": "#b8973a", "--color-text": "#2a2a2a", "--color-text-muted": "#8a8a8a", "--color-surface": "#ffffff", "--font-script": '"Playfair Display", serif', "--font-heading": '"Cormorant Garamond", serif', "--font-ui": '"Jost", sans-serif', "--button-radius": "8px" } as React.CSSProperties}>
      <div className="w-full max-w-md">
        {/* Language selector */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 p-1 border border-[var(--color-border)]/30 rounded-lg" style={{ borderRadius: "var(--button-radius, 8px)" }}>
            <Globe size={14} className="text-[var(--color-primary)] ml-2.5" />
            {(["en", "ms"] as const).map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={cn(
                  "px-3 py-1.5 font-ui text-xs uppercase tracking-wider-luxe rounded-md transition-all",
                  lang === code
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                )}
              >
                {code === "en" ? "EN" : "MS"}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-xl shadow-[0_4px_24px_rgba(184,151,58,0.12)] px-8 py-10 animate-fade-in-up" style={{ borderRadius: "var(--button-radius, 8px)" }}>
          <div className="text-center mb-8">
            <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-primary)] mb-4">
              {t("guestLogin")}
            </p>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="font-script text-3xl text-[var(--color-text)]">You</span>
              <span className="font-script text-2xl text-[var(--color-primary)]">&</span>
              <span className="font-script text-3xl text-[var(--color-text)]">Yours</span>
            </div>
            <div className="flex items-center justify-center gap-2 my-6">
              <span className="h-px w-12 bg-[var(--color-border)]/40" />
              <span className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-primary)]">♡</span>
              <span className="h-px w-12 bg-[var(--color-border)]/40" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>{t("username")}</Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("username")}
                autoFocus
                className="text-center"
                style={{ borderRadius: "var(--button-radius, 8px)" }}
              />
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-[var(--color-error)] animate-fade-in">
                <AlertCircle size={14} />
                <span className="font-ui text-xs">{error}</span>
              </div>
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

        <p className="text-center font-ui text-xs text-[var(--color-text-muted)] mt-8 animate-fade-in delay-300">
          {t("invitation")}
        </p>
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
