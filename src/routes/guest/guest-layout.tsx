import { useEffect, useMemo } from "react";
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase, type UserEvent, type SlugRedirect } from "../../lib/supabase";
import { DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { useGuestAuth } from "../../lib/guest-auth";

/**
 * Fetch an event by its slug (or uuid) from the user_events table.
 * Checks the `slug` field first, then falls back to `draft_slug` and `id`.
 */
async function fetchEventBySlug(slug: string): Promise<UserEvent | null> {
  // 1. Try the user_events table by slug / draft_slug / id
  const { data, error } = await supabase
    .from("user_events")
    .select("*")
    .or(`slug.eq.${slug},draft_slug.eq.${slug},id.eq.${slug}`)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as UserEvent;

  // 2. Fall back to the event_slug_redirects table
  const { data: redirect, error: redirectError } = await supabase
    .from("event_slug_redirects")
    .select("*")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  if (redirectError) throw redirectError;
  if (redirect) {
    const redirectRow = redirect as SlugRedirect;
    const { data: redirected, error: redirectedError } = await supabase
      .from("user_events")
      .select("*")
      .eq("id", redirectRow.event_id)
      .maybeSingle();
    if (redirectedError) throw redirectedError;
    if (redirected) return redirected as UserEvent;
  }

  return null;
}

export default function GuestLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { eventId, isAuthenticated } = useGuestAuth();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["guest-event", slug],
    queryFn: () => fetchEventBySlug(slug || ""),
    enabled: !!slug,
    retry: 1,
  });

  // CSS variables for the event's theme (merged with the default onyx/cream theme)
  const cssVars = useMemo(() => {
    const merged = { ...DEFAULT_THEME, ...(event?.theme || {}) };
    return themeToCssVars(merged) as React.CSSProperties;
  }, [event]);

  // Guard: if a guest is authenticated for a different event, sign them out
  // so they re-login on this event.
  useEffect(() => {
    if (!event) return;
    if (isAuthenticated && eventId && eventId !== event.id) {
      navigate(`/e/${slug || event.slug || event.id}/login`, { replace: true });
    }
  }, [event, eventId, isAuthenticated, navigate, slug]);

  if (isLoading) {
    return (
      <div
        style={cssVars}
        className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]"
      >
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-muted)]" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div
        style={cssVars}
        className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[var(--color-bg)] text-[var(--color-text)] px-6 text-center"
      >
        <p
          className="font-heading text-3xl tracking-wide"
          style={{ color: "var(--color-text)" }}
        >
          Invitation Not Found
        </p>
        <p
          className="text-sm max-w-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          We could not locate the invitation you are looking for. Please check
          your link and try again.
        </p>
      </div>
    );
  }

  return (
    <div
      style={cssVars}
      className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans antialiased"
    >
      <Outlet context={{ event }} />
    </div>
  );
}
