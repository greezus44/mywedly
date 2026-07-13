import { useParams, Outlet, useOutletContext, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SlugRedirect } from "../../lib/supabase";
import { RUSTY_THEME, themeToEventCssVars } from "../../lib/theme";
import { EventThemeProvider } from "../../lib/theme-context";
import { useGuestAuth } from "../../lib/guest-auth";

export type Lang = "en" | "id";

/**
 * RustyLayout — fetches the event by slug and wraps all rusty guest pages in
 * EventThemeProvider with RUSTY_THEME (cream & gold palette).
 */
export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const { eventId: authEventId } = useGuestAuth();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["rusty-event", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data: direct, error: directErr } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (directErr) throw directErr;
      if (direct) return direct as UserEvent;
      const { data: redirect, error: redirErr } = await supabase
        .from("event_slug_redirects")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (redirErr) throw redirErr;
      if (redirect) {
        const r = redirect as SlugRedirect;
        const { data: redirected, error: rErr } = await supabase
          .from("user_events")
          .select("*")
          .eq("id", r.event_id)
          .eq("is_published", true)
          .maybeSingle();
        if (rErr) throw rErr;
        return (redirected as UserEvent) || null;
      }
      return null;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5ECD7" }}>
        <div className="w-8 h-8 border-2 border-[#D4C695] border-t-[#B8962E] animate-spin rounded-full" />
      </div>
    );
  }
  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#F5ECD7" }}>
        <div className="text-center max-w-md">
          <h1 className="font-heading text-3xl mb-3" style={{ color: "#3D3528" }}>Event not found</h1>
          <p className="text-sm" style={{ color: "#8B7355" }}>The event you're looking for doesn't exist or is no longer published.</p>
        </div>
      </div>
    );
  }

  // Merge the event's own theme with RUSTY_THEME defaults so the cream/gold
  // palette is always present but event customizations can override.
  const theme = { ...RUSTY_THEME, ...(event.theme || {}) };
  const cssVars = themeToEventCssVars(theme) as React.CSSProperties;

  return (
    <EventThemeProvider initialTheme={theme}>
      <div style={cssVars} className="min-h-screen">
        <Outlet context={{ event, guestEventId: authEventId }} />
      </div>
    </EventThemeProvider>
  );
}

export interface RustyOutletContext {
  event: UserEvent;
  guestEventId: string | null;
}

export function useRustyOutletContext() {
  return useOutletContext<RustyOutletContext>();
}

export function RequireRustyGuest({ children }: { children: React.ReactNode }) {
  const { event } = useRustyOutletContext();
  const { isAuthenticated, eventId } = useGuestAuth();
  if (!isAuthenticated || eventId !== event.id) {
    return <Navigate to="login" replace />;
  }
  return <>{children}</>;
}
