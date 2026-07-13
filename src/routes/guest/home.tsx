import { useState, useEffect } from "react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getCoverContent } from "../../lib/theme";
import { getCountdown, formatDate } from "../../lib/utils";

export function Home() {
  const { session } = useGuestAuth();
  const { lang } = useLang();
  const [countdown, setCountdown] = useState(getCountdown(null));

  useEffect(() => {
    if (!session?.wedding.wedding_date) return;
    setCountdown(getCountdown(session.wedding.wedding_date));
    const interval = setInterval(() => {
      setCountdown(getCountdown(session.wedding.wedding_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;

  const { wedding } = session;
  const content = getCoverContent(wedding);
  const theme = wedding.theme_config && "colors" in wedding.theme_config ? wedding.theme_config : null;

  return (
    <div
      style={themeToCssVars(theme) as React.CSSProperties}
      className="min-h-full bg-[var(--color-bg)] py-16 md:py-24 px-6"
    >
      <div className="max-w-2xl mx-auto text-center">
        {/* Invitation Intro */}
        {content.invitation_intro && (
          <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-primary)] mb-6 animate-fade-in opacity-0-init">
            {content.invitation_intro}
          </p>
        )}

        {/* Welcome Text */}
        {content.home_title && (
          <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-4 animate-fade-in opacity-0-init delay-100">
            {content.home_title}
          </p>
        )}

        {/* Couple Names */}
        <h1 className="font-script text-4xl md:text-5xl text-[var(--color-primary)] mb-2 animate-fade-in-up opacity-0-init delay-100">
          {wedding.couple_name_one}
        </h1>
        <p className="font-script text-2xl text-[var(--color-primary)]/50 mb-2 animate-fade-in-up opacity-0-init delay-200">
          &
        </p>
        <h1 className="font-script text-4xl md:text-5xl text-[var(--color-primary)] mb-6 animate-fade-in-up opacity-0-init delay-300">
          {wedding.couple_name_two}
        </h1>

        {/* Date */}
        {wedding.wedding_date && (
          <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] mb-10 animate-fade-in opacity-0-init delay-400">
            {formatDate(wedding.wedding_date, lang)}
          </p>
        )}

        {/* Decorative Divider */}
        <div className="flex items-center justify-center gap-3 mb-10 animate-fade-in opacity-0-init delay-500">
          <div className="h-px w-12 bg-[var(--color-border)]/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
          <div className="h-px w-12 bg-[var(--color-border)]/30" />
        </div>

        {/* Welcome Body / Invitation Message */}
        {content.home_body && (
          <p className="font-body text-base md:text-lg text-[var(--color-text)] leading-relaxed mb-10 animate-fade-in-up opacity-0-init delay-500">
            {content.home_body}
          </p>
        )}

        {/* Home Image */}
        {content.home_image_url && (
          <div className="mb-10 animate-fade-in-up opacity-0-init delay-700">
            <img
              src={content.home_image_url}
              alt=""
              className="w-full max-w-md mx-auto rounded-lg shadow-[var(--shadow-card)]"
            />
          </div>
        )}

        {/* Countdown Timer */}
        {!countdown.isPast && (content.countdown_enabled !== false) && (
          <div className="mb-10 animate-fade-in-up opacity-0-init delay-700">
            {content.countdown_label && (
              <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] mb-4">
                {content.countdown_label}
              </p>
            )}
            <div className="flex justify-center gap-6 md:gap-10">
              {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                <div key={unit} className="text-center">
                  <div className="font-heading text-3xl md:text-4xl text-[var(--color-primary)] mb-1">
                    {String(countdown[unit]).padStart(2, "0")}
                  </div>
                  <div className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
                    {t_unit(unit, lang)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quran Verse */}
        {content.invitation_quran_verse && (
          <div className="border-t border-b border-[var(--color-border)]/20 py-8 my-10 animate-fade-in-up opacity-0-init delay-700">
            <p className="font-heading text-lg md:text-xl text-[var(--color-primary)] italic mb-3 leading-relaxed">
              {content.invitation_quran_verse}
            </p>
            {content.invitation_quran_translation && (
              <p className="font-body text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed mb-2">
                {content.invitation_quran_translation}
              </p>
            )}
            {content.invitation_quran_reference && (
              <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mt-3">
                {content.invitation_quran_reference}
              </p>
            )}
          </div>
        )}

        {/* Closing Dua */}
        {content.invitation_closing && (
          <p className="font-body text-sm md:text-base text-[var(--color-text)] italic leading-relaxed animate-fade-in-up opacity-0-init delay-1000">
            {content.invitation_closing}
          </p>
        )}

        {/* Home Closing Text */}
        {content.home_closing_text && (
          <p className="font-body text-sm text-[var(--color-text-muted)] italic mt-6 animate-fade-in opacity-0-init delay-1000">
            {content.home_closing_text}
          </p>
        )}
      </div>
    </div>
  );
}

function t_unit(unit: string, lang: "en" | "ms"): string {
  const map: Record<string, { en: string; ms: string }> = {
    days: { en: "Days", ms: "Hari" },
    hours: { en: "Hours", ms: "Jam" },
    minutes: { en: "Minutes", ms: "Minit" },
    seconds: { en: "Seconds", ms: "Saat" },
  };
  return map[unit]?.[lang] || unit;
}

export default Home;
