import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Clock } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { getTheme, themeToCssVars } from "../../lib/theme";
import { getCountdown, formatDate, formatTime } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

export function Home() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session } = useGuestAuth();
  const { lang, t } = useLang();
  const [countdown, setCountdown] = useState(getCountdown(null));

  useEffect(() => {
    if (!session?.wedding.wedding_date) return;
    const tick = () => setCountdown(getCountdown(session.wedding.wedding_date));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;

  const { wedding, guest } = session;
  const theme = getTheme(wedding);
  const content = (wedding.content || {}) as Record<string, unknown>;
  const draftContent = (wedding.draft_content || {}) as Record<string, unknown>;
  const c = { ...content, ...draftContent };

  const guestName = guest.first_name || guest.full_name || guest.username;
  const homeTitle = (c.home_title as string) || `${wedding.couple_name_one} & ${wedding.couple_name_two}`;
  const homeSubtitle = (c.home_subtitle as string) || t("welcome");
  const homeBody = (c.home_body as string) || wedding.story || "";
  const closingText = (c.home_closing_text as string) || (c.invitation_closing as string) || "";
  const quranVerse = (c.invitation_quran_verse as string) || "";
  const quranTranslation = (c.invitation_quran_translation as string) || "";
  const quranReference = (c.invitation_quran_reference as string) || "";
  const intro = (c.invitation_intro as string) || "";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={themeToCssVars(theme) as React.CSSProperties}
    >
      <div className="max-w-2xl w-full text-center">
        {/* Bismillah */}
        <p className="font-heading text-lg text-[var(--color-primary)] italic mb-8 opacity-0-init animate-fade-in">
          {t("bismillah")}
        </p>

        {/* Welcome */}
        <p className="font-ui text-xs md:text-sm uppercase tracking-luxe text-[var(--color-text-muted)] mb-4 opacity-0-init animate-fade-in-up">
          {homeSubtitle}
        </p>

        <p className="font-heading text-xl text-[var(--color-text)] mb-8 opacity-0-init animate-fade-in-up delay-100">
          {guestName}
        </p>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 mb-8 opacity-0-init animate-fade-in-up delay-200">
          <span className="h-px w-16 bg-[var(--color-primary)]/30" />
          <span className="text-[var(--color-primary)] text-xs">✦</span>
          <span className="h-px w-16 bg-[var(--color-primary)]/30" />
        </div>

        {/* Couple names */}
        <h1 className="font-script text-5xl md:text-6xl text-[var(--color-text)] mb-6 opacity-0-init animate-fade-in-up delay-200">
          {homeTitle}
        </h1>

        {/* Date & time */}
        {wedding.wedding_date && (
          <div className="flex flex-col items-center gap-2 mb-8 opacity-0-init animate-fade-in-up delay-300">
            <div className="flex items-center gap-2 text-[var(--color-text)]">
              <CalendarDays size={16} className="text-[var(--color-primary)]" />
              <span className="font-heading text-lg">{formatDate(wedding.wedding_date, lang)}</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <Clock size={14} />
              <span className="font-ui text-sm">{formatTime(wedding.wedding_date, lang)}</span>
            </div>
            {wedding.location && (
              <p className="font-heading text-base text-[var(--color-text-muted)] mt-1">
                {wedding.location}
              </p>
            )}
          </div>
        )}

        {/* Intro */}
        {intro && (
          <p className="font-body text-lg text-[var(--color-text)] leading-relaxed mb-8 opacity-0-init animate-fade-in-up delay-300">
            {intro}
          </p>
        )}

        {/* Body */}
        {homeBody && (
          <p className="font-body text-lg text-[var(--color-text)] leading-relaxed mb-8 opacity-0-init animate-fade-in-up delay-400">
            {homeBody}
          </p>
        )}

        {/* Quran verse */}
        {quranVerse && (
          <div className="my-10 py-8 border-t border-b border-[var(--color-primary)]/20 opacity-0-init animate-fade-in-up delay-400">
            <p className="font-heading text-2xl text-[var(--color-text)] leading-relaxed mb-4" dir="rtl">
              {quranVerse}
            </p>
            {quranTranslation && (
              <p className="font-body text-base text-[var(--color-text-muted)] italic leading-relaxed">
                {quranTranslation}
              </p>
            )}
            {quranReference && (
              <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-primary)] mt-4">
                {quranReference}
              </p>
            )}
          </div>
        )}

        {/* Countdown */}
        {!countdown.isPast && (
          <div className="mb-10 opacity-0-init animate-fade-in-up delay-500">
            <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-4">
              {c.countdown_label as string || t("days")} {t("days")}
            </p>
            <div className="flex justify-center gap-4 md:gap-8">
              {[
                { label: t("days"), value: countdown.days },
                { label: t("hours"), value: countdown.hours },
                { label: t("minutes"), value: countdown.minutes },
                { label: t("seconds"), value: countdown.seconds },
              ].map((unit) => (
                <div key={unit.label} className="text-center">
                  <div className="font-heading text-3xl md:text-4xl text-[var(--color-primary)] tabular-nums">
                    {String(unit.value).padStart(2, "0")}
                  </div>
                  <div className="font-ui text-[10px] uppercase tracking-wider-luxe text-[var(--color-text-muted)] mt-1">
                    {unit.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Closing dua */}
        {closingText && (
          <p className="font-body text-lg text-[var(--color-text)] leading-relaxed italic mb-10 opacity-0-init animate-fade-in-up delay-500">
            {closingText}
          </p>
        )}

        {/* RSVP CTA */}
        <div className="opacity-0-init animate-fade-in-up delay-700">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(`/w/${slug}/rsvp`)}
          >
            {t("rsvp")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Home;
