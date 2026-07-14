import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import type { Json } from "../../lib/supabase";

interface LogoConfig { url?: string | null; size?: number; align?: string; }

export default function RustyCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

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

  const logoConfig = (event.logo_config ?? {}) as LogoConfig;
  const logoSize = typeof logoConfig.size === "number" ? logoConfig.size : 120;
  const logoAlign = logoConfig.align || "center";
  const rawCover = (event.cover_config ?? {}) as Record<string, unknown>;
  const eyebrow = (rawCover.eyebrow as string) || "";
  const heading = (rawCover.heading as string) || event.name || "";
  const subheading = (rawCover.subheading as string) || "";
  const buttonText = (rawCover.ctaText as string) || "Enter";

  return (
    <EventThemeProvider theme={RUSTY_THEME as unknown as Json}>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
        <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center animate-fadeIn">
          {logoConfig.url && (
            <div
              className="mb-10 flex w-full"
              style={{ justifyContent: logoAlign === "left" ? "flex-start" : logoAlign === "right" ? "flex-end" : "center" }}
            >
              <img
                src={logoConfig.url}
                alt="Logo"
                style={{ height: `${logoSize}px`, width: "auto", maxHeight: "40vh", background: "transparent" }}
                className="object-contain"
              />
            </div>
          )}
          {eyebrow && <p className="guest-eyebrow mb-2">{eyebrow}</p>}
          {heading && <h1 className="guest-title mb-3">{heading}</h1>}
          {subheading && <p className="guest-subtitle mb-3">{subheading}</p>}
          {typeof rawCover.bodyHtml === "string" && rawCover.bodyHtml && (
            <div className="rich-content mb-8 max-w-md" dangerouslySetInnerHTML={{ __html: rawCover.bodyHtml }} />
          )}
          {/* NO date / location on the rustic cover */}
          <button onClick={() => navigate(`/r/${slug}/signin`)} className="event-btn-primary">
            {buttonText}
          </button>
        </div>
      </div>
    </EventThemeProvider>
  );
}
