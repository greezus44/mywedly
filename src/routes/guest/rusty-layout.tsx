import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Outlet, NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";

// Re-export the outlet context hook so rusty child routes can use the same hook
export { useGuestOutletContext } from "./guest-layout";

export interface GuestOutletContext {
  event: UserEvent;
  slug: string;
  theme: Json | null | undefined;
  invitedSubEventIds: string[];
}

interface NavPage {
  slug: string;
  title: string;
  nav_label: string;
}

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guest, eventId, loading: authLoading } = useGuestAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["published-event", slug],
    enabled: !!slug,
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
  });

  const eventIdForInvites = event?.id ?? null;
  const guestId = guest?.id ?? null;

  const { data: invitations } = useQuery({
    queryKey: ["guest-invitations", eventIdForInvites, guestId],
    enabled: !!eventIdForInvites && !!guestId,
    queryFn: async () => {
      if (!eventIdForInvites || !guestId) return { invitations: [] };
      return resolveGuestInvitations(supabase, guestId, eventIdForInvites);
    },
  });

  const { data: navPages } = useQuery({
    queryKey: ["guest-nav-pages", eventIdForInvites],
    enabled: !!eventIdForInvites,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("id, slug, title, nav_label")
        .eq("event_id", eventIdForInvites!)
        .eq("is_published", true)
        .eq("show_in_nav", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as NavPage[];
    },
  });

  const invitedSubEventIds = useMemo(
    () => (invitations ? getInvitedSubEventIds(invitations) : []),
    [invitations]
  );

  // Redirect to rustic sign-in if not authenticated
  useEffect(() => {
    if (authLoading) return;
    if (event && eventId !== event.id) {
      navigate(`/r/${slug}/signin`, { replace: true });
    }
  }, [authLoading, event, eventId, slug, navigate]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Something went wrong</h1>
        <p className="text-dash-muted">We couldn't load this invitation.</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Invitation Not Found</h1>
        <p className="text-dash-muted">This invitation website could not be found or is no longer available.</p>
      </div>
    );
  }

  if (!guest || eventId !== event.id) {
    return null; // effect will redirect
  }

  const navLinks = [
    { label: "Home", to: `/r/${slug}/home` },
    { label: "RSVP", to: `/r/${slug}/rsvp` },
    { label: "Wishes", to: `/r/${slug}/wishes` },
    { label: "Contact", to: `/r/${slug}/contact` },
    ...(navPages ?? []).map((p) => ({
      label: p.nav_label || p.title,
      to: `/r/${slug}/p/${p.slug}`,
    })),
  ];

  return (
    <EventThemeProvider theme={event.theme}>
      <div className="relative min-h-screen">
        {/* Top bar with hamburger */}
        <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}>
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <NavLink to={`/r/${slug}/home`} className="text-sm font-semibold" style={{ color: "var(--event-heading)" }}>
              {event.name}
            </NavLink>
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded"
              style={{ color: "var(--event-text)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </header>

        {/* Slide-down menu */}
        {menuOpen && (
          <nav className="sticky top-[57px] z-20 border-b shadow-sm" style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}>
            <div className="mx-auto max-w-5xl px-4 py-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="guest-nav-link block"
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}

        <Outlet context={{ event, slug: slug!, theme: event.theme, invitedSubEventIds } satisfies GuestOutletContext} />
      </div>
    </EventThemeProvider>
  );
}
