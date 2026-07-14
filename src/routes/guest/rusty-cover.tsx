import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import type { Json } from "../../lib/supabase";

interface LogoConfig {
  url?: string | null;
  size?: number;
  align?: string;
}

interface CoverConfig {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  bodyHtml?: string;
  ctaText?: string;
  overlayOpacity?: number;
  background?: { image?: string | null; color?: string; position?: string; fit?: string };
}

// Rusty theme JSON for EventThemeProvider (which calls jsonToTheme internally)
const RUSTY_THEME_JSON = RUSTY_THEME as unknown as Json;

export default function RustyCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guest, eventId } = useGuestAuth();

  const { data: event, isLoading } = useQuery({
    queryKey: ["published-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (event && guest && eventId === event.id) {
      navigate(`/r/${slug}/home`, { replace: true });
    }
  }, [event, guest, eventId, slug, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: RUSTY_THEME.colors.bg }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: RUSTY_THEME.colors.primary }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center" style={{ backgroundColor: RUSTY_THEME.colors.bg, color: RUSTY_THEME.colors.text }}>
        <h1 className="text-2xl font-bold" style={{ color: RUSTY_THEME.colors.heading }}>Invitation Not Found</h1>
        <p style={{ color: RUSTY_THEME.colors.muted }}>This invitation website could not be found or is no longer available.</p>
        <Link to="/" className="hover:underline" style={{ color: RUSTY_THEME.colors.primary }}>Return home</Link>
      </div>
    );
  }

  const coverConfig = (event.cover_config ?? {}) as CoverConfig;
  const logoConfig = (event.logo_config ?? {}) as LogoConfig;
  const bgConfig = coverConfig.background ?? {};
  const overlay = (coverConfig.overlayOpacity ?? 40) / 100;

  const bgStyle: React.CSSProperties = {};
  if (bgConfig.image) {
    bgStyle.backgroundImage = `url(${bgConfig.image})`;
    bgStyle.backgroundSize = bgConfig.fit === "fill" ? "100% 100%" : (bgConfig.fit as "cover" | "contain") || "cover";
    bgStyle.backgroundPosition = bgConfig.position || "center";
    bgStyle.backgroundRepeat = "no-repeat";
  } else if (bgConfig.color) {
    bgStyle.backgroundColor = bgConfig.color;
  } else {
    bgStyle.backgroundColor = RUSTY_THEME.colors.bg;
  }

  const logoSize = typeof logoConfig.size === "number" ? logoConfig.size : 120;
  const logoAlign = logoConfig.align || "center";
  const titleText = coverConfig.heading || event.name;
  const buttonText = coverConfig.ctaText || "Open Invitation";

  return (
    <EventThemeProvider theme={RUSTY_THEME_JSON}>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden" style={bgStyle}>
        {bgConfig.image && (
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />
        )}

        <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 py-16 text-center animate-fadeIn">
          {logoConfig.url && (
            <div className="mb-8 w-full flex" style={{ justifyContent: logoAlign === "left" ? "flex-start" : logoAlign === "right" ? "flex-end" : "center" }}>
              <img
                src={logoConfig.url}
                alt="Logo"
                style={{ height: `${logoSize}px`, width: "auto", maxHeight: "40vh" }}
                className="object-contain"
              />
            </div>
          )}

          {coverConfig.eyebrow && <p className="guest-eyebrow mb-2">{coverConfig.eyebrow}</p>}
          {titleText && <h1 className="guest-title mb-3">{titleText}</h1>}
          {coverConfig.subheading && <p className="guest-subtitle mb-3">{coverConfig.subheading}</p>}
          {coverConfig.bodyHtml && (
            <div className="rich-content mb-8 max-w-md" dangerouslySetInnerHTML={{ __html: coverConfig.bodyHtml }} />
          )}

          <button onClick={() => navigate(`/r/${slug}/signin`)} className="event-btn-primary">
            {buttonText}
          </button>
        </div>
      </div>
    </EventThemeProvider>
  );
}
