import { useState, useEffect } from "react";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToCssVars, getTheme, getCoverContent } from "../../lib/theme";
import { getCountdown, formatDate } from "../../lib/utils";

export function Home() {
  const { lang, t } = useLang();
  const { session } = useGuestAuth();
  const wedding = session?.wedding;
  const [countdown, setCountdown] = useState(getCountdown(wedding?.wedding_date ?? null));

  useEffect(() => {
    if (!wedding?.wedding_date) return;
    const id = setInterval(() => setCountdown(getCountdown(wedding.wedding_date)), 1000);
    return () => clearInterval(id);
  }, [wedding?.wedding_date]);

  if (!wedding) return null;

  const theme = getTheme(wedding);
  const content = getCoverContent(wedding);
  const intro = content.invitation_intro || content.home_body || "";
  const quranVerse = content.invitation_quran_verse || "";
  const quranTranslation = content.invitation_quran_translation || "";
  const quranReference = content.invitation_quran_reference || "";
  const closing = content.invitation_closing || content.home_closing_text || "";
  const homeTitle = content.home_title || "";
  const homeSubtitle = content.home_subtitle || "";

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]" style={themeToCssVars(theme) as React.CSSProperties}>
      <div className="max-w-2xl mx-auto px-6 py-20 md:py-28 flex flex-col items-center text-center">
        {/* Bismillah */}
        <p className="font-script text-xl text-[var(--color-primary)] mb-10 opacity-0-init animate-fade-in">
          {t("bismillah")}
        </p>

        {/* Welcome */}
        <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-primary)] mb-6 opacity-0-init animate-fade-in-up delay-100">
          {t("welcome")}
        </p>

        {/* Couple names */}
        <div className="mb-8 opacity-0-init animate-fade-in-up delay-200">
          <h1 className="font-script text-5xl md:text-6xl text-[var(--color-text)] leading-tight">
            {wedding.couple_name_one}
          </h1>
          <p className="font-script text-2xl text-[var(--color-primary)] my-2">&</p>
          <h1 className="font-script text-5xl md:text-6xl text-[var(--color-text)] leading-tight">
            {wedding.couple_name_two}
          </h1>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-2 mb-8 opacity-0-init animate-fade-in delay-300">
          <span className="h-px w-16 bg-[var(--color-border)]/40" />
          <span className="font-ui text-[10px] uppercase tracking-luxe text-[var(--color-primary)]">♡</span>
          <span className="h-px w-16 bg-[var(--color-border)]/40" />
        </div>

        {/* Date */}
        {wedding.wedding_date && (
          <p className="font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-12 opacity-0-init animate-fade-in-up delay-300">
            {formatDate(wedding.wedding_date, lang)}
          </p>
        )}

        {/* Home title */}
        {homeTitle && (
          <h2 className="font-heading text-2xl md:text-3xl text-[var(--color-text)] mb-4 opacity-0-init animate-fade-in-up delay-400">
            {homeTitle}
          </h2>
        )}

        {/* Home subtitle */}
        {homeSubtitle && (
          <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-primary)] mb-6 opacity-0-init animate-fade-in-up delay-400">
            {homeSubtitle}
          </p>
        )}

        {/* Invitation intro */}
        {intro && (
          <p className="font-body text-lg md:text-xl leading-relaxed text-[var(--color-text)] mb-12 max-w-xl opacity-0-init animate-fade-in-up delay-500">
            {intro}
          </p>
        )}

        {/* Quran verse */}
        {quranVerse && (
          <div className="my-12 max-w-lg opacity-0-init animate-fade-in-up delay-500">
            <div className="border-t border-b border-[var(--color-border)]/20 py-8">
              <p className="font-script text-2xl md:text-3xl text-[var(--color-primary)] leading-relaxed mb-4" dir="rtl">
                {quranVerse}
              </p>
              {quranTranslation && (
                <p className="font-body text-base italic text-[var(--color-text-muted)] leading-relaxed mb-2">
                  "{quranTranslation}"
                </p>
              )}
              {quranReference && (
                <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-primary)] mt-3">
                  — {quranReference}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Countdown */}
        {wedding.wedding_date && !countdown.isPast && (
          <div className="my-12 opacity-0-init animate-fade-in-up delay-700">
            <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-primary)] mb-6">
              {content.countdown_label || t("days")}
            </p>
            <div className="flex gap-6 md:gap-10">
              {[
                { value: countdown.days, label: t("days") },
                { value: countdown.hours, label: t("hours") },
                { value: countdown.minutes, label: t("minutes") },
                { value: countdown.seconds, label: t("seconds") },
              ].map((unit) => (
                <div key={unit.label} className="flex flex-col items-center">
                  <span className="font-script text-3xl md:text-4xl text-[var(--color-text)] tabular-nums">
                    {String(unit.value).padStart(2, "0")}
                  </span>
                  <span className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)] mt-1">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Closing dua */}
        {closing && (
          <p className="font-body text-lg text-[var(--color-text)] leading-relaxed mt-12 max-w-lg opacity-0-init animate-fade-in-up delay-1000">
            {closing}
          </p>
        )}
      </div>
    </div>
  );
}

export default Home;
