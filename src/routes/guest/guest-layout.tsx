import { useParams, Outlet, useOutletContext, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SlugRedirect } from "../../lib/supabase";
import { DEFAULT_THEME, themeToEventCssVars } from "../../lib/theme";
import { EventThemeProvider } from "../../lib/theme-context";
import { useGuestAuth } from "../../lib/guest-auth";

/**
 * GuestLayout — fetches the event by slug and wraps all guest pages in
 * EventThemeProvider so they receive the `.event-themed` scope and the
 * event's CSS variables. The dashboard is never affected because the vars
 * are scoped to the container, not to document :root.
 */
export default function GuestLayout() {
  const { slug } = useParams<{ slug: string }>();
  const { eventId: authEventId } = useGuestAuth();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["guest-event", slug],
    queryFn: async () => {
      if (!slug) return null;
      // Try direct slug match first
      const { data: direct, error: directErr } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (directErr) throw directErr;
      if (direct) return direct as UserEvent;
      // Fall back to redirect table
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-black animate-spin rounded-full" />
      </div>
    );
  }
  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-3xl mb-3 text-gray-900">Event not found</h1>
          <p className="text-sm text-gray-500">The event you're looking for doesn't exist or is no longer published.</p>
        </div>
      </div>
    );
  }

  const theme = event.theme || DEFAULT_THEME;
  const cssVars = themeToEventCssVars(theme) as React.CSSProperties;

  return (
    <EventThemeProvider initialTheme={theme}>
      <div style={cssVars} className="min-h-screen">
        <Outlet context={{ event, guestEventId: authEventId }} />
      </div>
    </EventThemeProvider>
  );
}

/** Context type shared by all guest child routes. */
export interface GuestOutletContext {
  event: UserEvent;
  guestEventId: string | null;
}

/** Convenience hook for child routes to read the event. */
export function useGuestOutletContext() {
  return useOutletContext<GuestOutletContext>();
}

/** Guard used by pages that require the guest to have signed in. */
export function RequireGuest({ children }: { children: React.ReactNode }) {
  const { event } = useGuestOutletContext();
  const { isAuthenticated, eventId } = useGuestAuth();
  if (!isAuthenticated || eventId !== event.id) {
    return <Navigate to="login" replace />;
  }
  return <>{children}</>;
}
