import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, MapPin, ChevronRight } from "lucide-react";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getContent } from "../../lib/theme";
import { getCountdown, formatDate } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import type { TranslationKey } from "../../lib/i18n";

export function Home() {
  const { session } = useGuestAuth();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const params = useParams();
  const slug = params.slug || session?.wedding.slug || "";

  const wedding = session?.wedding || null;
  const theme = getTheme(wedding);
  const cssVars = themeToCssVars(theme);
  const content = getContent(wedding!);

  const [countdown, setCountdown] = useState(getCountdown(wedding?.wedding_date || null));

  useEffect(() => {
    if (!wedding?.wedding_date) return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(wedding.wedding_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [wedding?.wedding_date]);

  if (!wedding) return null;

  const coupleNames =
    content.cover_heading ||
    `${wedding.couple_name_one} & ${wedding.couple_name_two}`;
  const welcomeText = content.home_subtitle || content.cover_welcome || t("welcome");
  const homeTitle = content.home_title || t("invitation");
  const homeBody = content.home_body || "";
  const closingText = content.home_closing_text || content.invitation_closing || t("closingDua");
  const countdownEnabled = content.countdown_enabled !== false;
  const countdownLabel = content.countdown_label || t("countdown");

  const guestFirstName = session?.guest.first_name || session?.guest.full_name?.split(" ")[0] || "";
  const fullNameOne = wedding.full_name_one || wedding.couple_name_one;
  const fullNameTwo = wedding.full_name_two || wedding.couple_name_two;

  const navItems: { key: TranslationKey; path: string }[] = [
    { key: "rsvp", path: "rsvp" },
    { key: "sendMessage", path: "send-message" },
    { key: "doa", path: "doa" },
    { key: "contact", path: "contact" },
  ];

  return (
    <div style={cssVars} className="bg-[var(--color-bg)] min-h-screen">
      {/* Hero section */}
      <section className="max-w-3xl mx-auto px-6 pt-16 md:pt-24 pb-12 text-center">
        {/* Bismillah */}
        {content.invitation_intro !== "" && (
          <p className="font-heading text-base md:text-lg text-[var(--color-text-muted)] italic mb-8 animate-fade-in-down opacity-0-init">
            {t("bismillah")}
          </p>
        )}

        {/* Guest greeting */}
        {guestFirstName && (
          <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] mb-6 animate-fade-in opacity-0-init delay-100">
            {t("youAreInvited")}, {guestFirstName}
          </p>
        )}

        {/* Couple names */}
        <h1 className="font-script text-5xl md:text-6xl lg:text-7xl text-[var(--color-primary)] leading-tight mb-6 animate-fade-in-up opacity-0-init delay-200">
          {coupleNames}
        </h1>

        {/* Full names */}
        <p className="font-heading text-lg md:text-xl text-[var(--color-text)] mb-6 animate-fade-in-up opacity-0-init delay-300">
          {fullNameOne}
          <br />
          <span className="font-script text-2xl text-[var(--color-primary)]">&</span>
          <br />
          {fullNameTwo}
        </p>

        {/* Wedding date */}
        {wedding.wedding_date && (
          <div className="flex items-center justify-center gap-2 mb-2 animate-fade-in-up opacity-0-init delay-400">
            <Calendar size={16} className="text-[var(--color-primary)]" />
            <p className="font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-text)]">
              {formatDate(wedding.wedding_date, lang)}
            </p>
          </div>
        )}

        {/* Location */}
        {wedding.location && (
          <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in-up opacity-0-init delay-400">
            <MapPin size={16} className="text-[var(--color-primary)]" />
            <p className="font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
              {wedding.location}
            </p>
          </div>
        )}

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in opacity-0-init delay-500">
          <div className="h-px w-16 bg-[var(--color-border)]/30" />
          <div className="w-2 h-2 rounded-full border border-[var(--color-border)]/40" />
          <div className="h-px w-16 bg-[var(--color-border)]/30" />
        </div>

        {/* Welcome text */}
        <p className="font-heading text-xl md:text-2xl text-[var(--color-text)] italic mb-8 animate-fade-in-up opacity-0-init delay-500">
          {welcomeText}
        </p>
      </section>

      {/* Countdown timer */}
      {countdownEnabled && wedding.wedding_date && !countdown.isPast && (
        <section className="max-w-3xl mx-auto px-6 py-12 text-center">
          <p className="font-ui text-xs uppercase tracking-luxe text-[var(--color-text-muted)] mb-8 animate-fade-in opacity-0-init">
            {countdownLabel}
          </p>
          <div className="flex items-center justify-center gap-4 md:gap-10">
            {[
              { label: t("days"), value: countdown.days },
              { label: t("hours"), value: countdown.hours },
              { label: t("minutes"), value: countdown.minutes },
              { label: t("seconds"), value: countdown.seconds },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <div className="font-script text-4xl md:text-5xl text-[var(--color-primary)] tabular-nums">
                  {String(item.value).padStart(2, "0")}
                </div>
                <div className="font-ui text-[10px] md:text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mt-2">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invitation message */}
      {(homeBody || content.invitation_quran_verse) && (
        <section className="max-w-2xl mx-auto px-6 py-12 text-center">
          {homeTitle && (
            <h2 className="font-heading text-2xl md:text-3xl text-[var(--color-primary)] mb-8 animate-fade-in-up opacity-0-init">
              {homeTitle}
            </h2>
          )}

          {homeBody && (
            <p className="font-body text-lg md:text-xl text-[var(--color-text)] leading-relaxed mb-8 animate-fade-in-up opacity-0-init delay-100 whitespace-pre-line">
              {homeBody}
            </p>
          )}

          {/* Quran verse */}
          {content.invitation_quran_verse && (
            <div className="my-10 py-8 px-4 border-y border-[var(--color-border)]/20 animate-fade-in-up opacity-0-init delay-200">
              <p className="font-heading text-xl md:text-2xl text-[var(--color-primary)] leading-relaxed mb-4 italic">
                {content.invitation_quran_verse}
              </p>
              {content.invitation_quran_translation && (
                <p className="font-body text-base md:text-lg text-[var(--color-text)] leading-relaxed mb-3">
                  {content.invitation_quran_translation}
                </p>
              )}
              {content.invitation_quran_reference && (
                <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
                  — {content.invitation_quran_reference}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Closing dua */}
      {closingText && (
        <section className="max-w-2xl mx-auto px-6 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-[var(--color-border)]/30" />
            <div className="w-1.5 h-1.5 rounded-full border border-[var(--color-border)]/40" />
            <div className="h-px w-12 bg-[var(--color-border)]/30" />
          </div>
          <p className="font-heading text-lg md:text-xl text-[var(--color-text-muted)] italic leading-relaxed animate-fade-in-up opacity-0-init">
            {closingText}
          </p>
        </section>
      )}

      {/* Navigation cards */}
      <section className="max-w-3xl mx-auto px-6 py-12 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {navItems.map((item, idx) => (
            <button
              key={item.key}
              onClick={() => navigate(`/w/${slug}/${item.path}`)}
              className={`group flex items-center justify-between px-6 py-5 bg-[var(--color-surface)] border border-[var(--color-border)]/20 rounded-lg hover:border-[var(--color-primary)] transition-all animate-fade-in-up opacity-0-init delay-${(idx + 1) * 100}`}
              style={{ borderRadius: "var(--button-radius, 8px)" }}
            >
              <span className="font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-text)]">
                {t(item.key)}
              </span>
              <ChevronRight
                size={18}
                className="text-[var(--color-primary)] group-hover:translate-x-1 transition-transform"
              />
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-6 py-8 text-center border-t border-[var(--color-border)]/15">
        <p className="font-script text-2xl text-[var(--color-primary)] mb-2">
          {coupleNames}
        </p>
        {wedding.hashtag && (
          <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">
            {wedding.hashtag}
          </p>
        )}
      </footer>
    </div>
  );
}

export default Home;
