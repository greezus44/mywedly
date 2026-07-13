import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getCoverContent } from "../../lib/theme";
import { getCountdown } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import type { Wedding } from "../../lib/supabase";

export function Cover() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const theme = getTheme(wedding);
  const cssVars = themeToCssVars(theme);
  const content = getCoverContent(wedding || {});

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (error || !data) {
        setNotFound(true);
      } else {
        setWedding(data as Wedding);
      }
      setLoading(false);
    })();
  }, [slug]);

  const [countdown, setCountdown] = useState(getCountdown(wedding?.wedding_date || null));

  useEffect(() => {
    if (!wedding?.wedding_date) return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(wedding.wedding_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [wedding?.wedding_date]);

  if (loading) {
    return (
      <div style={cssVars} className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <p className="font-ui text-sm uppercase tracking-wider-luxe text-[var(--color-text-muted)] animate-pulse">
          {t("loading")}
        </p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={cssVars} className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-6">
        <div className="text-center animate-fade-in">
          <h1 className="font-script text-3xl md:text-4xl text-[var(--color-primary)] mb-4">
            Wedding Not Found
          </h1>
          <p className="font-ui text-sm text-[var(--color-text-muted)]">
            The invitation you are looking for could not be found.
          </p>
        </div>
      </div>
    );
  }

  const coupleNames =
    content.cover_heading ||
    (wedding ? `${wedding.couple_name_one} & ${wedding.couple_name_two}` : "");
  const welcomeText = content.cover_welcome || t("welcome");
  const subtitle = content.cover_subtitle || "";
  const buttonText = content.cover_button_text || t("enterWebsite");
  const bgUrl = content.cover_background_url || wedding?.hero_image_url || null;
  const bgType = content.cover_background_type || "image";
  const logoUrl = content.cover_logo_url || wedding?.cover_monogram_url || null;
  const showCountdown = content.countdown_enabled !== false && wedding?.wedding_date && !countdown.isPast;

  const handleEnter = () => {
    if (slug) navigate(`/w/${slug}/login`);
  };

  return (
    <div
      style={cssVars}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[var(--color-bg)]"
    >
      {/* Background image/video */}
      {bgUrl && bgType === "video" ? (
        <video
          src={bgUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : bgUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg-light)] via-[var(--color-bg)] to-[var(--color-bg)]" />
      )}

      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

      {/* Language toggle top right */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5">
        <button
          onClick={() => setLang("en")}
          className={`font-ui text-xs uppercase tracking-wider-luxe px-2 py-1 transition-opacity ${
            lang === "en" ? "text-white opacity-100" : "text-white/60 opacity-60 hover:opacity-90"
          }`}
        >
          EN
        </button>
        <span className="text-white/40 text-xs">|</span>
        <button
          onClick={() => setLang("ms")}
          className={`font-ui text-xs uppercase tracking-wider-luxe px-2 py-1 transition-opacity ${
            lang === "ms" ? "text-white opacity-100" : "text-white/60 opacity-60 hover:opacity-90"
          }`}
        >
          MS
        </button>
      </div>

      {/* Centered content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-3xl mx-auto">
        {/* Monogram / logo */}
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Monogram"
            className="w-20 h-20 md:w-24 md:h-24 object-contain mb-8 animate-fade-in opacity-0-init"
          />
        )}

        {/* Welcome text */}
        <p className="font-ui text-xs md:text-sm uppercase tracking-luxe text-white/80 mb-6 animate-fade-in-down opacity-0-init">
          {welcomeText}
        </p>

        {/* Couple names */}
        <h1 className="font-script text-5xl md:text-7xl lg:text-8xl text-white leading-tight mb-4 animate-fade-in-up opacity-0-init delay-100">
          {coupleNames}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="font-heading text-lg md:text-xl text-white/90 italic mb-6 animate-fade-in-up opacity-0-init delay-200">
            {subtitle}
          </p>
        )}

        {/* Wedding date */}
        {wedding?.wedding_date && (
          <p className="font-ui text-sm md:text-base uppercase tracking-wider-luxe text-white/85 mb-10 animate-fade-in-up opacity-0-init delay-300">
            {new Date(wedding.wedding_date).toLocaleDateString(lang === "ms" ? "ms-MY" : "en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        {/* Countdown timer */}
        {showCountdown && (
          <div className="flex items-center justify-center gap-4 md:gap-8 mb-10 animate-fade-in-up opacity-0-init delay-400">
            {[
              { label: t("days"), value: countdown.days },
              { label: t("hours"), value: countdown.hours },
              { label: t("minutes"), value: countdown.minutes },
              { label: t("seconds"), value: countdown.seconds },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <div className="font-script text-3xl md:text-4xl text-white tabular-nums">
                  {String(item.value).padStart(2, "0")}
                </div>
                <div className="font-ui text-[10px] md:text-xs uppercase tracking-wider-luxe text-white/70 mt-1">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enter button */}
        <Button
          variant="outline"
          size="lg"
          onClick={handleEnter}
          className="animate-fade-in-up opacity-0-init delay-500 text-white border-white/70 hover:bg-white hover:text-[var(--color-primary)]"
        >
          {buttonText}
          <ChevronRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}

export default Cover;
