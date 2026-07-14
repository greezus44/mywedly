import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme, type ThemeConfig } from "../../lib/theme";

interface CoverConfig {
  title?: { text?: string; fontFamily?: string; fontSize?: number; fontWeight?: number; color?: string; letterSpacing?: number; lineHeight?: number; align?: string };
  subtitle?: { text?: string; fontFamily?: string; fontSize?: number; fontWeight?: number; color?: string; letterSpacing?: number; lineHeight?: number; align?: string };
  body?: { text?: string; fontFamily?: string; fontSize?: number; fontWeight?: number; color?: string; letterSpacing?: number; lineHeight?: number; align?: string };
  dateLocation?: { text?: string; fontFamily?: string; fontSize?: number; fontWeight?: number; color?: string; letterSpacing?: number; lineHeight?: number; align?: string };
  button?: { text?: string; fontSize?: number; color?: string };
  logo?: { url?: string | null; size?: string; align?: string };
  background?: { image?: string | null; color?: string; overlayOpacity?: number; position?: string; fit?: string };
}

export default function GuestCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guestId, eventId } = useGuestAuth();

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
    if (event && guestId && eventId === event.id) {
      navigate(`/e/${slug}/home`, { replace: true });
    }
  }, [event, guestId, eventId, slug, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Invitation Not Found</h1>
        <p className="text-dash-muted">This invitation website could not be found or is no longer available.</p>
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
      </div>
    );
  }

  const theme = jsonToTheme(event.theme);
  const coverConfig = (event.cover_config ?? {}) as CoverConfig;
  const logoConfig = (event.logo_config ?? {}) as { url?: string };
  const bgConfig = coverConfig.background ?? {};
  const overlay = bgConfig.overlayOpacity ?? 0.3;

  const bgStyle: React.CSSProperties = {};
  if (bgConfig.image) {
    bgStyle.backgroundImage = `url(${bgConfig.image})`;
    bgStyle.backgroundSize = bgConfig.fit === "fill" ? "100% 100%" : (bgConfig.fit as "cover" | "contain") || "cover";
    bgStyle.backgroundPosition = bgConfig.position || "center";
    bgStyle.backgroundRepeat = "no-repeat";
  } else {
    bgStyle.backgroundColor = bgConfig.color || theme.bg;
  }

  // FIX: Increased logo sizes — sm=80px, md=140px, lg=200px (was 40/60/80)
  const logoHeight = coverConfig.logo?.size === "sm" ? 80 : coverConfig.logo?.size === "lg" ? 200 : 140;
  const logoAlign = coverConfig.logo?.align || "center";

  const textStyle = (ts: CoverConfig["title"]): React.CSSProperties => ts ? ({
    fontFamily: ts.fontFamily,
    fontSize: `${ts.fontSize}px`,
    fontWeight: ts.fontWeight,
    color: ts.color,
    letterSpacing: `${ts.letterSpacing}em`,
    lineHeight: ts.lineHeight,
    textAlign: ts.align as "left" | "center" | "right",
  }) : {};

  const titleText = coverConfig.title?.text || event.name;
  const subtitleText = coverConfig.subtitle?.text;
  const bodyText = coverConfig.body?.text;
  const buttonText = coverConfig.button?.text || "Open Invitation";

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden" style={bgStyle}>
        {bgConfig.image && (
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />
        )}

        <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 py-16 text-center animate-fadeIn">
          {logoConfig.url && (
            <div className="mb-8 w-full flex" style={{ justifyContent: logoAlign === "left" ? "flex-start" : logoAlign === "right" ? "flex-end" : "center" }}>
              {/* FIX: No background styling on logo — transparent PNGs/SVGs render correctly */}
              <img
                src={logoConfig.url}
                alt="Logo"
                style={{ height: logoHeight, width: "auto", maxHeight: "30vh" }}
                className="object-contain"
              />
            </div>
          )}

          {titleText && (
            <h1 className="mb-3" style={textStyle(coverConfig.title)}>{titleText}</h1>
          )}
          {subtitleText && (
            <p className="mb-3" style={textStyle(coverConfig.subtitle)}>{subtitleText}</p>
          )}
          {bodyText && (
            <p className="mb-8 max-w-md" style={textStyle(coverConfig.body)}>{bodyText}</p>
          )}

          {/* FIX: Date and Location removed from Cover Page */}

          <button
            onClick={() => navigate(`/e/${slug}/signin`)}
            className="rounded-lg px-6 py-3 font-semibold uppercase tracking-wide transition-all hover:opacity-90 hover:scale-105"
            style={{
              backgroundColor: theme.primary,
              color: coverConfig.button?.color || theme.primaryFg,
              fontSize: `${coverConfig.button?.fontSize || 14}px`,
              borderRadius: theme.radius,
            }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </EventThemeProvider>
  );
}
