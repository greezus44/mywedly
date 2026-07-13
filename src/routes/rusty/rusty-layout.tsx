import { useEffect, useMemo } from "react";
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { RUSTY_THEME, themeToCssVars } from "../../lib/theme";
import { useGuestAuth } from "../../lib/guest-auth";
import { Loader2 } from "lucide-react";

export type Lang = "en" | "id";

async function fetchEventBySlug(slug: string): Promise<UserEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .or(`slug.eq.${slug},draft_slug.eq.${slug}`)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as UserEvent | null) ?? null;
}

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { eventId, isAuthenticated } = useGuestAuth();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["rusty-event", slug],
    queryFn: () => fetchEventBySlug(slug || ""),
    enabled: !!slug,
    retry: 1,
  });

  // CSS variables for the rusty theme (merged with event-level overrides if present)
  const cssVars = useMemo(() => {
    const merged = { ...RUSTY_THEME, ...(event?.theme || {}) };
    return themeToCssVars(merged) as React.CSSProperties;
  }, [event]);

  // Guard: once we know the event id, ensure guest auth is bound to it.
  // If a guest is authenticated for a different event, sign them out so they
  // re-login on this event.
  useEffect(() => {
    if (!event) return;
    if (isAuthenticated && eventId && eventId !== event.id) {
      // mismatched event — force re-auth on this event
      navigate(`/${slug || event.slug || event.id}/login`, { replace: true });
    }
  }, [event, eventId, isAuthenticated, navigate, slug]);

  if (isLoading) {
    return (
      <div
        style={cssVars}
        className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]"
      >
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
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
          style={{ color: "var(--color-accent)" }}
        >
          Invitation Not Found
        </p>
        <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
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
