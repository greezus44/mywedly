import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getCoverContent } from "../../lib/theme";
import { getCountdown, formatDate } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

export function Cover() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { lang } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(getCountdown(null));

  useEffect(() => {
    async function fetchWedding() {
      if (!slug) return;
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (!error && data) setWedding(data as Wedding);
      setLoading(false);
    }
    fetchWedding();
  }, [slug]);

  useEffect(() => {
    if (!wedding?.wedding_date) return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(wedding.wedding_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [wedding]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="font-ui text-xs uppercase tracking-luxe text-white/60 animate-pulse">
          {lang === "ms" ? "Memuatkan..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="font-ui text-sm uppercase tracking-wider-luxe text-white/60">
          {lang === "ms" ? "Jemputan tidak dijumpai" : "Invitation not found"}
        </p>
      </div>
    );
  }

  const content = getCoverContent(wedding);
  const theme = wedding.theme_config && "colors" in wedding.theme_config ? wedding.theme_config : null;
  const bgUrl = content.cover_background_url;
  const isVideo = content.cover_background_type === "video";

  const handleEnter = () => {
    navigate(`/w/${slug}/login`);
  };

  return (
    <div
      style={themeToCssVars(theme) as React.CSSProperties}
      className="min-h-screen relative flex flex-col items-center justify-center text-center overflow-hidden"
    >
      {/* Background */}
      {isVideo && bgUrl ? (
        <video
          src={bgUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        bgUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgUrl})` }}
          />
        )
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 py-16 max-w-2xl mx-auto">
        {/* Logo */}
        {content.cover_logo_url && (
          <img
            src={content.cover_logo_url}
            alt=""
            className="w-20 h-20 object-contain mb-8 animate-fade-in opacity-0-init"
          />
        )}

        {/* Welcome Text */}
        {content.cover_welcome && (
          <p className="font-ui text-xs uppercase tracking-luxe text-white/80 mb-6 animate-fade-in opacity-0-init delay-100">
            {content.cover_welcome}
          </p>
        )}

        {/* Cover Heading / Subtitle */}
        {content.cover_heading && (
          <p className="font-ui text-xs uppercase tracking-wider-luxe text-white/70 mb-4 animate-fade-in opacity-0-init delay-200">
            {content.cover_heading}
          </p>
        )}

        {/* Couple Names */}
        <h1 className="font-script text-4xl md:text-6xl text-white mb-2 animate-fade-in-up opacity-0-init delay-200">
          {wedding.couple_name_one}
        </h1>
        <p className="font-script text-2xl md:text-3xl text-white/50 mb-2 animate-fade-in-up opacity-0-init delay-300">
          &
        </p>
        <h1 className="font-script text-4xl md:text-6xl text-white mb-8 animate-fade-in-up opacity-0-init delay-400">
          {wedding.couple_name_two}
        </h1>

        {/* Date */}
        {wedding.wedding_date && (
          <p className="font-ui text-xs uppercase tracking-luxe text-white/80 mb-8 animate-fade-in opacity-0-init delay-500">
            {formatDate(wedding.wedding_date, lang)}
          </p>
        )}

        {/* Countdown Timer */}
        {!countdown.isPast && (
          <div className="flex gap-4 md:gap-8 mb-10 animate-fade-in-up opacity-0-init delay-700">
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <div key={unit} className="text-center">
                <div className="font-heading text-2xl md:text-4xl text-white mb-1">
                  {String(countdown[unit]).padStart(2, "0")}
                </div>
                <div className="font-ui text-[10px] uppercase tracking-wider-luxe text-white/60">
                  {t_unit(unit, lang)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enter Website Button */}
        <div className="animate-fade-in-up opacity-0-init delay-1000">
          <Button
            variant="outline"
            size="lg"
            onClick={handleEnter}
            className="border-white/60 text-white hover:bg-white hover:text-black"
          >
            {content.cover_button_text || (lang === "ms" ? "Masuk Laman Web" : "Enter Website")}
          </Button>
        </div>
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

export default Cover;
