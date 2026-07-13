import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Menu } from "lucide-react";
import { supabase, type Wedding } from "../../lib/supabase";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, coverToCssVars, getCoverContent, getTheme, getCoverConfig, getLogoConfig, getLogoStyle, getLogoPositionClasses, DEFAULT_COVER_CONFIG } from "../../lib/theme";
import { getCountdown, formatDate, getDeviceType, cn } from "../../lib/utils";

export function Cover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();
  const { signInWithToken } = useGuestAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      // Handle QR token login via ?t=token
      const params = new URLSearchParams(window.location.search);
      const token = params.get("t");
      if (token) {
        const { error } = await signInWithToken(token);
        if (error) { if (active) setTokenError(error); }
        else { if (active) navigate(`/w/${slug}/home`, { replace: true }); return; }
      }
      // Fetch wedding by slug
      const { data, error } = await supabase.from("weddings").select("*").eq("slug", slug).eq("is_published", true).single();
      if (active) {
        if (error || !data) { setWedding(null); }
        else { setWedding(data as Wedding); }
        setLoading(false);
      }
      // Track visit
      if (data) {
        await supabase.from("sharing_events").insert({
          wedding_id: (data as Wedding).id,
          event_type: "visit",
          device_type: getDeviceType(),
        });
      }
    })();
    return () => { active = false; };
  }, [slug]);

  // Slideshow rotation
  const slideshowUrls = useMemo(() => {
    if (!wedding) return [];
    const cover = getCoverConfig(wedding);
    return cover.background?.slideshowUrls?.filter(Boolean) || [];
  }, [wedding]);

  useEffect(() => {
    if (slideshowUrls.length <= 1) return;
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slideshowUrls.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slideshowUrls.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="font-ui text-sm uppercase tracking-wider-luxe text-white/60 animate-pulse">{t("loading")}</div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] px-6">
        <div className="text-center">
          <h1 className="font-script text-3xl text-white mb-4">Wedding Not Found</h1>
          <p className="font-body text-white/60">The invitation you are looking for does not exist or has not been published.</p>
        </div>
      </div>
    );
  }

  const theme = getTheme(wedding);
  const cover = getCoverConfig(wedding);
  const content = getCoverContent(wedding);
  const logo = getLogoConfig(wedding);
  const device = getDeviceType();

  const bg = cover.background || {};
  const bgType = bg.type || "image";
  const imageUrl = bg.imageUrl || content.cover_background_url || wedding.hero_image_url;
  const videoUrl = bg.videoUrl;
  const overlayColor = cover.colors?.overlayColor || "#000000";
  const overlayOpacity = cover.colors?.overlayOpacity ?? 0.4;
  const blur = bg.blur || 0;
  const brightness = bg.brightness || 100;
  const headingFont = cover.typography?.headingFont || "Playfair Display";
  const headingSize = cover.typography?.headingSize || "3rem";
  const letterSpacing = cover.typography?.letterSpacing || "0.15em";
  const contentAlign = cover.layout?.contentAlignment || "center";
  const verticalPos = cover.layout?.verticalPosition || "center";
  const buttonStyle = cover.layout?.buttonStyle || "outline";
  const borderRadius = cover.layout?.borderRadius || "8px";
  const spacing = cover.layout?.spacing || "1.5rem";
  const coverText = cover.colors?.text || "#ffffff";
  const coverButton = cover.colors?.buttonColor || "#b8973a";
  const coverButtonText = cover.colors?.buttonTextColor || "#ffffff";

  const countdown = getCountdown(wedding.wedding_date);
  const coupleOne = content.cover_heading || `${wedding.couple_name_one} & ${wedding.couple_name_two}`;
  const dateStr = formatDate(wedding.wedding_date, lang);
  const buttonText = content.cover_button_text || t("enterWebsite");

  const alignClass = contentAlign === "left" ? "text-left items-start" : contentAlign === "right" ? "text-right items-end" : "text-center items-center";
  const verticalClass = verticalPos === "top" ? "justify-start pt-20" : verticalPos === "bottom" ? "justify-end pb-20" : "justify-center";

  const logoPos = getLogoPositionClasses(logo.position);
  const showLogo = logo.visible && logo.url;

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover), background: cover.colors?.background || "#1a1a1a" } as React.CSSProperties}
    >
      {/* Background layer */}
      <div className="absolute inset-0 z-0">
        {bgType === "video" && videoUrl ? (
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: `blur(${blur}px) brightness(${brightness}%)` }}
          />
        ) : bgType === "slideshow" && slideshowUrls.length > 0 ? (
          <div className="relative w-full h-full">
            {slideshowUrls.map((url, i) => (
              <div
                key={i}
                className="absolute inset-0 transition-opacity duration-1000"
                style={{
                  opacity: i === slideIndex ? 1 : 0,
                  backgroundImage: `url(${url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: `blur(${blur}px) brightness(${brightness}%)`,
                }}
              />
            ))}
          </div>
        ) : bgType === "color" ? (
          <div className="w-full h-full" style={{ background: cover.colors?.background || "#1a1a1a" }} />
        ) : imageUrl ? (
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: `blur(${blur}px) brightness(${brightness}%)`,
            }}
          />
        ) : (
          <div className="w-full h-full" style={{ background: cover.colors?.background || "#1a1a1a" }} />
        )}
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: bg.overlayGradient || overlayColor,
          opacity: bg.overlayGradient ? 1 : overlayOpacity,
        }}
      />

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-30">
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 font-ui text-xs uppercase tracking-wider-luxe rounded-lg backdrop-blur-md transition-all"
            style={{ color: coverText, background: "rgba(255,255,255,0.1)" }}
          >
            <span>{lang === "en" ? "EN" : "MS"}</span>
            <Menu size={12} />
          </button>
          {langOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white/95 backdrop-blur-md rounded-lg shadow-lg overflow-hidden min-w-[140px]">
              <button
                onClick={() => { setLang("en"); setLangOpen(false); }}
                className="block w-full text-left px-4 py-2 font-ui text-xs uppercase tracking-wider-luxe text-gray-700 hover:bg-gray-100 transition-colors"
              >
                English
              </button>
              <button
                onClick={() => { setLang("ms"); setLangOpen(false); }}
                className="block w-full text-left px-4 py-2 font-ui text-xs uppercase tracking-wider-luxe text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Bahasa Melayu
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn("relative z-20 min-h-screen flex flex-col px-6 py-12", verticalClass)}>
        <div className={cn("flex flex-col w-full max-w-2xl mx-auto", alignClass)} style={{ gap: spacing }}>
          {showLogo && (
            <div className={cn("flex", logoPos.container)}>
              <img
                src={logo.url!}
                alt="Logo"
                style={getLogoStyle(logo, device)}
                className={cn("animate-fade-in", logoPos.item)}
              />
            </div>
          )}

          {/* Bismillah */}
          {content.cover_welcome && (
            <p
              className="font-body animate-fade-in opacity-0-init delay-100"
              style={{ color: coverText, fontSize: "1rem", letterSpacing: letterSpacing }}
            >
              {content.cover_welcome}
            </p>
          )}

          {/* Couple names */}
          <h1
            className="font-script animate-fade-in-up opacity-0-init delay-200"
            style={{
              color: coverText,
              fontFamily: `"${headingFont}", serif`,
              fontSize: headingSize,
              lineHeight: 1.2,
            }}
          >
            {coupleOne}
          </h1>

          {/* Subtitle */}
          {content.cover_subtitle && (
            <p
              className="font-body animate-fade-in opacity-0-init delay-300"
              style={{ color: coverText, fontSize: "1.125rem", letterSpacing: letterSpacing, opacity: 0.85 }}
            >
              {content.cover_subtitle}
            </p>
          )}

          {/* Date */}
          {dateStr && (
            <p
              className="font-ui animate-fade-in-up opacity-0-init delay-400 uppercase"
              style={{ color: coverText, fontSize: "0.875rem", letterSpacing: letterSpacing }}
            >
              {dateStr}
            </p>
          )}

          {/* Countdown */}
          {!countdown.isPast && content.countdown_enabled !== false && (
            <div className="flex gap-4 md:gap-8 animate-fade-in-up opacity-0-init delay-500">
              {[
                { label: t("days"), value: countdown.days },
                { label: t("hours"), value: countdown.hours },
                { label: t("minutes"), value: countdown.minutes },
                { label: t("seconds"), value: countdown.seconds },
              ].map((unit) => (
                <div key={unit.label} className="text-center">
                  <div className="font-script text-2xl md:text-3xl" style={{ color: coverText }}>
                    {String(unit.value).padStart(2, "0")}
                  </div>
                  <div className="font-ui text-[0.625rem] uppercase tracking-wider-luxe" style={{ color: coverText, opacity: 0.7 }}>
                    {unit.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Enter button */}
          <div className="animate-fade-in-up opacity-0-init delay-700 mt-2">
            <button
              onClick={() => navigate(`/w/${slug}/login`)}
              className="font-ui text-xs uppercase tracking-wider-luxe px-8 py-3.5 transition-all duration-300 cursor-pointer hover:scale-105"
              style={{
                background: buttonStyle === "solid" ? coverButton : "transparent",
                color: buttonStyle === "solid" ? coverButtonText : coverText,
                border: buttonStyle === "underline" ? "none" : `1px solid ${coverText}`,
                borderBottom: buttonStyle === "underline" ? `1px solid ${coverText}` : undefined,
                borderRadius: buttonStyle === "underline" ? "0" : borderRadius,
              }}
            >
              {buttonText}
            </button>
          </div>

          {tokenError && (
            <p className="font-ui text-xs text-red-300 mt-2">{tokenError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Cover;
