import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { coverToCssVars, getCoverConfig, getLogoStyle, getLogoPositionClasses } from "../../lib/theme";
import { getCountdown, formatDate, getDeviceType } from "../../lib/utils";
import { ArrowRight } from "lucide-react";

export function Cover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signInWithToken } = useGuestAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });
  const [slideshowIndex, setSlideshowIndex] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let tokenHandled = false;

    (async () => {
      // Check for QR token in URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get("t");
      if (token) {
        const { error } = await signInWithToken(token);
        if (!error) {
          tokenHandled = true;
          navigate(`/w/${slug}/home`, { replace: true });
          return;
        }
      }

      // Fetch wedding
      const { data } = await supabase.from("weddings").select("*").eq("slug", slug).maybeSingle();
      if (data) {
        setWedding(data as Wedding);
        // Track visit
        supabase.from("sharing_events").insert({
          wedding_id: (data as Wedding).id,
          event_type: "visit",
          device_type: getDeviceType(),
        }).then(() => {});
      }
      setLoading(false);
    })();

    return () => { tokenHandled = true; };
  }, [slug, signInWithToken, navigate]);

  useEffect(() => {
    if (!wedding?.wedding_date) return;
    const tick = () => setCountdown(getCountdown(wedding.wedding_date));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [wedding?.wedding_date]);

  // Slideshow rotation
  useEffect(() => {
    const cover = getCoverConfig(wedding);
    if (cover.background.type !== "slideshow" || cover.background.slideshow_urls.length <= 1) return;
    const id = setInterval(() => {
      setSlideshowIndex((prev) => (prev + 1) % cover.background.slideshow_urls.length);
    }, 5000);
    return () => clearInterval(id);
  }, [wedding]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-pulse text-white/40 text-sm tracking-widest uppercase">Loading...</div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center text-white/60">
          <p className="font-heading text-2xl mb-2">Invitation Not Found</p>
          <p className="text-sm">Please check your invitation link.</p>
        </div>
      </div>
    );
  }

  const cover = getCoverConfig(wedding);
  const bg = cover.background;
  const logo = cover.branding.logo;
  const logoPos = getLogoPositionClasses(logo.position);
  const device = getDeviceType();

  // Background style
  const bgStyle: React.CSSProperties = {};
  if (bg.type === "image" && bg.image_url) {
    bgStyle.backgroundImage = `url(${bg.image_url})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else if (bg.type === "color") {
    bgStyle.background = bg.color;
  } else if (bg.type === "slideshow" && bg.slideshow_urls.length > 0) {
    bgStyle.backgroundImage = `url(${bg.slideshow_urls[slideshowIndex]})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
    bgStyle.transition = "background-image 1.5s ease-in-out";
  }

  const vPosClass = cover.layout.vertical_position === "top" ? "justify-start" : cover.layout.vertical_position === "bottom" ? "justify-end" : "justify-center";
  const alignClass = cover.layout.content_alignment === "left" ? "items-start text-left" : cover.layout.content_alignment === "right" ? "items-end text-right" : "items-center text-center";

  const handleEnter = () => {
    navigate(`/w/${slug}/login`);
  };

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ ...coverToCssVars(cover), ...bgStyle, filter: `brightness(${cover.brightness}) blur(${cover.blur})` } as React.CSSProperties}
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
          style={{ background: cover.overlay.color, opacity: cover.overlay.opacity }}
        />
      )}

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col p-6 md:p-8 ${vPosClass} ${alignClass} animate-fade-in`}
        style={{ maxWidth: cover.layout.max_width, margin: "0 auto", width: "100%", padding: cover.layout.padding }}
      >
        {/* Logo */}
        {logo.visible && logo.url && (
          <div className={`flex w-full ${logoPos.container} mb-6`}>
            <div className={logoPos.item} style={{ transform: `translate(${logo.offsetX}, ${logo.offsetY})` }}>
              <img src={logo.url} alt="logo" style={getLogoStyle(logo, device)} />
            </div>
          </div>
        )}

        {/* Couple Names */}
        <h1
          className="font-heading leading-tight animate-fade-in-up"
          style={{
            color: cover.typography.heading_color,
            fontSize: cover.typography.heading_size,
            fontWeight: cover.typography.heading_weight,
            letterSpacing: cover.typography.letter_spacing,
            animationDelay: "0.1s",
          }}
        >
          {cover.branding.couple_name_one || wedding.couple_name_one}
        </h1>

        <p className="font-script text-3xl md:text-4xl my-2 animate-fade-in-up" style={{ color: cover.typography.body_color, animationDelay: "0.2s" }}>
          &
        </p>

        <h1
          className="font-heading leading-tight animate-fade-in-up"
          style={{
            color: cover.typography.heading_color,
            fontSize: cover.typography.heading_size,
            fontWeight: cover.typography.heading_weight,
            letterSpacing: cover.typography.letter_spacing,
            animationDelay: "0.3s",
          }}
        >
          {cover.branding.couple_name_two || wedding.couple_name_two}
        </h1>

        {/* Date */}
        {cover.show_date && (cover.branding.date || wedding.wedding_date) && (
          <p
            className="mt-5 font-body tracking-wider uppercase animate-fade-in-up"
            style={{ color: cover.typography.body_color, fontSize: cover.typography.body_size, animationDelay: "0.4s" }}
          >
            {cover.branding.date || formatDate(wedding.wedding_date)}
          </p>
        )}

        {/* Countdown */}
        {cover.show_countdown && !countdown.isPast && (
          <div className="mt-8 flex gap-4 md:gap-8 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            {(["days", "hours", "minutes", "seconds"] as const).map((k) => (
              <div key={k} className="text-center">
                <div
                  className="font-heading text-3xl md:text-4xl"
                  style={{ color: cover.typography.heading_color }}
                >
                  {String(countdown[k]).padStart(2, "0")}
                </div>
                <div
                  className="text-xs uppercase tracking-widest mt-1"
                  style={{ color: cover.typography.body_color }}
                >
                  {k}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enter Button */}
        <button
          onClick={handleEnter}
          className="group mt-10 font-body inline-flex items-center gap-2 transition-all hover:scale-105 animate-fade-in-up"
          style={{
            background: cover.button.bg_color,
            color: cover.button.text_color,
            borderRadius: cover.button.border_radius,
            padding: `${cover.button.padding_y} ${cover.button.padding_x}`,
            animationDelay: "0.6s",
          }}
        >
          {cover.enter_button_text || "Enter Website"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}

export default Cover;
