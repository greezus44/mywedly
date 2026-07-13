import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, coverToCssVars, getTheme, getCoverConfig, getCoverContent, getLogoConfig, getLogoStyle } from "../../lib/theme";
import { getCountdown, formatDate, getDeviceType } from "../../lib/utils";

export function Home() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session } = useGuestAuth();
  const { lang, t } = useLang();
  const [countdown, setCountdown] = useState(getCountdown(null));

  useEffect(() => {
    if (!session) { navigate(`/w/${slug}/login`, { replace: true }); return; }
    setCountdown(getCountdown(session.wedding.wedding_date));
    const interval = setInterval(() => setCountdown(getCountdown(session.wedding.wedding_date)), 1000);
    return () => clearInterval(interval);
  }, [session, slug, navigate]);

  if (!session) return null;

  const wedding = session.wedding;
  const theme = getTheme(wedding);
  const cover = getCoverConfig(wedding);
  const content = getCoverContent(wedding);
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();

  const showLogo = logo.visible && logo.url && (logo.showOnPages === "all-pages" || (logo.showOnPages === "custom" && logo.customPages.includes("home")));
  const dateStr = formatDate(wedding.wedding_date, lang);

  return (
    <div
      className="min-h-screen px-6 py-12 md:py-20"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover) } as React.CSSProperties}
    >
      <div className="max-w-2xl mx-auto text-center">
        {showLogo && (
          <div className="flex justify-center mb-8 animate-fade-in">
            <img src={logo.url!} alt="Logo" style={getLogoStyle(logo, device)} />
          </div>
        )}

        {/* Bismillah */}
        {content.invitation_intro && (
          <p className="font-body text-lg text-[var(--color-text-muted)] mb-6 animate-fade-in opacity-0-init delay-100">
            {content.invitation_intro}
          </p>
        )}

        <p className="font-script text-xl text-[var(--color-primary)] mb-4 animate-fade-in opacity-0-init delay-100">
          {t("bismillah")}
        </p>

        {/* Couple names */}
        <div className="mb-8 animate-fade-in-up opacity-0-init delay-200">
          <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-3">
            {t("invitation")}
          </p>
          <h1 className="font-script text-4xl md:text-5xl text-[var(--color-primary)] mb-2">
            {wedding.couple_name_one}
          </h1>
          <div className="flex items-center justify-center gap-3 my-2">
            <div className="h-px w-12 bg-[var(--color-primary)]/30" />
            <Heart size={16} className="text-[var(--color-primary)]" />
            <div className="h-px w-12 bg-[var(--color-primary)]/30" />
          </div>
          <h1 className="font-script text-4xl md:text-5xl text-[var(--color-primary)]">
            {wedding.couple_name_two}
          </h1>
        </div>

        {/* Date */}
        {dateStr && (
          <p className="font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-text)] mb-8 animate-fade-in opacity-0-init delay-300">
            {dateStr}
          </p>
        )}

        {/* Welcome text */}
        {content.home_body && (
          <p className="font-body text-lg text-[var(--color-text)] leading-relaxed mb-8 animate-fade-in-up opacity-0-init delay-400">
            {content.home_body}
          </p>
        )}

        {/* Quran verse */}
        {(content.invitation_quran_verse || content.invitation_quran_translation) && (
          <div className="my-10 px-6 py-8 border border-[var(--color-border)]/20 rounded-lg bg-[var(--color-surface)]/50 animate-fade-in-up opacity-0-init delay-500">
            {content.invitation_quran_verse && (
              <p className="font-script text-xl text-[var(--color-primary)] mb-4 leading-relaxed" style={{ direction: "rtl" }}>
                {content.invitation_quran_verse}
              </p>
            )}
            {content.invitation_quran_translation && (
              <p className="font-body text-base text-[var(--color-text-muted)] italic mb-2">
                {content.invitation_quran_translation}
              </p>
            )}
            {content.invitation_quran_reference && (
              <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-primary)]">
                {content.invitation_quran_reference}
              </p>
            )}
          </div>
        )}

        {/* Countdown */}
        {!countdown.isPast && content.countdown_enabled !== false && (
          <div className="my-10 animate-fade-in-up opacity-0-init delay-500">
            <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-4">
              {content.countdown_label || "Counting down to our special day"}
            </p>
            <div className="flex justify-center gap-4 md:gap-8">
              {[
                { label: t("days"), value: countdown.days },
                { label: t("hours"), value: countdown.hours },
                { label: t("minutes"), value: countdown.minutes },
                { label: t("seconds"), value: countdown.seconds },
              ].map((unit) => (
                <div key={unit.label} className="text-center">
                  <div className="font-script text-2xl md:text-3xl text-[var(--color-primary)]">
                    {String(unit.value).padStart(2, "0")}
                  </div>
                  <div className="font-ui text-[0.625rem] uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
                    {unit.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Closing dua */}
        {content.invitation_closing && (
          <p className="font-body text-base text-[var(--color-text-muted)] italic mt-10 animate-fade-in opacity-0-init delay-700">
            {content.invitation_closing}
          </p>
        )}
      </div>
    </div>
  );
}

export default Home;
