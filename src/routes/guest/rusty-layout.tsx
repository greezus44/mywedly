import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";

// Re-export the outlet context hook so rusty child routes can use the same context
export { useGuestOutletContext } from "./guest-layout";
import { useGuestOutletContext } from "./guest-layout";
import type { GuestOutletContext } from "./guest-layout";

interface NavItem {
  label: string;
  to: string;
}

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guest, eventId, loading: authLoading } = useGuestAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: event, isLoading: eventLoading } = useQuery({
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

  const { data: customPages } = useQuery({
    queryKey: ["guest-custom-pages", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event!.id)
        .eq("is_published", true)
        .eq("show_in_nav", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomPage[];
    },
    enabled: !!event?.id,
  });

  const { data: invitationData } = useQuery({
    queryKey: ["guest-invitations", event?.id, guest?.id],
    queryFn: async () => {
      return resolveGuestInvitations(supabase, guest!.id, event!.id);
    },
    enabled: !!event?.id && !!guest?.id,
  });

  const invitedSubEventIds = useMemo(
    () => (invitationData ? getInvitedSubEventIds(invitationData.invitations) : []),
    [invitationData],
  );

  // Redirect to rustic sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !guest && event) {
      navigate(`/r/${slug}/signin`, { replace: true });
    }
  }, [authLoading, guest, event, slug, navigate]);

  useEffect(() => {
    setMenuOpen(false);
  }, [slug]);

  if (eventLoading || authLoading) {
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
      </div>
    );
  }

  if (!guest || eventId !== event.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );
  }

  const navItems: NavItem[] = [
    { label: "Home", to: `/r/${slug}/home` },
    { label: "RSVP", to: `/r/${slug}/rsvp` },
    { label: "Wishes", to: `/r/${slug}/wishes` },
    { label: "Contact", to: `/r/${slug}/contact` },
    ...(customPages ?? []).map((p) => ({
      label: p.nav_label || p.title,
      to: `/r/${slug}/p/${p.slug}`,
    })),
  ];

  const logoConfig = (event.logo_config ?? {}) as { url?: string | null; size?: number };

  return (
    <EventThemeProvider theme={RUSTY_THEME as unknown as Json}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 border-b" style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}>
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <NavLink to={`/r/${slug}/home`} className="flex items-center gap-2">
              {logoConfig.url ? (
                <img src={logoConfig.url} alt="Logo" style={{ height: "32px", width: "auto", background: "transparent" }} className="object-contain" />
              ) : (
                <span className="text-lg font-bold" style={{ color: "var(--event-heading)" }}>{event.name}</span>
              )}
            </NavLink>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `guest-nav-link${isActive ? " active" : ""}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <button
              className="md:hidden p-2 rounded-md"
              style={{ color: "var(--event-text)" }}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

          {menuOpen && (
            <nav className="md:hidden border-t px-4 py-2" style={{ borderColor: "var(--event-border)" }}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `guest-nav-link block w-full text-left${isActive ? " active" : ""}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
        </header>

        <main>
          <Outlet context={{ event, slug: slug!, theme: RUSTY_THEME, invitedSubEventIds } satisfies GuestOutletContext} />
        </main>
      </div>
    </EventThemeProvider>
  );
}

// Keep the hook referenced so tree-shaking doesn't drop the re-export
void useGuestOutletContext;
