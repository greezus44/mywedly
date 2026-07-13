import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import {
  themeToCssVars,
  getTheme,
  getLogoConfig,
  getLogoStyle,
  shouldShowLogo,
} from "../../lib/theme";
import { getCountdown, formatDate, getDeviceType } from "../../lib/utils";
import { Heart } from "lucide-react";

export function Home() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLang();
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
  const content = (wedding?.draft_content || wedding?.content || {}) as WeddingContent;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showLogo = shouldShowLogo(logo, "home");

  const coupleOne = wedding?.couple_name_one || "";
  const coupleTwo = wedding?.couple_name_two || "";
  const weddingDate = wedding?.wedding_date || null;
  const countdownKeys = ["days", "hours", "minutes", "seconds"] as const;

  return (
    <div
      className="min-h-screen"
      style={{ ...themeToCssVars(theme), background: "#FFFFFF", color: "#1A1A1A", fontFamily: "var(--font-body)" } as React.CSSProperties}
    >
      {/* Logo */}
      {showLogo && logo.url && (
        <div className="flex justify-center pt-12 md:pt-16">
          <img src={logo.url} alt="logo" style={getLogoStyle(logo, device)} />
        </div>
      )}

      {/* Hero section */}
      <section className="flex flex-col items-center px-6 py-16 md:py-24 lg:py-32">
        {/* Small label */}
        <p
          className="animate-fade-in-up text-[0.625rem] uppercase tracking-[0.4em] text-neutral-400 md:text-xs"
          style={{ animationDelay: "0s" }}
        >
          {lang === "ms" ? "Jemputan Kahwin" : "Wedding Invitation"}
        </p>

        {/* Divider */}
        <div className="my-6 h-px w-12 animate-fade-in bg-neutral-300" style={{ animationDelay: "0.1s" }} />

        {/* Couple names */}
        <div className="text-center">
          <h1
            className="animate-fade-in-up font-heading text-4xl font-light leading-tight text-neutral-900 md:text-6xl lg:text-7xl"
            style={{ animationDelay: "0.2s" }}
          >
            {content.home_title || coupleOne}
          </h1>

          {coupleOne && coupleTwo && (
            <p
              className="my-3 animate-fade-in-up font-script text-2xl text-neutral-400 md:text-3xl"
              style={{ animationDelay: "0.3s" }}
            >
              &
            </p>
          )}

          <h1
            className="animate-fade-in-up font-heading text-4xl font-light leading-tight text-neutral-900 md:text-6xl lg:text-7xl"
            style={{ animationDelay: "0.4s" }}
          >
            {content.home_subtitle || coupleTwo}
          </h1>
        </div>

        {/* Date */}
        {weddingDate && (
          <div className="mt-10 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-neutral-300" />
              <p className="font-body text-sm tracking-widest text-neutral-500 md:text-base">
                {formatDate(weddingDate, lang)}
              </p>
              <div className="h-px w-8 bg-neutral-300" />
            </div>
          </div>
        )}
      </section>

      {/* Welcome text */}
      {content.home_body && (
        <section className="flex justify-center px-6 pb-16 md:pb-20">
          <div className="max-w-xl animate-fade-in-up text-center" style={{ animationDelay: "0.1s" }}>
            <p className="font-body text-base font-light leading-relaxed text-neutral-600 md:text-lg">
              {content.home_body}
            </p>
          </div>
        </section>
      )}

      {/* Quran verse */}
      {(content.quran_verse || content.quran_translation) && (
        <section className="flex justify-center px-6 py-16 md:py-24">
          <div className="max-w-lg animate-fade-in-up text-center" style={{ animationDelay: "0.1s" }}>
            {/* Ornamental divider */}
            <div className="mb-8 flex items-center justify-center gap-3">
              <div className="h-px w-6 bg-neutral-300" />
              <Heart className="h-3 w-3 text-neutral-300" />
              <div className="h-px w-6 bg-neutral-300" />
            </div>

            {content.quran_verse && (
              <p className="font-heading text-xl font-light leading-relaxed text-neutral-800 md:text-2xl">
                {content.quran_verse}
              </p>
            )}

            {content.quran_translation && (
              <p className="mt-6 font-body text-sm font-light leading-relaxed text-neutral-500 md:text-base">
                {content.quran_translation}
              </p>
            )}

            {content.quran_reference && (
              <p className="mt-4 font-body text-xs uppercase tracking-widest text-neutral-400">
                — {content.quran_reference}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Countdown */}
      {!countdown.isPast && weddingDate && (
        <section className="flex justify-center px-6 py-16 md:py-24">
          <div className="animate-fade-in-up text-center" style={{ animationDelay: "0.1s" }}>
            <p className="mb-8 text-[0.625rem] uppercase tracking-[0.4em] text-neutral-400 md:text-xs">
              {lang === "ms" ? "Menghitung Hari" : "Counting Down"}
            </p>
            <div className="flex justify-center gap-8 md:gap-16">
              {countdownKeys.map((k) => (
                <div key={k} className="text-center">
                  <div className="font-heading text-3xl font-light text-neutral-900 md:text-5xl lg:text-6xl">
                    {String(countdown[k]).padStart(2, "0")}
                  </div>
                  <div className="mt-2 text-[0.625rem] uppercase tracking-widest text-neutral-400 md:text-xs">
                    {t[k]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Closing dua */}
      {content.home_closing_text && (
        <section className="flex justify-center px-6 pb-20 pt-8 md:pb-32">
          <div className="max-w-lg animate-fade-in-up text-center" style={{ animationDelay: "0.1s" }}>
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="h-px w-6 bg-neutral-300" />
              <Heart className="h-3 w-3 text-neutral-300" />
              <div className="h-px w-6 bg-neutral-300" />
            </div>
            <p className="font-body text-sm font-light italic leading-relaxed text-neutral-500 md:text-base">
              {content.home_closing_text}
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-8">
        <p className="text-center text-[0.625rem] uppercase tracking-[0.3em] text-neutral-300">
          {coupleOne} & {coupleTwo}
        </p>
      </footer>
    </div>
  );
}

export default Home;
