import { useState, useEffect, type CSSProperties, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { RUSTY_LOGIN_CONFIG, RUSTY_THEME } from "../../lib/theme";
import { fetchPublicEvent } from "./rusty-layout";

const LANG_STORAGE_KEY = "guest-lang";

export default function RustyLogin() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { signIn, isAuthenticated, eventId: authEventId } = useGuestAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lang, setLang] = useState<"en" | "bm">("en");

  useEffect(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "en" || saved === "bm") setLang(saved);
  }, []);

  useEffect(() => {
    if (isAuthenticated && authEventId === eventId) {
      navigate(`/${eventId}`, { replace: true });
    }
  }, [isAuthenticated, authEventId, eventId, navigate]);

  const { data: event, isLoading, error } = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    queryFn: () => fetchPublicEvent(eventId!),
    enabled: !!eventId,
  });

  if (!eventId) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rusty-cream">
        <div className="w-12 h-12 rounded-full border-2 border-rusty-gold-dark border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rusty-cream px-6">
        <div className="text-center">
          <p className="font-serif text-2xl text-rusty-text mb-2">Invitation Not Found</p>
          <p className="text-sm text-rusty-text-light">The invitation you are looking for may no longer be available.</p>
        </div>
      </div>
    );
  }

  const config = event.login_config || RUSTY_LOGIN_CONFIG;
  const theme = event.theme || RUSTY_THEME;
  const bgColor = config.bgColor || theme.bgSubtleColor || RUSTY_LOGIN_CONFIG.bgColor!;
  const textColor = config.textColor || theme.textColor || "#3D3528";
  const buttonColor = config.buttonColor || theme.primaryColor || RUSTY_LOGIN_CONFIG.buttonColor!;
  const buttonText = config.buttonText || RUSTY_LOGIN_CONFIG.buttonText!;
  const heading = config.heading || (lang === "bm" ? "Selamat Datang" : "Welcome");
  const subheading = config.subheading || (lang === "bm" ? "Sila masukkan nama anda untuk meneruskan" : "Please enter your name to continue");
  const inputPlaceholder = config.inputPlaceholder || (lang === "bm" ? "Nama penuh anda" : "Your full name");
  const headingFont = theme.headingFont || "Cormorant Garamond";
  const scriptFont = theme.scriptFont || "Cormorant Garamond";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      signIn(name.trim(), eventId);
      localStorage.setItem(LANG_STORAGE_KEY, lang);
      navigate(`/${eventId}`, { replace: true });
    } catch {
      setSubmitting(false);
    }
  };

  const toggleLang = () => {
    const next = lang === "en" ? "bm" : "en";
    setLang(next);
    localStorage.setItem(LANG_STORAGE_KEY, next);
  };

  const cardStyle: CSSProperties = {
    backgroundColor: bgColor,
    color: textColor,
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-rusty-bg px-6 py-12">
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={toggleLang}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wide text-rusty-text-light hover:text-rusty-text transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          {lang === "en" ? "English" : "Bahasa Melayu"}
          <span className="text-rusty-gold-dark">·</span>
          <span className="text-rusty-gold-dark">{lang === "en" ? "BM" : "EN"}</span>
        </button>
      </div>

      <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-rusty-gold-dark/20 to-transparent" />
      <div className="absolute right-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-rusty-gold-dark/20 to-transparent" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <p className="font-serif text-xs tracking-[0.3em] uppercase text-rusty-gold-dark mb-2">
            {event.event_type}
          </p>
          <h1 className="font-serif text-2xl text-rusty-text">
            {event.name}
          </h1>
        </div>

        <div
          className="rounded-lg border border-rusty-border shadow-sm p-8"
          style={cardStyle}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="h-px w-10 bg-rusty-gold-dark/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-rusty-gold-dark" />
            <span className="h-px w-10 bg-rusty-gold-dark/40" />
          </div>

          <h2
            className="font-serif text-3xl text-center mb-2"
            style={{ color: textColor, fontFamily: `"${headingFont}", serif` }}
          >
            {heading}
          </h2>
          <p
            className="text-sm text-center mb-6 italic"
            style={{ color: textColor, opacity: 0.7, fontFamily: `"${scriptFont}", serif` }}
          >
            {subheading}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={inputPlaceholder}
              required
              autoFocus
              disabled={submitting}
              className="w-full px-4 py-3 text-sm rounded-md border border-rusty-border bg-white/80 focus:outline-none focus:ring-2 focus:ring-rusty-gold-dark/20 focus:border-rusty-gold-dark transition-colors"
              style={{ color: textColor }}
            />

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full py-3 text-sm tracking-[0.15em] uppercase font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: buttonColor,
                color: "#FAF3E0",
                borderRadius: "4px",
              }}
            >
              {submitting ? "..." : buttonText}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] tracking-[0.2em] uppercase text-rusty-text-light/60 mt-6">
          {event.name}
        </p>
      </div>
    </div>
  );
}
