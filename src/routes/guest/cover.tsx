import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme, type ThemeConfig } from "../../lib/theme";
import { resolveTypography } from "../../lib/typography";

interface CoverConfig {
  title?: string | { text?: string; align?: string; color?: string; fontSize?: number; fontFamily?: string; fontWeight?: number; lineHeight?: number; letterSpacing?: number };
  subtitle?: string | { text?: string; align?: string; color?: string; fontSize?: number; fontFamily?: string; fontWeight?: number; lineHeight?: number; letterSpacing?: number };
  body?: string | { text?: string; align?: string; color?: string; fontSize?: number; fontFamily?: string; fontWeight?: number; lineHeight?: number; letterSpacing?: number };
  dateLocation?: string | { text?: string; align?: string; color?: string; fontSize?: number; fontFamily?: string; fontWeight?: number; lineHeight?: number; letterSpacing?: number };
  button?: string | { text?: string; fontSize?: number; color?: string };
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

  // FIX: Increased logo sizes — sm=80px, md=140px, lg=200px
  const logoHeight = coverConfig.logo?.size === "sm" ? 80 : coverConfig.logo?.size === "lg" ? 200 : 140;
  const logoAlign = coverConfig.logo?.align || "center";

  // FIX: Use resolveTypography to handle both string and object formats
  // This prevents React error #31 (rendering an object as a React node)
  const titleResolved = resolveTypography(coverConfig.title, event.title);
  const subtitleResolved = resolveTypography(coverConfig.subtitle);
  const bodyResolved = resolveTypography(coverConfig.body);

  // Button text: handle both string and object
  const buttonText = typeof coverConfig.button === "string"
    ? coverConfig.button
    : (coverConfig.button as { text?: string } | undefined)?.text || "Open Invitation";
  const buttonColor = typeof coverConfig.button === "object" && coverConfig.button !== null
    ? (coverConfig.button as { color?: string }).color
    : undefined;
  const buttonFontSize = typeof coverConfig.button === "object" && coverConfig.button !== null
    ? (coverConfig.button as { fontSize?: number }).fontSize
    : undefined;

  return (
    <EventThemeProvider theme={event.theme}>
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
                style={{ height: logoHeight, width: "auto", maxHeight: "30vh" }}
                className="object-contain"
              />
            </div>
          )}

          {titleResolved.text && (
            <h1 className="mb-3" style={titleResolved.style}>{titleResolved.text}</h1>
          )}
          {subtitleResolved.text && (
            <p className="mb-3" style={subtitleResolved.style}>{subtitleResolved.text}</p>
          )}
          {bodyResolved.text && (
            <p className="mb-8 max-w-md" style={bodyResolved.style}>{bodyResolved.text}</p>
          )}

          {/* Date and Location removed from Cover Page */}

          <button
            onClick={() => navigate(`/e/${slug}/signin`)}
            className="rounded-lg px-6 py-3 font-semibold uppercase tracking-wide transition-all hover:opacity-90 hover:scale-105"
            style={{
              backgroundColor: theme.primary,
              color: buttonColor || theme.primaryFg,
              fontSize: `${buttonFontSize || 14}px`,
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
