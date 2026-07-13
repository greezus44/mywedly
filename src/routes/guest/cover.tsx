import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Calendar, MapPin, ChevronDown } from "lucide-react";
import { supabase, type Wedding } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import {
  themeToCssVars,
  getTheme,
  coverToCssVars,
  getCoverConfig,
  getCoverContent,
  DEFAULT_COVER_CONFIG,
} from "../../lib/theme";
import { getCountdown, formatDate, getDeviceType } from "../../lib/utils";

function CoverInner() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const { signInWithToken } = useGuestAuth();

  const slug = params.slug || "";
  const token = searchParams.get("t");

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenProcessing, setTokenProcessing] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  // Fetch wedding by slug
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from("weddings")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (cancelled) return;
      if (err || !data) {
        setError("Wedding not found");
        setLoading(false);
        return;
      }
      setWedding(data as Wedding);
      setLoading(false);
      // Track visit
      try {
        await supabase.from("sharing_events").insert({
          wedding_id: (data as Wedding).id,
          event_type: "visit",
          device_type: getDeviceType(),
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Handle QR token login
  useEffect(() => {
    if (!token || !wedding) return;
    setTokenProcessing(true);
    (async () => {
      const { error: tErr } = await signInWithToken(token);
      if (tErr) {
        setError(tErr);
        setTokenProcessing(false);
        return;
      }
      navigate(`/w/${slug}/home`, { replace: true });
    })();
  }, [token, wedding, slug, signInWithToken, navigate]);

  // Slideshow rotation
  useEffect(() => {
    const cover = getCoverConfig(wedding);
    const urls = cover.background?.slideshowUrls || [];
    if (cover.background?.type !== "slideshow" || urls.length <= 1) return;
    const interval = setInterval(() => {
      setSlideIndex((i) => (i + 1) % urls.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [wedding]);

  const [countdown, setCountdown] = useState(getCountdown(wedding?.wedding_date ?? null));
  useEffect(() => {
    if (!wedding?.wedding_date) return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(wedding.wedding_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [wedding?.wedding_date]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--cover-bg, #1a1a1a)", color: "var(--cover-text, #fff)" } as CSSProperties}
      >
        <div className="font-script text-2xl animate-pulse" style={{ color: "var(--cover-text)" }}>
          {t("loading")}
        </div>
      </div>
    );
  }

  if (error && !wedding) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "#1a1a1a", color: "#fff" } as CSSProperties}
      >
        <div className="text-center">
          <p className="font-script text-2xl mb-2">{error}</p>
          <p className="font-ui text-sm uppercase tracking-wider-luxe opacity-60">Please check your link</p>
        </div>
      </div>
    );
  }

  const theme = getTheme(wedding);
  const cover = getCoverConfig(wedding);
  const content = getCoverContent(wedding);
  const bg = cover.background || DEFAULT_COVER_CONFIG.background!;
  const branding = cover.branding || DEFAULT_COVER_CONFIG.branding!;
  const colors = cover.colors || DEFAULT_COVER_CONFIG.colors!;
  const typo = cover.typography || DEFAULT_COVER_CONFIG.typography!;
  const layout = cover.layout || DEFAULT_COVER_CONFIG.layout!;

  const overlayStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    background: colors.overlayColor || "#000000",
    opacity: colors.overlayOpacity ?? 0.4,
    pointerEvents: "none",
    zIndex: 1,
  };

  const mediaStyle: CSSProperties = {
    filter: `blur(${bg.blur || 0}px) brightness(${bg.brightness || 100}%)`,
  };

  const renderBackground = () => {
    if (bg.type === "video" && bg.videoUrl) {
      return (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={mediaStyle}
          src={bg.videoUrl}
        />
      );
    }
    if (bg.type === "slideshow" && bg.slideshowUrls && bg.slideshowUrls.length > 0) {
      return (
        <div className="absolute inset-0 w-full h-full overflow-hidden" style={mediaStyle}>
          {bg.slideshowUrls.map((url, i) => (
            <div
              key={i}
              className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000"
              style={{
                backgroundImage: `url(${url})`,
                opacity: i === slideIndex ? 1 : 0,
              }}
            />
          ))}
        </div>
      );
    }
    if (bg.type === "image" && bg.imageUrl) {
      return (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${bg.imageUrl})`, ...mediaStyle }}
        />
      );
    }
    // Fallback: solid color
    return <div className="absolute inset-0 w-full h-full" style={{ background: colors.background || "#1a1a1a" }} />;
  };

  const alignmentClass =
    layout.contentAlignment === "left"
      ? "items-start text-left"
      : layout.contentAlignment === "right"
      ? "items-end text-right"
      : "items-center text-center";

  const verticalClass =
    layout.verticalPosition === "top"
      ? "justify-start pt-20"
      : layout.verticalPosition === "bottom"
      ? "justify-end pb-20"
      : "justify-center";

  const enterUrl = token ? `/w/${slug}/home` : `/w/${slug}/login`;
  const buttonText = content.cover_button_text || t("enterWebsite");

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover) } as CSSProperties}
    >
      {/* Background */}
      {renderBackground()}
      {/* Overlay */}
      <div style={overlayStyle} />

      {/* Content */}
      <div
        className={`relative z-10 min-h-screen flex flex-col ${verticalClass} ${alignmentClass} px-6 md:px-12`}
      >
        {/* Logo */}
        {branding.logoVisible && (branding.logoUrl || content.cover_logo_url || wedding?.cover_monogram_url) && (
          <div className="mb-6 animate-fade-in opacity-0-init delay-100">
            <img
              src={branding.logoUrl || content.cover_logo_url || wedding?.cover_monogram_url || ""}
              alt="logo"
              className="object-contain"
              style={{ maxHeight: branding.logoSize || "64px", maxWidth: "200px" }}
            />
          </div>
        )}

        {/* Divider */}
        {branding.divider === "line" && (
          <div
            className="mb-6 animate-fade-in opacity-0-init delay-200"
            style={{
              width: "60px",
              height: "1px",
              background: "var(--cover-text, #fff)",
              opacity: 0.5,
            }}
          />
        )}

        {/* Welcome / Subtitle */}
        {content.cover_welcome && (
          <p
            className="font-ui uppercase tracking-luxe text-sm md:text-base mb-4 animate-fade-in-up opacity-0-init delay-200"
            style={{ color: "var(--cover-text, #fff)", letterSpacing: typo.letterSpacing || "0.15em" }}
          >
            {content.cover_welcome}
          </p>
        )}

        {/* Couple Names */}
        <h1
          className="font-script animate-fade-in-up opacity-0-init delay-300"
          style={{
            fontFamily: "var(--cover-heading-font)",
            fontSize: "var(--cover-heading-size)",
            color: "var(--cover-text)",
            lineHeight: 1.2,
            marginBottom: "0.5rem",
          }}
        >
          {content.cover_heading || `${wedding?.couple_name_one} & ${wedding?.couple_name_two}`}
        </h1>

        {/* Subtitle */}
        {content.cover_subtitle && (
          <p
            className="font-body text-lg md:text-xl mb-6 animate-fade-in-up opacity-0-init delay-400"
            style={{ color: "var(--cover-text)", opacity: 0.85 }}
          >
            {content.cover_subtitle}
          </p>
        )}

        {/* Date */}
        {wedding?.wedding_date && (
          <div className="flex items-center gap-2 mb-2 animate-fade-in-up opacity-0-init delay-400">
            <Calendar size={16} style={{ color: "var(--cover-text)" }} />
            <p
              className="font-ui text-xs md:text-sm uppercase tracking-wider-luxe"
              style={{ color: "var(--cover-text)" }}
            >
              {formatDate(wedding.wedding_date, lang)}
            </p>
          </div>
        )}

        {/* Location */}
        {wedding?.location && (
          <div className="flex items-center gap-2 mb-6 animate-fade-in-up opacity-0-init delay-500">
            <MapPin size={16} style={{ color: "var(--cover-text)" }} />
            <p
              className="font-ui text-xs md:text-sm uppercase tracking-wider-luxe"
              style={{ color: "var(--cover-text)" }}
            >
              {wedding.location}
            </p>
          </div>
        )}

        {/* Countdown */}
        {!countdown.isPast && (
          <div className="flex gap-4 md:gap-8 mb-8 animate-fade-in-up opacity-0-init delay-500">
            {[
              { label: t("days"), value: countdown.days },
              { label: t("hours"), value: countdown.hours },
              { label: t("minutes"), value: countdown.minutes },
              { label: t("seconds"), value: countdown.seconds },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div
                  className="font-script text-2xl md:text-4xl"
                  style={{ color: "var(--cover-text)" }}
                >
                  {String(item.value).padStart(2, "0")}
                </div>
                <div
                  className="font-ui text-[10px] md:text-xs uppercase tracking-wider-luxe mt-1"
                  style={{ color: "var(--cover-text)", opacity: 0.7 }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enter Button */}
        <button
          onClick={() => navigate(enterUrl)}
          disabled={tokenProcessing}
          className="font-ui uppercase tracking-wider-luxe text-xs md:text-sm px-8 py-3.5 transition-all duration-300 hover:scale-105 animate-fade-in-up opacity-0-init delay-700 disabled:opacity-50"
          style={{
            background: layout.buttonStyle === "solid" ? "var(--cover-button)" : "transparent",
            color: layout.buttonStyle === "solid" ? "var(--cover-button-text)" : "var(--cover-text)",
            border: "1px solid var(--cover-button)",
            borderRadius: "var(--cover-radius, 8px)",
          }}
        >
          {tokenProcessing ? t("loading") : buttonText}
        </button>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-fade-in opacity-0-init delay-1000">
          <ChevronDown size={20} className="animate-bounce" style={{ color: "var(--cover-text)", opacity: 0.5 }} />
        </div>
      </div>
    </div>
  );
}

export function Cover() {
  return (
    <GuestAuthProvider>
      <CoverInner />
    </GuestAuthProvider>
  );
}

export default Cover;
