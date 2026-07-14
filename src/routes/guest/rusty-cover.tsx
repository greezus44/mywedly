import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import { resolveTypography } from "../../lib/typography";

interface LogoConfig { url?: string | null; size?: number; align?: string; }

export default function RustyCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading } = useQuery({
    queryKey: ["published-event", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-dash-bg"><div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  if (!event) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center"><h1 className="text-2xl font-bold text-dash-text">Invitation Not Found</h1><Link to="/" className="text-dash-primary hover:underline">Return home</Link></div>;

  const rawCoverConfig = (event.cover_config ?? {}) as Record<string, unknown>;
  const logoConfig = (event.logo_config ?? {}) as LogoConfig;
  const bgConfig = (rawCoverConfig.background ?? {}) as { image?: string | null; color?: string; position?: string; fit?: string; };
  const overlay = (typeof rawCoverConfig.overlayOpacity === "number" ? rawCoverConfig.overlayOpacity : 30) / 100;
  const bgStyle: React.CSSProperties = {};
  if (bgConfig.image) { bgStyle.backgroundImage = `url(${bgConfig.image})`; bgStyle.backgroundSize = bgConfig.fit === "fill" ? "100% 100%" : (bgConfig.fit as "cover" | "contain") || "cover"; bgStyle.backgroundPosition = bgConfig.position || "center"; bgStyle.backgroundRepeat = "no-repeat"; }
  else if (bgConfig.color) bgStyle.backgroundColor = bgConfig.color;
  else bgStyle.backgroundColor = RUSTY_THEME.colors.bg;
  const logoSize = typeof logoConfig.size === "number" ? logoConfig.size : 120;
  const logoAlign = logoConfig.align || "center";
  const buttonText = (rawCoverConfig.ctaText as string) || "Enter";
  const eyebrow = resolveTypography(rawCoverConfig.eyebrow, "");
  const heading = resolveTypography(rawCoverConfig.heading, event.name);

  return (
    <EventThemeProvider theme={event.theme}>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden" style={bgStyle}>
        {bgConfig.image && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />}
        <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 py-16 text-center animate-fadeIn">
          {logoConfig.url && (
            <div className="mb-8 w-full flex" style={{ justifyContent: logoAlign === "left" ? "flex-start" : logoAlign === "right" ? "flex-end" : "center" }}>
              <img src={logoConfig.url} alt="Logo" style={{ height: `${logoSize}px`, width: "auto", maxHeight: "40vh", background: "transparent" }} className="object-contain" />
            </div>
          )}
          {eyebrow.text && <p className="guest-eyebrow mb-2" style={eyebrow.style}>{eyebrow.text}</p>}
          {heading.text && <h1 className="guest-title mb-6" style={heading.style}>{heading.text}</h1>}
          <button onClick={() => navigate(`/r/${slug}/signin`)} className="event-btn-primary">{buttonText}</button>
        </div>
      </div>
    </EventThemeProvider>
  );
}
