import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import { resolveTypography } from "../../lib/typography";

interface CoverConfig {
  title?: unknown;
  subtitle?: unknown;
  body?: unknown;
  button?: unknown;
  logo?: { url?: string | null; size?: string; align?: string };
  background?: { image?: string | null; color?: string; overlayOpacity?: number; position?: string; fit?: string };
}

export default function RustyCover() {
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
      navigate(`/r/${slug}/home`, { replace: true });
    }
  }, [event, guestId, eventId, slug, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: RUSTY_THEME.bg }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: RUSTY_THEME.primary }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center" style={{ backgroundColor: RUSTY_THEME.bg }}>
        <h1 className="text-2xl font-bold" style={{ color: RUSTY_THEME.heading }}>Invitation Not Found</h1>
        <p style={{ color: RUSTY_THEME.muted }}>This invitation website could not be found or is no longer available.</p>
        <Link to="/" className="hover:underline" style={{ color: RUSTY_THEME.primary }}>Return home</Link>
      </div>
    );
  }

  const coverConfig = (event.cover_config ?? {}) as CoverConfig;
  const logoConfig = (event.logo_config ?? {}) as { url?: string };
  const bgConfig = coverConfig.background ?? {};
  const overlay = bgConfig.overlayOpacity ?? 0.4;

  const bgStyle: React.CSSProperties = {};
  if (bgConfig.image) {
    bgStyle.backgroundImage = `url(${bgConfig.image})`;
    bgStyle.backgroundSize = bgConfig.fit === "fill" ? "100% 100%" : (bgConfig.fit as "cover" | "contain") || "cover";
    bgStyle.backgroundPosition = bgConfig.position || "center";
    bgStyle.backgroundRepeat = "no-repeat";
  } else {
    bgStyle.backgroundColor = bgConfig.color || RUSTY_THEME.bg;
  }

  // Logo sizes: sm=80, md=140, lg=200
  const logoHeight = coverConfig.logo?.size === "sm" ? 80 : coverConfig.logo?.size === "lg" ? 200 : 140;
  const logoAlign = coverConfig.logo?.align || "center";

  // Use resolveTypography for all text fields (prevents React error #31)
  const titleResolved = resolveTypography(coverConfig.title, event.title || "Our Wedding");
  const subtitleResolved = resolveTypography(coverConfig.subtitle, "");
  const bodyResolved = resolveTypography(coverConfig.body, "");

  // Button text: handle both string and object
  const buttonText = resolveTypography(coverConfig.button, "Open Invitation");

  return (
    <EventThemeProvider theme={event.theme}>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden" style={bgStyle}>
        {bgConfig.image && (
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />
        )}

        <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 py-16 text-center animate-fadeIn">
          {logoConfig.url && (
            <div className="mb-8 flex w-full" style={{ justifyContent: logoAlign === "left" ? "flex-start" : logoAlign === "right" ? "flex-end" : "center" }}>
              <img
                src={logoConfig.url}
                alt="Logo"
                style={{ height: logoHeight, width: "auto", maxHeight: "30vh" }}
                className="object-contain"
              />
            </div>
          )}

          {titleResolved.text && (
            <h1 className="mb-3" style={{ ...titleResolved.style, fontFamily: RUSTY_THEME.fontHeading, color: RUSTY_THEME.heading, fontSize: "calc(3rem * var(--event-font-scale, 1))" }}>
              {titleResolved.text}
            </h1>
          )}
          {subtitleResolved.text && (
            <p className="mb-3" style={{ ...subtitleResolved.style, color: RUSTY_THEME.muted }}>{subtitleResolved.text}</p>
          )}
          {bodyResolved.text && (
            <p className="mb-8 max-w-md" style={{ ...bodyResolved.style, color: RUSTY_THEME.text }}>{bodyResolved.text}</p>
          )}

          {/* NO date/location on rustic cover */}

          <button
            onClick={() => navigate(`/r/${slug}/signin`)}
            className="rounded-lg px-6 py-3 font-semibold uppercase tracking-wide transition-all hover:opacity-90 hover:scale-105"
            style={{
              backgroundColor: RUSTY_THEME.primary,
              color: RUSTY_THEME.primaryFg,
              fontSize: `${(typeof coverConfig.button === "object" && coverConfig.button !== null ? (coverConfig.button as { fontSize?: number }).fontSize : undefined) || 14}px`,
              borderRadius: RUSTY_THEME.radius,
            }}
          >
            {buttonText.text}
          </button>
        </div>
      </div>
    </EventThemeProvider>
  );
}
