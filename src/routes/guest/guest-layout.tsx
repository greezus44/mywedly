import { useState, useEffect, useMemo } from "react";
import { Outlet, useParams, useNavigate, NavLink, Link, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";

export interface GuestOutletContext {
  event: UserEvent;
  slug: string;
  theme: ReturnType<typeof jsonToTheme>;
  invitedSubEventIds: string[];
}

export function useGuestOutletContext(): GuestOutletContext {
  const ctx = (useOutletContext() as GuestOutletContext | null) ?? null;
  if (!ctx) {
    throw new Error("useGuestOutletContext must be used within a GuestLayout");
  }
  return ctx;
}

export default function GuestLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guest, eventId, loading: authLoading } = useGuestAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: event, isLoading, isError, error } = useQuery({
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

  // Resolve invitations for the signed-in guest
  const { data: invitedSubEventIds } = useQuery({
    queryKey: ["guest-invitations", event?.id, guest?.id],
    queryFn: async () => {
      if (!event || !guest) return [] as string[];
      const { invitations } = await resolveGuestInvitations(supabase, guest.id, event.id);
      return getInvitedSubEventIds(invitations);
    },
    enabled: !!event && !!guest,
  });

  // Fetch custom pages that should appear in the nav
  const { data: navPages } = useQuery({
    queryKey: ["guest-nav-pages", event?.id],
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
    enabled: !!event,
  });

  const isAuthed = !!guest && !!event && eventId === event.id;

  // Redirect to sign-in if not authenticated (once auth + event have loaded)
  useEffect(() => {
    if (!authLoading && !isLoading && event && !isAuthed) {
      navigate(`/e/${slug}/signin`, { replace: true });
    }
  }, [authLoading, isLoading, event, isAuthed, slug, navigate]);

  const theme = useMemo(() => jsonToTheme(event?.theme), [event?.theme]);

  // Loading
  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );
  }

  // Error / not found
  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Something went wrong</h1>
        <p className="text-dash-muted">{error?.message ?? "Failed to load invitation."}</p>
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
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

  // Not authenticated — render nothing (redirect is in flight)
  if (!isAuthed) {
    return null;
  }

  const subEventIds = invitedSubEventIds ?? [];
  const navLinks = [
    { label: "Home", to: `/e/${slug}/home` },
    ...(subEventIds.length > 0 ? [{ label: "RSVP", to: `/e/${slug}/rsvp` }] : []),
    { label: "Wishes", to: `/e/${slug}/wishes` },
    { label: "Contact", to: `/e/${slug}/contact` },
    ...(navPages ?? []).map((p) => ({
      label: p.nav_label || p.title,
      to: `/e/${slug}/p/${p.slug}`,
    })),
  ];

  return (
    <EventThemeProvider theme={event.theme}>
      <div className="min-h-screen">
        {/* Hamburger header */}
        <header className="sticky top-0 z-40" style={{ backgroundColor: "var(--event-bg)", borderBottom: "1px solid var(--event-border)" }}>
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link to={`/e/${slug}/home`} className="text-sm font-semibold" style={{ color: "var(--event-heading)" }}>
              {event.name}
            </Link>
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-md"
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

          {/* Slide-down menu */}
          {menuOpen && (
            <nav className="border-t" style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-bg)" }}>
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
        </header>

        <main>
          <Outlet context={{ event, slug: slug!, theme, invitedSubEventIds: subEventIds } satisfies GuestOutletContext} />
        </main>
      </div>
    </EventThemeProvider>
  );
}
