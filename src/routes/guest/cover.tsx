import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type Wedding } from "../../lib/supabase";
import { useGuestAuth, GuestAuthProvider } from "../../lib/guest-auth";
import {
  themeToCssVars,
  coverToCssVars,
  getCoverConfig,
  getCoverContent,
  getTheme,
  getLogoStyle,
  getLogoPositionClasses,
  DEFAULT_COVER_CONFIG,
} from "../../lib/theme";
import { getCountdown, getDeviceType } from "../../lib/utils";
import { Heart, ChevronRight } from "lucide-react";

function CoverInner() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signInWithToken } = useGuestAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  // Fetch wedding by slug
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

  // Handle QR token login via ?t=token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("t");
    if (!token || !wedding) return;
    signInWithToken(token).then(({ error }) => {
      if (!error) {
        navigate(`/w/${slug}/home`, { replace: true });
      }
      setTokenChecked(true);
    });
  }, [wedding, slug, navigate, signInWithToken]);

  // Track visit
  const trackVisit = useCallback(async () => {
    if (!wedding) return;
    await supabase.from("sharing_events").insert({
      wedding_id: wedding.id,
      event_type: "visit",
      device_type: getDeviceType(),
    });
  }, [wedding]);

  useEffect(() => {
    if (wedding) trackVisit();
  }, [wedding, trackVisit]);

  // Countdown ticker
  useEffect(() => {
    if (!wedding?.wedding_date) return;
    const update = () => setCountdown(getCountdown(wedding.wedding_date));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [wedding?.wedding_date]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Heart className="h-8 w-8 animate-pulse text-white" />
      </div>
    );
  }

  const cover = getCoverContent(wedding);
  const theme = getTheme(wedding);
  const device = getDeviceType();
  const logo = cover.branding?.logo;
  const logoPos = getLogoPositionClasses(logo?.position || "top-center");

  // Background rendering
  const renderBackground = () => {
    const bg = cover.background;
    const overlayStyle: React.CSSProperties = {
      background: cover.overlay.color,
      opacity: cover.overlay.opacity,
    };

    let bgElement: React.ReactNode = null;
    if (bg.type === "image" && bg.image_url) {
      bgElement = (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${bg.image_url})`,
            filter: `blur(${cover.blur}) brightness(${cover.brightness})`,
          }}
        />
      );
    } else if (bg.type === "video" && bg.video_url) {
      bgElement = (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          style={{ filter: `blur(${cover.blur}) brightness(${cover.brightness})` }}
        >
          <source src={bg.video_url} />
        </video>
      );
    } else if (bg.type === "slideshow" && bg.slideshow_urls.length > 0) {
      bgElement = (
        <Slideshow
          urls={bg.slideshow_urls}
          blur={cover.blur}
          brightness={cover.brightness}
        />
      );
    } else {
      bgElement = <div className="absolute inset-0" style={{ background: bg.color }} />;
    }

    return (
      <>
        {bgElement}
        {cover.overlay.enabled && (
          <div className="absolute inset-0" style={overlayStyle} />
        )}
      </>
    );
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ ...themeToCssVars(theme), ...coverToCssVars(cover) } as React.CSSProperties}
    >
      {renderBackground()}

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <div
          className={`flex flex-col ${logoPos.container} w-full`}
          style={{ maxWidth: cover.layout.max_width, padding: cover.layout.padding }}
        >
          {/* Logo */}
          {logo?.url && logo.visible && (
            <div className={`flex ${logoPos.container} mb-6`}>
              <img
                src={logo.url}
                alt="Logo"
                style={getLogoStyle(logo, device)}
                className="animate-fade-in"
              />
            </div>
          )}

          {/* Couple names */}
          <div className="text-center animate-fade-in-up">
            <p
              className="mb-2 text-sm uppercase tracking-widest"
              style={{
                color: "var(--cover-body-color)",
                fontFamily: "var(--cover-body-font)",
                fontSize: "var(--cover-body-size)",
              }}
            >
              {wedding?.hashtag ? `#${wedding.hashtag}` : "We Invite You"}
            </p>
            <h1
              className="mb-1"
              style={{
                color: "var(--cover-text)",
                fontFamily: "var(--cover-heading-font)",
                fontSize: "var(--cover-heading-size)",
                fontWeight: cover.typography.heading_weight,
                letterSpacing: cover.typography.letter_spacing,
                lineHeight: 1.2,
              }}
            >
              {cover.branding.couple_name_one || wedding?.couple_name_one}
            </h1>
            <div className="my-2 flex items-center justify-center gap-3">
              <span className="h-px w-12" style={{ background: "var(--cover-text)", opacity: 0.4 }} />
              <Heart className="h-5 w-5" style={{ color: "var(--cover-text)" }} />
              <span className="h-px w-12" style={{ background: "var(--cover-text)", opacity: 0.4 }} />
            </div>
            <h1
              className="mb-6"
              style={{
                color: "var(--cover-text)",
                fontFamily: "var(--cover-heading-font)",
                fontSize: "var(--cover-heading-size)",
                fontWeight: cover.typography.heading_weight,
                letterSpacing: cover.typography.letter_spacing,
                lineHeight: 1.2,
              }}
            >
              {cover.branding.couple_name_two || wedding?.couple_name_two}
            </h1>
          </div>

          {/* Date */}
          {cover.show_date && (cover.branding.date || wedding?.wedding_date) && (
            <p
              className="mb-6 text-center animate-fade-in-up"
              style={{
                animationDelay: "0.15s",
                color: "var(--cover-body-color)",
                fontFamily: "var(--cover-body-font)",
                fontSize: "var(--cover-body-size)",
              }}
            >
              {cover.branding.date || wedding?.wedding_date}
            </p>
          )}

          {/* Countdown */}
          {cover.show_countdown && !countdown.isPast && (
            <div className="mb-8 flex justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              {[
                { label: "Days", value: countdown.days },
                { label: "Hours", value: countdown.hours },
                { label: "Min", value: countdown.minutes },
                { label: "Sec", value: countdown.seconds },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex min-w-[60px] flex-col items-center rounded-lg px-3 py-2"
                  style={{
                    background: "color-mix(in srgb, var(--cover-text) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--cover-text) 20%, transparent)",
                  }}
                >
                  <span
                    className="text-xl font-bold tabular-nums"
                    style={{ color: "var(--cover-text)", fontFamily: "var(--cover-heading-font)" }}
                  >
                    {String(item.value).padStart(2, "0")}
                  </span>
                  <span
                    className="text-[0.625rem] uppercase tracking-wider"
                    style={{ color: "var(--cover-body-color)", fontFamily: "var(--cover-body-font)" }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Enter button */}
          <div className="flex justify-center animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
            <button
              onClick={() => navigate(`/w/${slug}/login`)}
              className="group flex items-center gap-2 font-medium transition-transform hover:scale-105 active:scale-100"
              style={{
                background: "var(--cover-button)",
                color: "var(--cover-button-text)",
                borderRadius: cover.button.border_radius,
                paddingLeft: cover.button.padding_x,
                paddingRight: cover.button.padding_x,
                paddingTop: cover.button.padding_y,
                paddingBottom: cover.button.padding_y,
              }}
            >
              {cover.enter_button_text || cover.button.text}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Slideshow component
function Slideshow({ urls, blur, brightness }: { urls: string[]; blur: string; brightness: number }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % urls.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [urls.length]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {urls.map((url, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${url})`,
            opacity: i === index ? 1 : 0,
            filter: `blur(${blur}) brightness(${brightness})`,
          }}
        />
      ))}
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
