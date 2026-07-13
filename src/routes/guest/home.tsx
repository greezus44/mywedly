import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Clock, MapPin, Heart, Sparkles } from "lucide-react";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import {
  themeToCssVars,
  getTheme,
  coverToCssVars,
  getCoverConfig,
  getCoverContent,
} from "../../lib/theme";
import { getCountdown, formatDate, formatTime } from "../../lib/utils";

function HomeInner() {
  const navigate = useNavigate();
  const params = useParams();
  const slug = params.slug || "";
  const { session, loading } = useGuestAuth();
  const { lang, t } = useLang();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });

  const wedding = session?.wedding ?? null;

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate(`/w/${slug}/login`, { replace: true });
    }
  }, [session, loading, slug, navigate]);

  if (loading || !wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <Heart size={24} className="animate-pulse" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  useEffect(() => {
    if (!wedding?.wedding_date) return;
    setCountdown(getCountdown(wedding.wedding_date));
    const interval = setInterval(() => {
      setCountdown(getCountdown(wedding.wedding_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [wedding?.wedding_date]);

  if (loading || !session) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg)" } as CSSProperties}
      >
        <Heart size={24} className="animate-pulse" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  const theme = getTheme(wedding);
  const cover = getCoverConfig(wedding);
  const content = getCoverContent(wedding);
  const guest = session.guest;

  const guestName = guest.first_name || guest.full_name || guest.username;

  return (
    <div
      className="min-h-screen pb-16"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover) } as CSSProperties}
    >
      {/* Hero Section */}
      <section className="px-6 md:px-12 pt-12 md:pt-20 pb-16 text-center">
        {/* Bismillah */}
        <p
          className="font-body text-base md:text-lg italic mb-8 animate-fade-in opacity-0-init"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t("bismillah")}
        </p>

        {/* Invitation label */}
        <p
          className="font-ui text-xs uppercase tracking-luxe mb-4 animate-fade-in-up opacity-0-init delay-100"
          style={{ color: "var(--color-primary)" }}
        >
          {t("invitation")}
        </p>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in opacity-0-init delay-200">
          <div className="h-px w-12" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
          <Sparkles size={14} style={{ color: "var(--color-primary)" }} />
          <div className="h-px w-12" style={{ background: "var(--color-primary)", opacity: 0.4 }} />
        </div>

        {/* Couple Names */}
        <h1
          className="font-script text-4xl md:text-6xl lg:text-7xl mb-2 animate-fade-in-up opacity-0-init delay-200"
          style={{ color: "var(--color-text)" }}
        >
          {wedding.couple_name_one}
        </h1>
        <p
          className="font-script text-2xl md:text-3xl mb-2 animate-fade-in-up opacity-0-init delay-300"
          style={{ color: "var(--color-primary)" }}
        >
          &
        </p>
        <h1
          className="font-script text-4xl md:text-6xl lg:text-7xl mb-8 animate-fade-in-up opacity-0-init delay-300"
          style={{ color: "var(--color-text)" }}
        >
          {wedding.couple_name_two}
        </h1>

        {/* Date */}
        {wedding.wedding_date && (
          <div className="flex items-center justify-center gap-2 mb-2 animate-fade-in-up opacity-0-init delay-400">
            <Calendar size={16} style={{ color: "var(--color-primary)" }} />
            <p
              className="font-ui text-xs md:text-sm uppercase tracking-wider-luxe"
              style={{ color: "var(--color-text)" }}
            >
              {formatDate(wedding.wedding_date, lang)}
            </p>
          </div>
        )}

        {/* Time */}
        {wedding.wedding_date && (
          <div className="flex items-center justify-center gap-2 mb-2 animate-fade-in-up opacity-0-init delay-400">
            <Clock size={16} style={{ color: "var(--color-primary)" }} />
            <p
              className="font-ui text-xs md:text-sm uppercase tracking-wider-luxe"
              style={{ color: "var(--color-text)" }}
            >
              {formatTime(wedding.wedding_date, lang)}
            </p>
          </div>
        )}

        {/* Location */}
        {wedding.location && (
          <div className="flex items-center justify-center gap-2 animate-fade-in-up opacity-0-init delay-500">
            <MapPin size={16} style={{ color: "var(--color-primary)" }} />
            <p
              className="font-ui text-xs md:text-sm uppercase tracking-wider-luxe"
              style={{ color: "var(--color-text)" }}
            >
              {wedding.location}
            </p>
          </div>
        )}
      </section>

      {/* Countdown Section */}
      {!countdown.isPast && (
        <section className="px-6 md:px-12 py-12 text-center animate-fade-in-up opacity-0-init delay-500">
          <p
            className="font-ui text-xs uppercase tracking-luxe mb-6"
            style={{ color: "var(--color-primary)" }}
          >
            {content.countdown_label || t("loading")}
          </p>
          <div className="flex justify-center gap-6 md:gap-12">
            {[
              { label: t("days"), value: countdown.days },
              { label: t("hours"), value: countdown.hours },
              { label: t("minutes"), value: countdown.minutes },
              { label: t("seconds"), value: countdown.seconds },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div
                  className="font-script text-3xl md:text-5xl"
                  style={{ color: "var(--color-text)" }}
                >
                  {String(item.value).padStart(2, "0")}
                </div>
                <div
                  className="font-ui text-[10px] md:text-xs uppercase tracking-wider-luxe mt-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Welcome / Invitation Body */}
      <section className="px-6 md:px-12 py-12 max-w-2xl mx-auto text-center animate-fade-in-up opacity-0-init delay-500">
        {/* Guest name */}
        <p
          className="font-ui text-xs uppercase tracking-luxe mb-4"
          style={{ color: "var(--color-primary)" }}
        >
          {t("welcome")}
        </p>
        <h2
          className="font-script text-2xl md:text-3xl mb-6"
          style={{ color: "var(--color-text)" }}
        >
          {guestName}
        </h2>

        {/* Invitation intro */}
        {content.invitation_intro && (
          <p
            className="font-body text-lg md:text-xl leading-relaxed mb-8"
            style={{ color: "var(--color-text)" }}
          >
            {content.invitation_intro}
          </p>
        )}

        {/* Home body / welcome text */}
        {content.home_body && (
          <p
            className="font-body text-base md:text-lg leading-relaxed mb-8"
            style={{ color: "var(--color-text-muted)" }}
          >
            {content.home_body}
          </p>
        )}

        {/* Quran Verse */}
        {content.invitation_quran_verse && (
          <div
            className="my-10 py-8 px-6 md:px-10 animate-fade-in opacity-0-init delay-700"
            style={{
              borderTop: "1px solid var(--color-border)",
              borderBottom: "1px solid var(--color-border)",
              borderColor: "color-mix(in srgb, var(--color-border) 25%, transparent)",
            }}
          >
            <p
              className="font-body text-xl md:text-2xl italic leading-relaxed mb-4"
              style={{ color: "var(--color-text)" }}
            >
              {content.invitation_quran_verse}
            </p>
            {content.invitation_quran_translation && (
              <p
                className="font-body text-base md:text-lg leading-relaxed mb-3"
                style={{ color: "var(--color-text-muted)" }}
              >
                {content.invitation_quran_translation}
              </p>
            )}
            {content.invitation_quran_reference && (
              <p
                className="font-ui text-xs uppercase tracking-wider-luxe"
                style={{ color: "var(--color-primary)" }}
              >
                — {content.invitation_quran_reference}
              </p>
            )}
          </div>
        )}

        {/* Closing dua */}
        {content.invitation_closing && (
          <p
            className="font-body text-base md:text-lg leading-relaxed mt-8"
            style={{ color: "var(--color-text)" }}
          >
            {content.invitation_closing}
          </p>
        )}
      </section>
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
