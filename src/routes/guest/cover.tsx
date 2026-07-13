import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, getTheme, getCoverContent } from "../../lib/theme";
import { getCountdown, formatDate } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

export function Cover() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error: err } = await supabase
        .from("weddings")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (!active) return;
      if (err || !data) { setError("Wedding not found"); setLoading(false); return; }
      setWedding(data as Wedding);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [slug]);

  const [countdown, setCountdown] = useState(getCountdown(wedding?.wedding_date ?? null));
  useEffect(() => {
    if (!wedding?.wedding_date) return;
    const id = setInterval(() => setCountdown(getCountdown(wedding.wedding_date)), 1000);
    return () => clearInterval(id);
  }, [wedding?.wedding_date]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-[#d4b85c] font-ui text-sm uppercase tracking-wider-luxe">
        {t("loading")}
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-white font-body text-lg">
        {error || "Wedding not found"}
      </div>
    );
  }

  const theme = getTheme(wedding);
  const content = getCoverContent(wedding);
  const bgUrl = content.cover_background_url || wedding.hero_image_url || null;
  const isVideo = content.cover_background_type === "video" && bgUrl;
  const logoUrl = content.cover_logo_url || wedding.cover_monogram_url || null;
  const welcome = content.cover_welcome || t("welcome");
  const heading = content.cover_heading || "";
  const subtitle = content.cover_subtitle || "";
  const buttonText = content.cover_button_text || t("enterWebsite");

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={themeToCssVars(theme) as React.CSSProperties}>
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {isVideo ? (
          <video src={bgUrl!} autoPlay loop muted playsInline className="w-full h-full object-cover" />
        ) : bgUrl ? (
          <img src={bgUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] via-[#2a2418] to-[#1a1a1a]" />
        )}
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* Language toggle */}
      <button
        onClick={() => setLang(lang === "en" ? "ms" : "en")}
        className="absolute top-6 right-6 z-20 px-4 py-2 font-ui text-xs uppercase tracking-wider-luxe text-white/90 border border-white/40 rounded-lg hover:bg-white/10 transition-all"
        style={{ borderRadius: "var(--button-radius, 8px)" }}
      >
        {lang === "en" ? "EN" : "MS"}
      </button>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 max-w-3xl">
        {logoUrl && (
          <img src={logoUrl} alt="monogram" className="w-20 h-20 object-contain mb-8 opacity-0-init animate-fade-in" />
        )}

        <p className="font-ui text-xs md:text-sm uppercase tracking-luxe text-white/80 mb-6 opacity-0-init animate-fade-in-up delay-100">
          {welcome}
        </p>

        <div className="mb-6 opacity-0-init animate-fade-in-up delay-200">
          <h1 className="font-script text-5xl md:text-7xl text-white leading-tight">
            {wedding.couple_name_one}
          </h1>
          <p className="font-script text-2xl md:text-3xl text-[#d4b85c] my-2">&</p>
          <h1 className="font-script text-5xl md:text-7xl text-white leading-tight">
            {wedding.couple_name_two}
          </h1>
        </div>

        {heading && (
          <p className="font-heading text-lg md:text-xl text-white/90 mb-2 opacity-0-init animate-fade-in-up delay-300">
            {heading}
        </p>
        )}

        {wedding.wedding_date && (
          <p className="font-ui text-xs md:text-sm uppercase tracking-wider-luxe text-white/80 mb-2 opacity-0-init animate-fade-in-up delay-300">
            {formatDate(wedding.wedding_date, lang)}
          </p>
        )}

        {subtitle && (
          <p className="font-heading text-base text-white/70 mb-8 opacity-0-init animate-fade-in-up delay-400">
            {subtitle}
        </p>
        )}

        {wedding.wedding_date && !countdown.isPast && (
          <div className="flex gap-4 md:gap-8 mb-10 opacity-0-init animate-fade-in-up delay-500">
            {[
              { value: countdown.days, label: t("days") },
              { value: countdown.hours, label: t("hours") },
              { value: countdown.minutes, label: t("minutes") },
              { value: countdown.seconds, label: t("seconds") },
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center">
                <span className="font-script text-3xl md:text-4xl text-white tabular-nums">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="font-ui text-[10px] uppercase tracking-wider-luxe text-white/60 mt-1">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="opacity-0-init animate-fade-in-up delay-700">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(`/w/${slug}/login`)}
            className="text-white border-white/60 hover:bg-white hover:text-[#1a1a1a]"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Cover;
