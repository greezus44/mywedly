import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Wedding } from "@/lib/supabase";
import { getTheme, getCoverContent, themeToCssVars } from "@/lib/theme";
import { daysUntil, formatDate, cn } from "@/lib/utils";

export function GuestCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  // ── Fetch wedding by slug ──
  useEffect(() => {
    if (!slug) return;
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

  // ── Parallax scroll listener ──
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const theme = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  const content = useMemo(() => getCoverContent(wedding), [wedding]);

  const bgUrl = content.cover_background_url || wedding?.hero_image_url || null;
  const videoUrl = content.cover_background_video_url || null;
  const overlay = content.cover_overlay_opacity ?? 0.3;
  const textAlign = content.cover_text_align ?? "center";
  const logoVisible = content.cover_logo_visible !== false;
  const logoUrl = content.cover_logo_url || null;
  const logoSize = content.cover_logo_size ?? "80px";
  const logoPos = content.cover_logo_position ?? "center";
  const countdownEnabled = content.cover_countdown_enabled !== false;
  const heading = content.cover_heading || (wedding ? `${wedding.couple_name_one} & ${wedding.couple_name_two}` : "");
  const subtitle = content.cover_subtitle || null;
  const welcome = content.cover_welcome || null;
  const buttonText = content.cover_button_text || "Enter Website";
  const mainHeading = content.cover_main_heading || null;
  const dUntil = daysUntil(wedding?.wedding_date ?? null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-background, #fdfcf9)" }}>
        <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--c-textMuted, #8c7e6a)", fontFamily: "var(--f-body, sans-serif)" }}>
          Loading…
        </p>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-background, #fdfcf9)" }}>
        <div className="text-center px-6">
          <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--f-heading, serif)" }}>Wedding Not Found</h1>
          <p className="text-sm" style={{ color: "var(--c-textMuted, #8c7e6a)", fontFamily: "var(--f-body, sans-serif)" }}>
            We couldn't find the wedding you're looking for.
          </p>
        </div>
      </div>
    );
  }

  const alignClass = textAlign === "left" ? "items-start text-left" : textAlign === "right" ? "items-end text-right" : "items-center text-center";
  const logoAlign = logoPos === "left" ? "self-start" : logoPos === "right" ? "self-end" : "self-center";

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={cssVars as React.CSSProperties}
    >
      {/* ── Background layer with parallax ── */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translateY(${scrollY * 0.4}px) scale(1.1)` }}
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
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, var(--c-secondary), var(--c-accent))" }}
          />
        )}
      </div>

      {/* ── Overlay ── */}
      <div
        className="absolute inset-0"
        style={{ background: `rgba(0,0,0,${overlay})` }}
      />

      {/* ── Content ── */}
      <div
        className={cn("relative z-10 flex flex-col justify-center min-h-screen px-6 py-20 animate-fade-in", alignClass)}
        style={{ maxWidth: "42rem", margin: "0 auto" }}
      >
        {logoVisible && logoUrl && (
          <img
            src={logoUrl}
            alt="monogram"
            className={cn("mb-6 animate-slide-up", logoAlign)}
            style={{ width: logoSize, maxWidth: "120px", height: "auto" }}
          />
        )}

        {mainHeading && (
          <p
            className="text-xs uppercase tracking-[0.3em] mb-4 animate-slide-up"
            style={{ color: "rgba(255,255,255,0.8)", fontFamily: "var(--f-body)", animationDelay: "0.1s", opacity: 0 }}
          >
            {mainHeading}
          </p>
        )}

        <h1
          className="leading-tight mb-3 animate-slide-up"
          style={{
            color: "white",
            fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
            fontFamily: "var(--f-heading)",
            fontStyle: "var(--f-style)",
            textShadow: "0 2px 20px rgba(0,0,0,0.3)",
            animationDelay: "0.2s",
            opacity: 0,
          }}
        >
          {heading}
        </h1>

        {subtitle && (
          <p
            className="text-base mb-4 animate-slide-up"
            style={{ color: "rgba(255,255,255,0.85)", fontFamily: "var(--f-body)", animationDelay: "0.3s", opacity: 0 }}
          >
            {subtitle}
          </p>
        )}

        <div
          className="flex items-center gap-2 mb-2 animate-slide-up"
          style={{ color: "rgba(255,255,255,0.9)", animationDelay: "0.4s", opacity: 0, justifyContent: textAlign === "left" ? "flex-start" : textAlign === "right" ? "flex-end" : "center" }}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-sm" style={{ fontFamily: "var(--f-body)" }}>
            {formatDate(wedding.wedding_date)}
          </span>
        </div>

        {wedding.location && (
          <div
            className="flex items-center gap-2 mb-5 animate-slide-up"
            style={{ color: "rgba(255,255,255,0.9)", animationDelay: "0.5s", opacity: 0, justifyContent: textAlign === "left" ? "flex-start" : textAlign === "right" ? "flex-end" : "center" }}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm" style={{ fontFamily: "var(--f-body)" }}>
              {wedding.location}
            </span>
          </div>
        )}

        {welcome && (
          <p
            className="text-sm max-w-md mb-6 animate-slide-up"
            style={{ color: "rgba(255,255,255,0.8)", fontFamily: "var(--f-body)", lineHeight: 1.7, animationDelay: "0.6s", opacity: 0, textAlign }}
          >
            {welcome}
          </p>
        )}

        {countdownEnabled && dUntil !== null && dUntil > 0 && (
          <div
            className="mb-6 inline-flex items-baseline gap-1 px-5 py-2.5 rounded-full animate-slide-up"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              color: "white",
              animationDelay: "0.7s",
              opacity: 0,
              alignSelf: textAlign === "left" ? "flex-start" : textAlign === "right" ? "flex-end" : "center",
            }}
          >
            <span className="text-2xl" style={{ fontFamily: "var(--f-heading)" }}>{dUntil}</span>
            <span className="text-xs ml-1" style={{ fontFamily: "var(--f-body)" }}>days to go</span>
          </div>
        )}

        <button
          onClick={() => navigate(`/w/${slug}/signin`)}
          className="px-8 py-3 text-sm font-medium tracking-wide transition-all duration-300 hover:scale-105 animate-slide-up"
          style={{
            background: "rgba(255,255,255,0.95)",
            color: "var(--c-text)",
            borderRadius: "var(--ui-radius)",
            fontFamily: "var(--f-body)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            animationDelay: "0.8s",
            opacity: 0,
            alignSelf: textAlign === "left" ? "flex-start" : textAlign === "right" ? "flex-end" : "center",
          }}
        >
          {buttonText}
        </button>
      </div>

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-1">
          <div className="w-1 h-2 rounded-full bg-white/70" />
        </div>
      </div>
    </div>
  );
}
