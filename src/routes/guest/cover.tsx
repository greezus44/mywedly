import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, ChevronDown } from "lucide-react";
import { supabase, type Wedding } from "@/lib/supabase";
import { getTheme, getCoverContent, themeToCssVars } from "@/lib/theme";
import { daysUntil, formatDate, cn } from "@/lib/utils";

export function GuestCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    supabase
      .from("weddings")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setWedding((data as Wedding) ?? null);
        setLoading(false);
      });
  }, [slug]);

  // Parallax scroll effect
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const theme = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  const content = useMemo(() => getCoverContent(wedding), [wedding]);

  const bgUrl = content.cover_background_url || wedding?.hero_image_url;
  const videoUrl = content.cover_background_video_url;
  const overlay = content.cover_overlay_opacity ?? 0.3;
  const textAlign = content.cover_text_align ?? "center";
  const logoVisible = content.cover_logo_visible !== false;
  const logoUrl = content.cover_logo_url;
  const logoSize = content.cover_logo_size ?? "80px";
  const logoPos = content.cover_logo_position ?? "center";
  const countdownEnabled = content.cover_countdown_enabled !== false;
  const heading =
    content.cover_heading ||
    (wedding ? `${wedding.couple_name_one} & ${wedding.couple_name_two}` : "");
  const subtitle = content.cover_subtitle;
  const welcome = content.cover_welcome;
  const buttonText = content.cover_button_text || "Enter Website";
  const mainHeading = content.cover_main_heading;
  const dUntil = daysUntil(wedding?.wedding_date ?? null);

  const alignClass =
    textAlign === "left"
      ? "items-start text-left"
      : textAlign === "right"
        ? "items-end text-right"
        : "items-center text-center";

  const logoAlign =
    logoPos === "left"
      ? "self-start"
      : logoPos === "right"
        ? "self-end"
        : "self-center";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-onyx">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-sm text-white/60" style={{ fontFamily: "var(--f-body, sans-serif)" }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-onyx text-center px-6">
        <div>
          <h1 className="font-serif text-3xl text-white mb-3">Wedding Not Found</h1>
          <p className="text-white/60 text-sm">The wedding you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={cssVars as React.CSSProperties}
    >
      {/* ─── Background layer (parallax) ─── */}
      <div
        className="absolute inset-0 z-0"
        style={{ transform: `translateY(${scrollY * 0.4}px)`, willChange: "transform" }}
      >
        {videoUrl ? (
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : bgUrl ? (
          <img
            src={bgUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: `scale(1.1)` }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, var(--c-secondary), var(--c-accent))`,
            }}
          />
        )}
      </div>

      {/* ─── Overlay ─── */}
      <div
        className="absolute inset-0 z-10"
        style={{ background: `rgba(0,0,0,${overlay})` }}
      />

      {/* ─── Content ─── */}
      <div
        className={cn(
          "relative z-20 flex flex-col justify-center min-h-screen px-6 py-20",
          alignClass,
          mounted && "animate-fade-in"
        )}
        style={{ maxWidth: "640px", margin: textAlign === "center" ? "0 auto" : textAlign === "right" ? "0 0 0 auto" : "0 auto 0 0" }}
      >
        {/* Logo / monogram */}
        {logoVisible && logoUrl && (
          <img
            src={logoUrl}
            alt="monogram"
            className={cn("mb-6", logoAlign)}
            style={{ width: logoSize, maxWidth: "120px", height: "auto" }}
          />
        )}

        {/* Main heading (e.g. "We're getting married") */}
        {mainHeading && (
          <p
            className="text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: "rgba(255,255,255,0.8)", fontFamily: "var(--f-body)" }}
          >
            {mainHeading}
          </p>
        )}

        {/* Couple names in script font */}
        <h1
          className="font-script leading-tight mb-3"
          style={{
            color: "white",
            fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
            fontFamily: "var(--f-heading)",
            fontStyle: "var(--f-style)",
            textShadow: "0 2px 20px rgba(0,0,0,0.3)",
          }}
        >
          {heading}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p
            className="text-base mb-4"
            style={{ color: "rgba(255,255,255,0.85)", fontFamily: "var(--f-body)" }}
          >
            {subtitle}
          </p>
        )}

        {/* Wedding date */}
        {wedding.wedding_date && (
          <div
            className="flex items-center gap-2 mb-2"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm" style={{ fontFamily: "var(--f-body)" }}>
              {formatDate(wedding.wedding_date)}
            </span>
          </div>
        )}

        {/* Location */}
        {wedding.location && (
          <div
            className="flex items-center gap-2 mb-4"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm" style={{ fontFamily: "var(--f-body)" }}>
              {wedding.location}
            </span>
          </div>
        )}

        {/* Welcome message */}
        {welcome && (
          <p
            className="text-sm max-w-md mb-6 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.8)", fontFamily: "var(--f-body)" }}
          >
            {welcome}
          </p>
        )}

        {/* Countdown timer */}
        {countdownEnabled && dUntil !== null && dUntil > 0 && (
          <div
            className="mb-6 inline-flex items-baseline gap-2 px-5 py-2.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "white",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="text-2xl font-serif"
              style={{ fontFamily: "var(--f-heading)" }}
            >
              {dUntil}
            </span>
            <span className="text-xs uppercase tracking-widest" style={{ fontFamily: "var(--f-body)" }}>
              days to go
            </span>
          </div>
        )}

        {/* Enter Website button */}
        <button
          onClick={() => navigate(`/w/${slug}/signin`)}
          className="group inline-flex items-center gap-2 px-8 py-3 text-sm font-medium tracking-wide transition-all duration-300 hover:scale-105"
          style={{
            background: "rgba(255,255,255,0.95)",
            color: "var(--c-text)",
            borderRadius: "var(--ui-radius)",
            fontFamily: "var(--f-body)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          {buttonText}
          <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
        </button>
      </div>

      {/* ─── Scroll indicator ─── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <ChevronDown className="w-6 h-6 text-white/50" />
      </div>
    </div>
  );
}
