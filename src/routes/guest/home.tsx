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
import { getCountdown, formatDate, getDeviceType } from "../../lib/utils";
import { Heart, Calendar, Clock, MapPin } from "lucide-react";

function HomeInner() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, loading } = useGuestAuth();
  const { lang, t } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

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

  useEffect(() => {
    if (!wedding?.wedding_date) return;
    const update = () => setCountdown(getCountdown(wedding.wedding_date));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [wedding?.wedding_date]);

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

  return (
    <div
      className="min-h-screen"
      style={{ ...themeToCssVars(theme) } as React.CSSProperties}
    >
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Logo */}
        {shouldShowLogo(logo, "home") && logo.url && (
          <div className="mb-8 flex justify-center animate-fade-in">
            <img src={logo.url} alt="Logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        {/* Welcome */}
        <div className="text-center animate-fade-in-up">
          <p
            className="mb-2 text-sm uppercase tracking-widest"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
          >
            {t.welcome}
          </p>
          <h2
            className="mb-1"
            style={{
              color: "var(--color-text)",
              fontFamily: "var(--font-script)",
              fontSize: "2.5rem",
              lineHeight: 1.2,
            }}
          >
            {wedding?.couple_name_one}
          </h2>
          <div className="my-2 flex items-center justify-center gap-3">
            <span className="h-px w-10" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
            <Heart className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
            <span className="h-px w-10" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
          </div>
          <h2
            className="mb-6"
            style={{
              color: "var(--color-text)",
              fontFamily: "var(--font-script)",
              fontSize: "2.5rem",
              lineHeight: 1.2,
            }}
          >
            {wedding?.couple_name_two}
          </h2>
        </div>

        {/* Date & Location */}
        {wedding?.wedding_date && (
          <div className="mb-8 flex flex-col items-center gap-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-2" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}>
              <Calendar className="h-4 w-4" />
              <span>{formatDate(wedding.wedding_date, lang)}</span>
            </div>
            {wedding?.location && (
              <div className="flex items-center gap-2" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}>
                <MapPin className="h-4 w-4" />
                <span>{wedding.location}</span>
              </div>
            )}
          </div>
        )}

        {/* Welcome body text */}
        {typeof content.home_body === "string" && content.home_body && (
          <p
            className="mb-8 text-center leading-relaxed animate-fade-in-up"
            style={{
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--font-body-size)",
              animationDelay: "0.2s",
            }}
          >
            {content.home_body}
          </p>
        )}

        {/* Quran verse */}
        {typeof content.quran_verse === "string" && content.quran_verse && (
          <div
            className="mb-8 rounded-2xl p-6 text-center animate-fade-in-up"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              animationDelay: "0.3s",
            }}
          >
            <p
              className="mb-3 leading-loose"
              style={{
                color: "var(--color-text)",
                fontFamily: "var(--font-heading)",
                fontSize: "1.25rem",
                direction: "rtl",
              }}
            >
              {content.quran_verse}
            </p>
            {typeof content.quran_translation === "string" && content.quran_translation && (
              <p
                className="mb-2 italic leading-relaxed"
                style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
              >
                {content.quran_translation}
              </p>
            )}
            {typeof content.quran_reference === "string" && content.quran_reference && (
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-primary)", fontFamily: "var(--font-body)" }}
              >
                — {content.quran_reference}
              </p>
            )}
          </div>
        )}

        {/* Countdown */}
        {!countdown.isPast && wedding?.wedding_date && (
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <p
              className="mb-3 text-center text-sm uppercase tracking-widest"
              style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
            >
              {lang === "ms" ? "Menghitung Hari" : "Counting Down"}
            </p>
            <div className="flex justify-center gap-3">
              {[
                { label: t.days, value: countdown.days },
                { label: t.hours, value: countdown.hours },
                { label: t.minutes, value: countdown.minutes },
                { label: t.seconds, value: countdown.seconds },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex min-w-[60px] flex-col items-center rounded-xl px-3 py-3"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <span
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
                  >
                    {String(item.value).padStart(2, "0")}
                  </span>
                  <span
                    className="text-[0.625rem] uppercase tracking-wider"
                    style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Closing dua */}
        {typeof content.home_closing_text === "string" && content.home_closing_text && (
          <p
            className="text-center italic leading-relaxed animate-fade-in-up"
            style={{
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-body)",
              animationDelay: "0.5s",
            }}
          >
            {content.home_closing_text}
          </p>
        )}
      </div>
    </div>
  );
}

export function Home() {
  return (
    <GuestAuthProvider>
      <HomeInner />
    </GuestAuthProvider>
  );
}

export default Home;
