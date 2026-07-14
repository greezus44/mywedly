import { useState, useEffect } from "react";
import { useParams, useNavigate, Outlet, NavLink, Link, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type EventGuest, type Json } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme, type ThemeConfig } from "../../lib/theme";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";

export interface GuestOutletContext {
  event: UserEvent;
  slug: string;
  theme: ThemeConfig;
  invitedSubEventIds: string[];
}

export function useGuestOutletContext(): GuestOutletContext {
  return useOutletContext<GuestOutletContext>();
}

export default function GuestLayout() {
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

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !guest && event && eventId !== event.id) {
      navigate(`/e/${slug}/signin`, { replace: true });
    }
  }, [authLoading, guest, event, eventId, slug, navigate]);

  // Fetch custom pages for nav
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

  // Resolve guest invitations
  const { data: invitedSubEventIds } = useQuery({
    queryKey: ["guest-invitations", guest?.id, event?.id],
    queryFn: async () => {
      if (!guest || !event) return [];
      const { invitations } = await resolveGuestInvitations(supabase, guest.id, event.id);
      return getInvitedSubEventIds(invitations);
    },
    enabled: !!guest && !!event,
  });

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
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
      </div>
    );
  }

  if (!guest) {
    return null; // redirecting to signin
  }

  const theme = jsonToTheme(event.theme);
  const base = `/e/${slug}`;
  const navLinks = [
    { label: "Home", to: `${base}/home` },
    { label: "RSVP", to: `${base}/rsvp` },
    { label: "Wishes", to: `${base}/wishes` },
    { label: "Contact", to: `${base}/contact` },
    ...(customPages ?? []).map((p) => ({
      label: p.nav_label || p.title,
      to: `${base}/p/${p.slug}`,
    })),
  ];

  return (
    <EventThemeProvider theme={event.theme as Json}>
      <div className="min-h-screen">
        {/* Header with hamburger */}
        <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}>
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
            <Link to={`${base}/home`} className="font-semibold" style={{ color: "var(--event-heading)" }}>
              {event.name}
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2"
              aria-label="Toggle menu"
              style={{ color: "var(--event-text)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
          <nav className="sticky top-16 z-20 border-b px-4 py-3" style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}>
            <div className="mx-auto flex max-w-4xl flex-col gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "" : ""}`
                  }
                  style={({ isActive }) => ({ color: isActive ? "var(--event-primary)" : "var(--event-text)" })}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}

        {/* Content */}
        <main>
          <Outlet context={{ event, slug: slug!, theme, invitedSubEventIds: invitedSubEventIds ?? [] } satisfies GuestOutletContext} />
        </main>
      </div>
    </EventThemeProvider>
  );
}
