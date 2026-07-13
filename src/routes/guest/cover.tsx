import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import {
  themeToCssVars,
  coverToCssVars,
  getTheme,
  getCoverConfig,
  getLogoStyle,
  getLogoPositionClasses,
} from "../../lib/theme";
import { getCountdown, getDeviceType } from "../../lib/utils";
import { ArrowRight } from "lucide-react";

export function Cover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signInWithToken } = useGuestAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });
  const [slideIndex, setSlideIndex] = useState(0);

  // Fetch wedding + handle QR token
  useEffect(() => {
    if (!slug) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("t");

    supabase.from("weddings").select("*").eq("slug", slug).maybeSingle().then(async ({ data }) => {
      if (data) {
        setWedding(data as Wedding);
        // Track visit
        supabase.from("sharing_events").insert({
          wedding_id: (data as Wedding).id,
          event_type: "visit",
          device_type: getDeviceType(),
        }).then(() => {});
        // QR token login
        if (token) {
          const { error } = await signInWithToken(token);
          if (!error) {
            navigate(`/w/${slug}/home`, { replace: true });
            return;
          }
        }
      }
      setLoading(false);
    });
  }, [slug, navigate, signInWithToken]);

  // Countdown
  useEffect(() => {
    if (!wedding?.wedding_date) return;
    const tick = () => setCountdown(getCountdown(wedding.wedding_date));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [wedding?.wedding_date]);

  // Slideshow
  const cover = getCoverConfig(wedding);
  useEffect(() => {
    if (cover.background.type !== "slideshow" || cover.background.slideshow_urls.length <= 1) return;
    const id = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % cover.background.slideshow_urls.length);
    }, 5000);
    return () => clearInterval(id);
  }, [cover.background.type, cover.background.slideshow_urls.length]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: cover.background.color }}>
        <div className="animate-pulse text-sm font-light tracking-widest uppercase text-white/60">Loading...</div>
      </div>
    );
  }

  const theme = getTheme(wedding);
  const bg = cover.background;
  const logo = cover.branding.logo;
  const device = getDeviceType();
  const pos = getLogoPositionClasses(logo.position || "top-center");

  const bgStyle: React.CSSProperties = {};
  if (bg.type === "image" && bg.image_url) {
    bgStyle.backgroundImage = `url(${bg.image_url})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else if (bg.type === "color") {
    bgStyle.background = bg.color;
  }

  const vPosClass = cover.layout.vertical_position === "top" ? "justify-start" : cover.layout.vertical_position === "bottom" ? "justify-end" : "justify-center";
  const alignClass = cover.layout.content_alignment === "left" ? "items-start text-left" : cover.layout.content_alignment === "right" ? "items-end text-right" : "items-center text-center";

  const handleEnter = () => {
    if (slug) navigate(`/w/${slug}/login`);
  };

  const countdownKeys = ["days", "hours", "minutes", "seconds"] as const;

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover), ...bgStyle, filter: `brightness(${cover.brightness}) blur(${cover.blur})` } as React.CSSProperties}
    >
      {/* Video background */}
      {bg.type === "video" && bg.video_url && (
        <video
          src={bg.video_url}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Slideshow background */}
      {bg.type === "slideshow" && bg.slideshow_urls.length > 0 && (
        <div className="absolute inset-0">
          {bg.slideshow_urls.map((url, i) => (
            <div
              key={i}
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
              style={{
                backgroundImage: `url(${url})`,
                opacity: i === slideIndex ? 1 : 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Overlay */}
      {cover.overlay.enabled && (
        <div
          className="absolute inset-0"
          style={{ background: cover.overlay.color, opacity: cover.overlay.opacity }}
        />
      )}

      {/* Content */}
      <div
        className={`relative z-10 flex min-h-screen flex-col p-6 ${vPosClass} ${alignClass}`}
        style={{ maxWidth: cover.layout.max_width, margin: "0 auto", width: "100%", padding: cover.layout.padding }}
      >
        {/* Logo */}
        {logo.visible && logo.url && (
          <div className={`flex w-full ${pos.container} animate-fade-in`}>
            <div className={pos.item} style={{ transform: `translate(${logo.offsetX}, ${logo.offsetY})` }}>
              <img src={logo.url} alt="logo" style={getLogoStyle(logo, device)} />
            </div>
          </div>
        )}

        {/* Couple names */}
        <h1
          className="mt-4 animate-fade-in-up font-heading"
          style={{
            color: cover.typography.heading_color,
            fontSize: cover.typography.heading_size,
            fontWeight: cover.typography.heading_weight,
            letterSpacing: cover.typography.letter_spacing,
            animationDelay: "0.1s",
          }}
        >
          {cover.branding.couple_name_one || wedding?.couple_name_one || ""}
        </h1>

        <p className="my-2 animate-fade-in-up font-script text-3xl" style={{ color: cover.typography.body_color, animationDelay: "0.2s" }}>
          &
        </p>

        <h1
          className="animate-fade-in-up font-heading"
          style={{
            color: cover.typography.heading_color,
            fontSize: cover.typography.heading_size,
            fontWeight: cover.typography.heading_weight,
            letterSpacing: cover.typography.letter_spacing,
            animationDelay: "0.3s",
          }}
        >
          {cover.branding.couple_name_two || wedding?.couple_name_two || ""}
        </h1>

        {/* Date */}
        {cover.show_date && (cover.branding.date || wedding?.wedding_date) && (
          <p
            className="mt-4 animate-fade-in-up font-body"
            style={{ color: cover.typography.body_color, fontSize: cover.typography.body_size, animationDelay: "0.4s" }}
          >
            {cover.branding.date || wedding?.wedding_date}
          </p>
        )}

        {/* Countdown */}
        {cover.show_countdown && !countdown.isPast && (
          <div className="mt-8 flex animate-fade-in-up gap-6 md:gap-10" style={{ animationDelay: "0.5s" }}>
            {countdownKeys.map((k) => (
              <div key={k} className="text-center">
                <div
                  className="font-heading text-2xl md:text-4xl"
                  style={{ color: cover.typography.heading_color }}
                >
                  {String(countdown[k]).padStart(2, "0")}
                </div>
                <div
                  className="mt-1 text-[0.625rem] uppercase tracking-widest md:text-xs"
                  style={{ color: cover.typography.body_color }}
                >
                  {k}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enter button */}
        <button
          onClick={handleEnter}
          className="mt-10 flex animate-fade-in-up items-center gap-2 font-body transition hover:scale-105"
          style={{
            background: cover.button.bg_color,
            color: cover.button.text_color,
            borderRadius: cover.button.border_radius,
            padding: `${cover.button.padding_y} ${cover.button.padding_x}`,
            animationDelay: "0.6s",
          }}
        >
          {cover.enter_button_text || "Enter Website"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default Cover;
