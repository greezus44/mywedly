import { useState } from "react";
import { useParams, useNavigate, NavLink, Link, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME, type ThemeConfig } from "../../lib/theme";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";
import { cn } from "../../lib/utils";
import type { GuestOutletContext } from "./guest-layout";

const RUSTY_THEME_JSON = RUSTY_THEME as unknown as Json;

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { guest, eventId, loading: authLoading } = useGuestAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
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

  const { data: invitedSubEventIds, isLoading: invitationsLoading } = useQuery({
    queryKey: ["guest-invitations", event?.id, guest?.id],
    queryFn: async () => {
      if (!event || !guest) return [];
      const invitations = await resolveGuestInvitations(supabase, guest.id, event.id);
      return getInvitedSubEventIds(invitations);
    },
    enabled: !!event?.id && !!guest?.id,
  });

  // Redirect to sign-in if not authenticated
  if (!authLoading && !guest && event) {
    navigate(`/r/${slug}/signin`, { replace: true });
    return null;
  }

  if (authLoading || eventLoading || (event && guest && eventId === event.id && invitationsLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: RUSTY_THEME.colors.bg }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: RUSTY_THEME.colors.primary }} />
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center" style={{ backgroundColor: RUSTY_THEME.colors.bg, color: RUSTY_THEME.colors.text }}>
        <h1 className="text-2xl font-bold" style={{ color: RUSTY_THEME.colors.heading }}>Invitation Not Found</h1>
        <Link to="/" className="hover:underline" style={{ color: RUSTY_THEME.colors.primary }}>Return home</Link>
      </div>
    );
  }

  // Verify the guest is signed in for the correct event
  if (!guest || eventId !== event.id) {
    navigate(`/r/${slug}/signin`, { replace: true });
    return null;
  }

  const theme: ThemeConfig = RUSTY_THEME;
  const invitedIds = invitedSubEventIds ?? [];
  const hasInvitedEvents = invitedIds.length > 0;

  const navLinks = [
    { to: `/r/${slug}/home`, label: "Home", always: true },
    { to: `/r/${slug}/events`, label: "Events", always: false, show: hasInvitedEvents },
    { to: `/r/${slug}/rsvp`, label: "RSVP", always: false, show: hasInvitedEvents },
    { to: `/r/${slug}/wishes`, label: "Wishes", always: true },
    { to: `/r/${slug}/contact`, label: "Contact", always: true },
  ];

  const headerPages = (customPages ?? []).filter((p) => !p.is_footer);
  const footerPages = (customPages ?? []).filter((p) => p.is_footer);

  const contextValue: GuestOutletContext = {
    event,
    slug: slug!,
    theme,
    invitedSubEventIds: invitedIds,
  };

  return (
    <EventThemeProvider theme={RUSTY_THEME_JSON}>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}>
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link to={`/r/${slug}/home`} className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>
              {event.name}
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.filter((l) => l.always || l.show).map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => cn("guest-nav-link", isActive && "active")}
                >
                  {link.label}
                </NavLink>
              ))}
              {headerPages.map((page) => (
                <NavLink
                  key={page.id}
                  to={`/r/${slug}/p/${page.slug}`}
                  className={({ isActive }) => cn("guest-nav-link", isActive && "active")}
                >
                  {page.nav_label || page.title}
                </NavLink>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ color: "var(--event-text)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="border-t px-4 py-2 md:hidden" style={{ borderColor: "var(--event-border)" }}>
              {navLinks.filter((l) => l.always || l.show).map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => cn("block py-2 text-sm", isActive && "font-semibold")}
                  style={{ color: "var(--event-text)" }}
                >
                  {link.label}
                </NavLink>
              ))}
              {headerPages.map((page) => (
                <NavLink
                  key={page.id}
                  to={`/r/${slug}/p/${page.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => cn("block py-2 text-sm", isActive && "font-semibold")}
                  style={{ color: "var(--event-text)" }}
                >
                  {page.nav_label || page.title}
                </NavLink>
              ))}
            </nav>
          )}
        </header>

        {/* Main Content */}
        <main>
          <Outlet context={contextValue} />
        </main>

        {/* Footer */}
        {footerPages.length > 0 && (
          <footer className="border-t px-4 py-6" style={{ borderColor: "var(--event-border)" }}>
            <div className="mx-auto flex max-w-5xl flex-wrap gap-4">
              {footerPages.map((page) => (
                <Link
                  key={page.id}
                  to={`/r/${slug}/p/${page.slug}`}
                  className="text-sm hover:underline"
                  style={{ color: "var(--event-muted)" }}
                >
                  {page.nav_label || page.title}
                </Link>
              ))}
            </div>
          </footer>
        )}
      </div>
    </EventThemeProvider>
  );
}
