import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, ArrowRight, Globe } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Input";

export function GuestLogin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn } = useGuestAuth();
  const { lang, setLang, t } = useLang();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !username.trim()) return;
    setLoading(true);
    setError(null);
    const { error: signInError } = await signIn(username, slug);
    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else {
      navigate(`/w/${slug}/home`, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#f5edda]">
      <div className="w-full max-w-md">
        {/* Language selector */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Globe size={16} className="text-[#8a8a8a]" />
          <button
            onClick={() => setLang("en")}
            className={`font-ui text-xs uppercase tracking-wider-luxe px-3 py-1 rounded transition-colors ${lang === "en" ? "text-[#b8973a] font-semibold" : "text-[#8a8a8a] hover:text-[#2a2a2a]"}`}
          >
            EN
          </button>
          <span className="text-[#8a8a8a] text-xs">|</span>
          <button
            onClick={() => setLang("ms")}
            className={`font-ui text-xs uppercase tracking-wider-luxe px-3 py-1 rounded transition-colors ${lang === "ms" ? "text-[#b8973a] font-semibold" : "text-[#8a8a8a] hover:text-[#2a2a2a]"}`}
          >
            MS
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#b8973a]/10 rounded-full mb-4">
            <Heart size={28} className="text-[#b8973a]" />
          </div>
          <h1 className="font-script text-3xl text-[#2a2a2a] mb-2">{t("guestLogin")}</h1>
          <p className="font-ui text-sm text-[#8a8a8a] uppercase tracking-wider-luxe">
            {t("invitation")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border border-[#b8973a]/15 shadow-sm p-6 space-y-5"
          style={{ borderRadius: "8px" }}
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
              className="w-full px-5 py-3.5"
              style={{ borderRadius: "8px" }}
            />
          </div>

          {error && (
            <p className="font-ui text-sm text-[#c97070] text-center">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
            style={{ borderRadius: "8px" }}
          >
            {loading ? t("loading") : t("enter")}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default GuestLogin;
