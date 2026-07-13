import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
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
  useGuestAuth(); // ensure auth context
  const { lang, t } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("weddings")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
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
  const content = (wedding?.content || {}) as WeddingContent;
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();
  const showLogo = shouldShowLogo(logo, "home") && logo.url;

  const coupleOne = wedding?.couple_name_one || "";
  const coupleTwo = wedding?.couple_name_two || "";
  const weddingDate = wedding?.wedding_date || null;

  return (
    <div
      className="min-h-screen"
      style={{
        ...themeToCssVars(theme),
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
      } as React.CSSProperties}
    >
      {/* Hero section */}
      <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-20 md:py-32">
        {/* Logo */}
        {showLogo && (
          <div className="mb-12 animate-fade-in" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <img src={logo.url!} alt="logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        {/* Small label */}
        <p
          className="mb-6 animate-fade-in-up text-xs uppercase tracking-[0.3em] text-gray-400"
          style={{ animationDelay: "0.2s", opacity: 0 }}
        >
          {lang === "ms" ? "Jemputan Perkahwinan" : "Wedding Invitation"}
        </p>

        {/* Couple names — large serif */}
        <div className="text-center">
          {content.home_title ? (
            <h1
              className="animate-fade-in-up font-heading text-4xl font-light leading-tight md:text-6xl lg:text-7xl"
              style={{
                animationDelay: "0.3s",
                opacity: 0,
                color: "var(--color-text)",
                fontFamily: "var(--font-heading)",
                letterSpacing: "0.02em",
              }}
            >
              {content.home_title}
            </h1>
          ) : (
            <>
              <h1
                className="animate-fade-in-up font-heading text-4xl font-light leading-tight md:text-6xl lg:text-7xl"
                style={{
                  animationDelay: "0.3s",
                  opacity: 0,
                  color: "var(--color-text)",
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "0.02em",
                }}
              >
                {coupleOne}
              </h1>

              <p
                className="my-3 animate-fade-in-up font-script text-2xl text-gray-400 md:text-3xl"
                style={{ animationDelay: "0.4s", opacity: 0 }}
              >
                &
              </p>

              <h1
                className="animate-fade-in-up font-heading text-4xl font-light leading-tight md:text-6xl lg:text-7xl"
                style={{
                  animationDelay: "0.5s",
                  opacity: 0,
                  color: "var(--color-text)",
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "0.02em",
                }}
              >
                {coupleTwo}
              </h1>
            </>
          )}
        </div>

        {/* Date */}
        {weddingDate && (
          <div
            className="mt-10 flex animate-fade-in-up items-center gap-3"
            style={{ animationDelay: "0.6s", opacity: 0 }}
          >
            <div className="h-px w-12 bg-gray-300" />
            <p className="font-body text-sm tracking-widest text-gray-500 uppercase">
              {formatDate(weddingDate, lang)}
            </p>
            <div className="h-px w-12 bg-gray-300" />
          </div>
        )}

        {/* Subtitle */}
        {content.home_subtitle && (
          <p
            className="mt-6 max-w-md animate-fade-in-up text-center font-body text-sm text-gray-500 md:text-base"
            style={{ animationDelay: "0.7s", opacity: 0 }}
          >
            {content.home_subtitle}
          </p>
        )}
      </section>

      {/* Welcome body */}
      {content.home_body && (
        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-2xl">
            <p
              className="animate-fade-in-up text-center font-body text-base leading-relaxed text-gray-600 md:text-lg"
              style={{ animationDelay: "0.2s", opacity: 0 }}
            >
              {content.home_body}
            </p>
          </div>
        </section>
      )}

      {/* Quran verse */}
      {(content.quran_verse || content.quran_translation) && (
        <section className="px-6 py-16 md:py-24">
          <div
            className="mx-auto max-w-2xl animate-fade-in-up border-l border-r px-6 py-10 md:px-12 md:py-14"
            style={{ animationDelay: "0.2s", opacity: 0, borderColor: "var(--color-border)" }}
          >
            {content.quran_verse && (
              <p className="text-center font-heading text-lg italic leading-relaxed text-gray-700 md:text-xl">
                {content.quran_verse}
              </p>
            )}
            {content.quran_translation && (
              <p className="mt-4 text-center font-body text-sm leading-relaxed text-gray-500">
                {content.quran_translation}
              </p>
            )}
            {content.quran_reference && (
              <p className="mt-4 text-center font-body text-xs uppercase tracking-widest text-gray-400">
                — {content.quran_reference}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Countdown */}
      {!countdown.isPast && weddingDate && (
        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-2xl">
            <p
              className="mb-10 text-center font-body text-xs uppercase tracking-[0.3em] text-gray-400 animate-fade-in-up"
              style={{ animationDelay: "0.1s", opacity: 0 }}
            >
              {lang === "ms" ? "Menghitung Hari" : "Counting Down"}
            </p>
            <div className="flex justify-center gap-8 md:gap-16">
              {(["days", "hours", "minutes", "seconds"] as const).map((k, i) => (
                <div
                  key={k}
                  className="animate-fade-in-up text-center"
                  style={{ animationDelay: `${0.2 + i * 0.1}s`, opacity: 0 }}
                >
                  <div className="font-heading text-3xl font-light text-gray-800 md:text-5xl">
                    {countdown[k]}
                  </div>
                  <div className="mt-2 font-body text-[0.6rem] uppercase tracking-[0.2em] text-gray-400 md:text-xs">
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
        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-xl">
            <p
              className="animate-fade-in-up text-center font-script text-xl text-gray-500 md:text-2xl"
              style={{ animationDelay: "0.2s", opacity: 0 }}
            >
              {content.home_closing_text}
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <Heart className="mx-auto mb-4 h-5 w-5 text-gray-300" />
          <p className="font-body text-xs uppercase tracking-[0.2em] text-gray-400">
            {coupleOne} & {coupleTwo}
          </p>
          <p className="mt-2 font-body text-xs text-gray-300">
            {lang === "ms" ? "Terima kasih atas doa dan kehadiran anda" : "Thank you for your prayers and presence"}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
