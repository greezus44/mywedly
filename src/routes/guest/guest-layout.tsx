import { useState, useEffect } from "react";
import { Outlet, NavLink, useParams, useNavigate, Link, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type SubEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme, type ThemeConfig } from "../../lib/theme";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";
import { cn } from "../../lib/utils";

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
  const { guestId, eventId } = useGuestAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch published event
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

  // Redirect to signin if not signed in
  useEffect(() => {
    if (!isLoading && event && (!guestId || eventId !== event.id)) {
      navigate(`/e/${slug}/signin`, { replace: true });
    }
  }, [isLoading, event, guestId, eventId, slug, navigate]);

  // Fetch invited sub-event IDs
  const { data: invitedSubEventIds = [] } = useQuery({
    queryKey: ["guest-invited-sub-events", event?.id, guestId],
    queryFn: async () => {
      if (!event || !guestId) return [];
      const invitations = await resolveGuestInvitations(supabase, guestId, event.id);
      return getInvitedSubEventIds(invitations);
    },
    enabled: !!event && !!guestId,
  });

  // Fetch sub-events (only invited ones)
  const { data: subEvents = [] } = useQuery({
    queryKey: ["guest-sub-events", event?.id, invitedSubEventIds],
    queryFn: async () => {
      if (!event || invitedSubEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .in("id", invitedSubEventIds)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!event && invitedSubEventIds.length > 0,
  });

  // Fetch custom pages for nav
  const { data: customPages = [] } = useQuery({
    queryKey: ["guest-custom-pages", event?.id],
    queryFn: async () => {
      if (!event) return [];
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event.id)
        .eq("is_published", true)
        .eq("show_in_nav", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
    enabled: !!event,
  });

  // Fetch footer pages
  const { data: footerPages = [] } = useQuery({
    queryKey: ["guest-footer-pages", event?.id],
    queryFn: async () => {
      if (!event) return [];
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event.id)
        .eq("is_published", true)
        .eq("is_footer", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
    enabled: !!event,
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
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
      </div>
    );
  }

  const theme = jsonToTheme(event.theme);
  const hasInvitedEvents = subEvents.length > 0;

  const navLinks = [
    { label: "Home", to: `/e/${slug}/home`, end: true },
    ...(hasInvitedEvents ? [{ label: "Events", to: `/e/${slug}/events`, end: false }] : []),
    ...(hasInvitedEvents ? [{ label: "RSVP", to: `/e/${slug}/rsvp`, end: false }] : []),
    { label: "Wishes", to: `/e/${slug}/wishes`, end: false },
    { label: "Contact", to: `/e/${slug}/contact`, end: false },
    ...customPages.map((p) => ({
      label: p.nav_label || p.title,
      to: `/e/${slug}/p/${p.slug}`,
      end: false,
    })),
  ];

  return (
    <EventThemeProvider initialTheme={theme}>
      {/* Sticky header with backdrop blur */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          borderColor: "var(--event-border)",
          backgroundColor: "color-mix(in srgb, var(--event-surface) 85%, transparent)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to={`/e/${slug}/home`} className="text-lg font-bold" style={{ color: "var(--event-heading)" }}>
            {event.name}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex md:items-center md:gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => cn("guest-nav-link", isActive && "active")}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            style={{ color: "var(--event-text)" }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="border-t md:hidden" style={{ borderColor: "var(--event-border)" }}>
            <div className="space-y-1 px-4 py-3">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn("block rounded-lg px-3 py-2 text-sm font-medium", isActive && "font-semibold")
                  }
                  style={{ color: "var(--event-text)" }}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main>
        <Outlet context={{ event, slug: slug!, theme, invitedSubEventIds } satisfies GuestOutletContext} />
      </main>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {footerPages.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2">
              {footerPages.map((p) => (
                <Link
                  key={p.id}
                  to={`/e/${slug}/p/${p.slug}`}
                  className="text-sm hover:underline"
                  style={{ color: "var(--event-muted)" }}
                >
                  {p.nav_label || p.title}
                </Link>
              ))}
            </div>
          )}
          <p className="text-sm" style={{ color: "var(--event-muted)" }}>
            © {new Date().getFullYear()} {event.name}
          </p>
        </div>
      </footer>
    </EventThemeProvider>
  );
}
