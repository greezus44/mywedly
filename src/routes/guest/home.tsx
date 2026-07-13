import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getLogoConfig, getLogoStyle, shouldShowLogo } from "../../lib/theme";
import { getCountdown, formatDate, getDeviceType } from "../../lib/utils";
import { Heart } from "lucide-react";

export function Home() {
  const { slug } = useParams<{ slug: string }>();
  const { session } = useGuestAuth();
  const { lang } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    if (!slug) return;
    supabase.from("weddings").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (data) setWedding(data as Wedding);
    });
  }, [slug]);

  useEffect(() => {
    if (!wedding?.wedding_date) return;
    const tick = () => setCountdown(getCountdown(wedding.wedding_date));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [wedding?.wedding_date]);

  const theme = getTheme(wedding);
  const content = (wedding?.draft_content || wedding?.content || {}) as Record<string, unknown>;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showLogo = shouldShowLogo(logo, "home");

  // Minimalist luxury palette - monochromatic
  const monoStyles = {
    bg: "#FFFFFF",
    bgAlt: "#FAFAFA",
    text: "#1A1A1A",
    textMuted: "#8B8B8B",
    border: "#E5E5E5",
    accent: "#1A1A1A",
  };

  const subtitle = content.home_subtitle ? String(content.home_subtitle) : "";
  const homeBody = content.home_body ? String(content.home_body) : "";
  const quranVerse = content.quran_verse ? String(content.quran_verse) : "";
  const quranTranslation = content.quran_translation ? String(content.quran_translation) : "";
  const quranReference = content.quran_reference ? String(content.quran_reference) : "";
  const closingText = content.home_closing_text ? String(content.home_closing_text) : "";

  return (
    <div
      className="min-h-screen"
      style={{
        ...themeToCssVars(theme),
        background: monoStyles.bg,
        color: monoStyles.text,
        fontFamily: "var(--font-body)",
      } as React.CSSProperties}
    >
      {/* Logo */}
      {showLogo && logo.url && (
        <div className="flex justify-center pt-16 pb-8 animate-fade-in">
          <img src={logo.url} alt="logo" style={getLogoStyle(logo, device)} />
        </div>
      )}

      {/* Hero Section */}
      <section className="px-6 py-20 md:py-32 text-center">
        <div className="max-w-2xl mx-auto">
          {/* Small label */}
          <p
            className="text-xs tracking-[0.3em] uppercase mb-8 animate-fade-in-up"
            style={{ color: monoStyles.textMuted, animationDelay: "0s" }}
          >
            {lang === "en" ? "The Wedding Of" : "Perkahwinan"}
          </p>

          {/* Couple Names - Large Serif */}
          <h1
            className="font-heading leading-[1.1] animate-fade-in-up"
            style={{
              fontSize: "clamp(2.5rem, 8vw, 5rem)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: monoStyles.text,
              animationDelay: "0.1s",
            }}
          >
            {wedding?.couple_name_one || "Name"}
          </h1>

          <p
            className="font-script text-3xl md:text-4xl my-4 animate-fade-in-up"
            style={{ color: monoStyles.textMuted, animationDelay: "0.2s" }}
          >
            &
          </p>

          <h1
            className="font-heading leading-[1.1] animate-fade-in-up"
            style={{
              fontSize: "clamp(2.5rem, 8vw, 5rem)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: monoStyles.text,
              animationDelay: "0.3s",
            }}
          >
            {wedding?.couple_name_two || "Name"}
          </h1>

          {/* Divider */}
          <div className="flex items-center justify-center my-10 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="h-px w-12" style={{ background: monoStyles.border }} />
            <div className="mx-3">
              <Heart className="w-3 h-3" style={{ color: monoStyles.textMuted }} />
            </div>
            <div className="h-px w-12" style={{ background: monoStyles.border }} />
          </div>

          {/* Date */}
          {wedding?.wedding_date && (
            <p
              className="text-sm tracking-[0.2em] uppercase animate-fade-in-up"
              style={{ color: monoStyles.textMuted, animationDelay: "0.5s" }}
            >
              {formatDate(wedding.wedding_date, lang)}
            </p>
          )}

          {subtitle && (
            <p
              className="mt-4 text-sm tracking-wider animate-fade-in-up"
              style={{ color: monoStyles.textMuted, animationDelay: "0.55s" }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Welcome Body */}
      {homeBody && (
        <section className="px-6 py-16 md:py-20 text-center" style={{ background: monoStyles.bgAlt }}>
          <div className="max-w-xl mx-auto">
            <p
              className="font-body text-base md:text-lg leading-relaxed animate-fade-in-up"
              style={{ color: monoStyles.text, animationDelay: "0.1s" }}
            >
              {homeBody}
            </p>
          </div>
        </section>
      )}

      {/* Quran Verse */}
      {quranVerse && (
        <section className="px-6 py-20 md:py-28 text-center">
          <div className="max-w-lg mx-auto">
            <p
              className="font-heading text-xl md:text-2xl italic leading-relaxed animate-fade-in-up"
              style={{ color: monoStyles.text, animationDelay: "0.1s" }}
            >
              "{quranVerse}"
            </p>
            {quranTranslation && (
              <p
                className="mt-6 text-sm leading-relaxed animate-fade-in-up"
                style={{ color: monoStyles.textMuted, animationDelay: "0.2s" }}
              >
                {quranTranslation}
              </p>
            )}
            {quranReference && (
              <p
                className="mt-4 text-xs tracking-[0.2em] uppercase animate-fade-in-up"
                style={{ color: monoStyles.textMuted, animationDelay: "0.3s" }}
              >
                — {quranReference}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Countdown */}
      {!countdown.isPast && wedding?.wedding_date && (
        <section className="px-6 py-20 md:py-24 text-center" style={{ background: monoStyles.bgAlt }}>
          <div className="max-w-2xl mx-auto">
            <p
              className="text-xs tracking-[0.3em] uppercase mb-10 animate-fade-in-up"
              style={{ color: monoStyles.textMuted }}
            >
              {lang === "en" ? "Counting Down" : "Kiraan Mundur"}
            </p>
            <div className="flex justify-center gap-8 md:gap-16">
              {(["days", "hours", "minutes", "seconds"] as const).map((k, i) => (
                <div key={k} className="text-center animate-fade-in-up" style={{ animationDelay: `${0.1 * (i + 1)}s` }}>
                  <div
                    className="font-heading text-4xl md:text-6xl"
                    style={{ color: monoStyles.text, fontWeight: 300 }}
                  >
                    {String(countdown[k]).padStart(2, "0")}
                  </div>
                  <div
                    className="text-xs tracking-[0.2em] uppercase mt-2"
                    style={{ color: monoStyles.textMuted }}
                  >
                    {k}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Closing Dua */}
      {closingText && (
        <section className="px-6 py-20 md:py-28 text-center">
          <div className="max-w-md mx-auto">
            <p
              className="font-heading text-lg md:text-xl italic leading-relaxed animate-fade-in-up"
              style={{ color: monoStyles.textMuted }}
            >
              {closingText}
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="px-6 py-12 text-center border-t" style={{ borderColor: monoStyles.border }}>
        <p
          className="text-xs tracking-[0.2em] uppercase"
          style={{ color: monoStyles.textMuted }}
        >
          {wedding ? `${wedding.couple_name_one} & ${wedding.couple_name_two}` : ""}
        </p>
      </footer>
    </div>
  );
}

export default Home;
