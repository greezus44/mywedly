import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, LoginConfig } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { RUSTY_LOGIN_CONFIG } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Loader2 } from "lucide-react";
import type { CSSProperties, FormEvent } from "react";

function normalizeEvent(data: any): UserEvent {
  return {
    ...data,
    cover_config: data.cover_config || {},
    login_config: data.login_config || {},
    theme: data.theme || {},
    logo_config: data.logo_config || {},
    content: data.content || {},
    sharing_config: data.sharing_config || {},
    draft_cover_config: data.draft_cover_config || data.cover_config || {},
    draft_login_config: data.draft_login_config || data.login_config || {},
    draft_theme: data.draft_theme || data.theme || {},
    draft_logo_config: data.draft_logo_config || data.logo_config || {},
    draft_content: data.draft_content || data.content || {},
    draft_sharing_config: data.draft_sharing_config || data.sharing_config || {},
  };
}

export default function RustyLogin() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useGuestAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "bm">("en");

  const { data: event, isLoading, error } = useQuery<UserEvent | null>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeEvent(data) : null;
    },
    staleTime: 30000,
  });

  if (auth.token && eventId && auth.eventId === eventId) {
    return <NavigateToHome eventId={eventId} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5ECD7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#B8962E]" />
      </div>
    );
  }

  if (error || !event || !eventId) {
    return (
      <div className="min-h-screen bg-[#F5ECD7] flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-sm text-[#8B7355]">This invitation is no longer available.</p>
      </div>
    );
  }

  const config: LoginConfig = { ...RUSTY_LOGIN_CONFIG, ...event.login_config };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setErr(null);
    try {
      await auth.signIn(name.trim(), eventId);
      queryClient.invalidateQueries({ queryKey: ["public-event", eventId] });
      navigate(`/${eventId}/home`);
    } catch (err) {
      setErr("Unable to sign in. Please try again.");
      setSubmitting(false);
    }
  };

  const bgStyle: CSSProperties = config.bgImage
    ? { backgroundImage: `url(${config.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: config.bgColor };

  const labels = {
    en: { title: config.title, subtitle: config.subtitle, welcome: config.welcomeMessage, placeholder: config.inputPlaceholder, button: config.buttonText },
    bm: {
      title: "Selamat Datang",
      subtitle: "Sila masukkan nama anda untuk meneruskan",
      welcome: "Kami gembira anda menyertai kami",
      placeholder: "Masukkan nama penuh anda",
      button: "Teruskan",
    },
  };
  const L = labels[lang];

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ ...bgStyle, color: config.textColor }}
    >
      {config.bgImage && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "#000", opacity: config.overlayOpacity }}
        />
      )}

      <div className="absolute top-5 right-5 z-20">
        <div className="flex items-center gap-1 rounded-full border border-[#C4A44A]/40 bg-[#FAF3E0]/80 backdrop-blur-sm p-0.5">
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1 text-[11px] tracking-wide rounded-full transition-colors ${
              lang === "en" ? "bg-[#B8962E] text-white" : "text-[#8B7355]"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang("bm")}
            className={`px-3 py-1 text-[11px] tracking-wide rounded-full transition-colors ${
              lang === "bm" ? "bg-[#B8962E] text-white" : "text-[#8B7355]"
            }`}
          >
            BM
          </button>
        </div>
      </div>

      <div
        className="relative z-10 w-full max-w-sm p-8 sm:p-10 rounded-lg border"
        style={{
          backgroundColor: config.cardBgColor,
          borderColor: config.borderColor,
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="h-px w-8 bg-[#C4A44A]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
          <span className="h-px w-8 bg-[#C4A44A]" />
        </div>

        <div className="text-center mb-6">
          <h2
            className="font-medium"
            style={{
              fontFamily: config.headingFont,
              fontSize: config.headingFontSize,
              fontWeight: config.headingWeight,
              color: config.textColor,
            }}
          >
            {L.title}
          </h2>
          <p className="text-sm mt-2 text-[#8B7355]">{L.subtitle}</p>
        </div>

        <p className="text-sm text-center text-[#8B7355] mb-6 italic" style={{ fontFamily: config.headingFont }}>
          {L.welcome}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={L.placeholder}
            autoFocus
            className="w-full px-4 py-3 rounded-lg text-sm transition-colors focus:outline-none"
            style={{
              backgroundColor: config.inputBgColor,
              color: config.textColor,
              border: `1px solid ${config.borderColor}`,
              borderRadius: "8px",
            }}
          />

          {err && <p className="text-xs text-red-600 text-center">{err}</p>}

          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="w-full py-3 text-sm tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: config.buttonColor,
              color: "#FFFFFF",
              borderRadius: "8px",
            }}
          >
            {submitting ? "Please wait..." : L.button}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="h-px w-8 bg-[#C4A44A]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
          <span className="h-px w-8 bg-[#C4A44A]" />
        </div>
      </div>
    </div>
  );
}

function NavigateToHome({ eventId }: { eventId: string }) {
  const navigate = useNavigate();
  setTimeout(() => navigate(`/${eventId}/home`), 0);
  return null;
}
