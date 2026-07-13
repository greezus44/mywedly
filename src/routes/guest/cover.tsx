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
import { getCountdown, formatDate, getDeviceType } from "../../lib/utils";
import { ArrowRight } from "lucide-react";

export function Cover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signInWithToken } = useGuestAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("weddings")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setWedding(data as Wedding);
        setLoading(false);
      });
  }, [slug]);

  // Track visit
  useEffect(() => {
    if (!wedding) return;
    supabase.from("sharing_events").insert({
      wedding_id: wedding.id,
      event_type: "visit",
      device_type: getDeviceType(),
    }).then(() => {});
  }, [wedding]);

  // Handle QR token login via ?t=token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("t");
    if (!token || !wedding) return;
    signInWithToken(token).then(({ error }) => {
      if (!error) {
        navigate(`/w/${slug}/home`, { replace: true });
      }
    });
  }, [wedding, slug, signInWithToken, navigate]);

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
    if (cover.background.type !== "slideshow" || !cover.background.slideshow_urls?.length) return;
    const id = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % cover.background.slideshow_urls.length);
    }, 5000);
    return () => clearInterval(id);
  }, [cover.background.type, cover.background.slideshow_urls]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  const theme = getTheme(wedding);
  const bg = cover.background;
  const logo = cover.branding.logo;
  const logoPos = getLogoPositionClasses(logo.position);
  const device = getDeviceType();

  const bgStyle: React.CSSProperties = {};
  if (bg.type === "image" && bg.image_url) {
    bgStyle.backgroundImage = `url(${bg.image_url})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else if (bg.type === "color") {
    bgStyle.background = bg.color;
  } else if (bg.type === "slideshow" && bg.slideshow_urls?.length) {
    bgStyle.backgroundImage = `url(${bg.slideshow_urls[slideIndex]})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
    bgStyle.transition = "background-image 1s ease-in-out";
  }

  const alignmentClass =
    cover.layout.content_alignment === "left"
      ? "items-start text-left"
      : cover.layout.content_alignment === "right"
      ? "items-end text-right"
      : "items-center text-center";

  const vPosClass =
    cover.layout.vertical_position === "top"
      ? "justify-start"
      : cover.layout.vertical_position === "bottom"
      ? "justify-end"
      : "justify-center";

  const enterUrl = slug ? `/w/${slug}/login` : "/";

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{
        ...themeToCssVars(theme),
        ...coverToCssVars(cover),
        ...bgStyle,
        filter: `brightness(${cover.brightness}) blur(${cover.blur})`,
      } as React.CSSProperties}
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

      {/* Overlay */}
      {cover.overlay.enabled && (
        <div
          className="absolute inset-0"
          style={{
            background: cover.overlay.color,
            opacity: cover.overlay.opacity,
          }}
        />
      )}

      {/* Content */}
      <div
        className={`relative z-10 flex min-h-screen flex-col p-6 md:p-10 ${vPosClass} ${alignmentClass}`}
        style={{ maxWidth: cover.layout.max_width, margin: "0 auto", width: "100%" }}
      >
        {/* Logo */}
        {logo.url && logo.visible && (
          <div className={`flex w-full ${logoPos.container} animate-fade-in`} style={{ padding: logo.padding }}>
            <div className={logoPos.item} style={{ transform: `translate(${logo.offsetX}, ${logo.offsetY})` }}>
              <img src={logo.url} alt="logo" style={getLogoStyle(logo, device)} />
            </div>
          </div>
        )}

        {/* Couple names */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
          <h1
            className="font-heading"
            style={{
              color: "var(--cover-text)",
              fontSize: cover.typography.heading_size,
              fontWeight: cover.typography.heading_weight,
              letterSpacing: cover.typography.letter_spacing,
            }}
          >
            {cover.branding.couple_name_one || wedding?.couple_name_one || ""}
          </h1>
          <p className="my-2 font-script text-3xl md:text-4xl" style={{ color: "var(--cover-body-color)" }}>
            &
          </p>
          <h1
            className="font-heading"
            style={{
              color: "var(--cover-text)",
              fontSize: cover.typography.heading_size,
              fontWeight: cover.typography.heading_weight,
              letterSpacing: cover.typography.letter_spacing,
            }}
          >
            {cover.branding.couple_name_two || wedding?.couple_name_two || ""}
          </h1>
        </div>

        {/* Date */}
        {cover.show_date && (cover.branding.date || wedding?.wedding_date) && (
          <p
            className="mt-4 animate-fade-in-up font-body"
            style={{
              color: "var(--cover-body-color)",
              fontSize: cover.typography.body_size,
              animationDelay: "0.4s",
              opacity: 0,
            }}
          >
            {cover.branding.date || formatDate(wedding?.wedding_date || null)}
          </p>
        )}

        {/* Countdown */}
        {cover.show_countdown && !countdown.isPast && (
          <div
            className="mt-8 flex animate-fade-in-up gap-6 md:gap-10"
            style={{ animationDelay: "0.6s", opacity: 0 }}
          >
            {(["days", "hours", "minutes", "seconds"] as const).map((k) => (
              <div key={k} className="text-center">
                <div
                  className="font-heading text-3xl md:text-4xl"
                  style={{ color: "var(--cover-text)" }}
                >
                  {countdown[k]}
                </div>
                <div
                  className="mt-1 text-xs uppercase tracking-widest"
                  style={{ color: "var(--cover-body-color)" }}
                >
                  {k}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enter button */}
        <button
          onClick={() => navigate(enterUrl)}
          className="mt-10 animate-fade-in-up font-body transition-transform hover:scale-105"
          style={{
            background: cover.button.bg_color,
            color: cover.button.text_color,
            borderRadius: cover.button.border_radius,
            padding: `${cover.button.padding_y} ${cover.button.padding_x}`,
            animationDelay: "0.8s",
            opacity: 0,
          }}
        >
          <span className="inline-flex items-center gap-2">
            {cover.enter_button_text || "Enter Website"}
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </div>
    </div>
  );
}

export default Cover;
