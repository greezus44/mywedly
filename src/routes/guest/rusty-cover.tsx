import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import { LoadingSpinner } from "../../components/ui";
import { formatDateShort } from "../../lib/utils";

export default function RustyCoverPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading } = useQuery({
    queryKey: ["rusty-event", slug],
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
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: RUSTY_THEME.colors.bg }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: RUSTY_THEME.colors.bg }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: RUSTY_THEME.colors.heading, fontFamily: RUSTY_THEME.fonts.heading }}>
          Invitation Not Found
        </h1>
        <p style={{ color: RUSTY_THEME.colors.muted }}>This invitation could not be found.</p>
      </div>
    );
  }

  const coverConfig = (event.cover_config ?? {}) as Record<string, unknown>;
  const bg = (coverConfig.background ?? {}) as Record<string, unknown>;
  const bgStyle: React.CSSProperties = {};
  if (bg.image) {
    bgStyle.backgroundImage = `url(${bg.image})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
    bgStyle.backgroundRepeat = "no-repeat";
  } else {
    bgStyle.backgroundColor = RUSTY_THEME.colors.bg;
  }

  const headingText = typeof coverConfig.heading === "object" && coverConfig.heading !== null
    ? ((coverConfig.heading as Record<string, unknown>).text as string) ?? event.name
    : event.name;

  return (
    <EventThemeProvider theme={RUSTY_THEME}>
      <div className="relative flex min-h-screen flex-col items-center justify-center" style={bgStyle}>
        {typeof bg.image === "string" && bg.image && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${((coverConfig.overlayOpacity as number) ?? 30) / 100})` }}
          />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center px-8 py-16 text-center max-w-lg w-full">
          <h1
            className="text-4xl font-bold mb-4 leading-tight"
            style={{
              fontFamily: RUSTY_THEME.fonts.heading,
              color: bg.image ? "#ffffff" : RUSTY_THEME.colors.heading,
            }}
          >
            {headingText}
          </h1>
          <button
            onClick={() => navigate(`/r/${slug}/signin`)}
            className="mt-6 rounded px-8 py-3 text-base font-semibold transition-colors"
            style={{
              backgroundColor: RUSTY_THEME.colors.primary,
              color: RUSTY_THEME.colors.primaryFg,
            }}
          >
            {(coverConfig.ctaText as string) ?? "Enter"}
          </button>
        </div>
      </div>
    </EventThemeProvider>
  );
}
