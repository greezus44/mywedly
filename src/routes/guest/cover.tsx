import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Clock, ArrowRight } from "lucide-react";
import { supabase, type Wedding } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { getTheme, getCoverContent, themeToCssVars } from "../../lib/theme";
import { getCountdown, formatDate } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

export function Cover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(getCountdown(null));

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!error && data) setWedding(data as Wedding);
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!wedding?.wedding_date) return;
    const tick = () => setCountdown(getCountdown(wedding.wedding_date));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [wedding]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5edda]">
        <p className="font-ui text-sm uppercase tracking-wider-luxe text-[#8a8a8a] animate-pulse">
          {t("loading")}
        </p>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5edda] px-6">
        <div className="text-center">
          <h1 className="font-script text-3xl text-[#b8973a] mb-4">Wedding Not Found</h1>
          <p className="font-ui text-sm text-[#8a8a8a]">The invitation you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  const theme = getTheme(wedding);
  const content = getCoverContent(wedding);
  const bgUrl = content.cover_background_url || wedding.hero_image_url;
  const isVideo = content.cover_background_type === "video" && bgUrl;
  const heading = content.cover_heading || `${wedding.couple_name_one} & ${wedding.couple_name_two}`;
  const subtitle = content.cover_subtitle || content.cover_welcome || t("welcome");
  const buttonText = content.cover_button_text || t("enterWebsite");

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={themeToCssVars(theme) as React.CSSProperties}
    >
      {/* Background */}
      {isVideo ? (
        <video
          src={bgUrl!}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : bgUrl ? (
        <img
          src={bgUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg)] to-[var(--color-bg-light)]" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 py-12 max-w-3xl">
        {/* Logo / monogram */}
        {content.cover_logo_url && (
          <img
            src={content.cover_logo_url}
            alt="Monogram"
            className="mx-auto h-20 w-auto mb-8 opacity-0-init animate-fade-in"
          />
        )}

        {/* Subtitle */}
        <p className="font-ui text-xs md:text-sm uppercase tracking-luxe text-white/80 mb-6 opacity-0-init animate-fade-in-up">
          {subtitle}
        </p>

        {/* Decorative line */}
        <div className="flex items-center justify-center gap-4 mb-6 opacity-0-init animate-fade-in-up delay-100">
          <span className="h-px w-12 bg-white/40" />
          <span className="text-white/60 text-xs">✦</span>
          <span className="h-px w-12 bg-white/40" />
        </div>

        {/* Couple names */}
        <h1 className="font-script text-5xl md:text-7xl text-white mb-4 opacity-0-init animate-fade-in-up delay-200">
          {heading}
        </h1>

        {/* Date */}
        {wedding.wedding_date && (
          <div className="flex items-center justify-center gap-2 text-white/90 mb-8 opacity-0-init animate-fade-in-up delay-300">
            <CalendarDays size={16} />
            <span className="font-heading text-lg md:text-xl">
              {formatDate(wedding.wedding_date, lang)}
            </span>
          </div>
        )}

        {/* Countdown */}
        {!countdown.isPast && (
          <div className="flex justify-center gap-4 md:gap-8 mb-10 opacity-0-init animate-fade-in-up delay-400">
            {[
              { label: t("days"), value: countdown.days },
              { label: t("hours"), value: countdown.hours },
              { label: t("minutes"), value: countdown.minutes },
              { label: t("seconds"), value: countdown.seconds },
            ].map((unit) => (
              <div key={unit.label} className="text-center">
                <div className="font-heading text-2xl md:text-4xl text-white tabular-nums">
                  {String(unit.value).padStart(2, "0")}
                </div>
                <div className="font-ui text-[10px] uppercase tracking-wider-luxe text-white/60 mt-1">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enter button */}
        <div className="opacity-0-init animate-fade-in-up delay-500">
          <Button
            variant="outline"
            size="lg"
            className="!text-white !border-white hover:!bg-white hover:!text-[var(--color-text)]"
            onClick={() => navigate(`/w/${slug}/login`)}
          >
            {buttonText}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Cover;
