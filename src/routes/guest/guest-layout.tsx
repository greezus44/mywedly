import React, { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink, Outlet, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { DEFAULT_THEME, type ThemeConfig } from "../../lib/theme";
import { cn } from "../../lib/utils";

export default function GuestLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guestName, eventId, signOut } = useGuestAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Query the event by slug to get theme config
  const { data: event, isLoading, error } = useQuery({
    queryKey: ["published_event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  // Redirect to cover if guest is not signed in or signed in for a different event
  useEffect(() => {
    if (!isLoading && event && (!guestName || eventId !== event.id)) {
      navigate(`/e/${slug}`, { replace: true });
    }
  }, [isLoading, event, guestName, eventId, slug, navigate]);

  // Query custom pages for navigation
  const { data: navPages } = useQuery({
    queryKey: ["guest_nav_pages", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event!.id)
        .eq("show_in_nav", true)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
    enabled: !!event?.id,
  });

  // Query custom pages for footer
  const { data: footerPages } = useQuery({
    queryKey: ["guest_footer_pages", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event!.id)
        .eq("is_footer", true)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
    enabled: !!event?.id,
  });

  const theme = (event?.theme || DEFAULT_THEME) as ThemeConfig;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-amber-700 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Error or not found
  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <p className="text-lg text-gray-700 mb-4">
            This invitation website could not be found or is no longer available.
          </p>
          <Link to="/" className="text-amber-700 underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  // If not signed in, show redirecting state (useEffect will handle navigation)
  if (!guestName || eventId !== event.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-amber-700 border-t-transparent rounded-full" />
      </div>
    );
  }

  const navItems = [
    { to: `/e/${slug}/home`, label: "Home", end: false },
    { to: `/e/${slug}/events`, label: "Events", end: false },
    { to: `/e/${slug}/rsvp`, label: "RSVP", end: false },
    { to: `/e/${slug}/wishes`, label: "Wishes", end: false },
    { to: `/e/${slug}/contact`, label: "Contact", end: false },
    ...((navPages || []).map((p) => ({
      to: `/e/${slug}/p/${p.slug}`,
      label: p.nav_label || p.title,
      end: false,
    }))),
  ];

  function handleSignOut() {
    signOut();
    navigate(`/e/${slug}`, { replace: true });
  }

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header
          className="sticky top-0 z-30 backdrop-blur-sm border-b"
          style={{
            backgroundColor: "var(--event-surface)",
            borderColor: "var(--event-border)",
          }}
        >
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo / Event name */}
              <Link to={`/e/${slug}/home`} className="font-event text-lg" style={{ color: "var(--event-heading)" }}>
                {event.name}
              </Link>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "whitespace-nowrap px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "text-[var(--event-primary)]"
                          : "text-[var(--event-muted)] hover:text-[var(--event-text)]",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              {/* Guest info + sign out */}
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm" style={{ color: "var(--event-muted)" }}>
                  Hi, {guestName}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm underline"
                  style={{ color: "var(--event-primary)" }}
                >
                  Sign out
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2"
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ color: "var(--event-text)" }}
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
              <nav className="md:hidden pb-4 space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "block px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "text-[var(--event-primary)] bg-[var(--event-surface-alt)]"
                          : "text-[var(--event-muted)] hover:text-[var(--event-text)]",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                <div className="pt-2 border-t" style={{ borderColor: "var(--event-border)" }}>
                  <span className="block px-3 py-1 text-sm" style={{ color: "var(--event-muted)" }}>
                    Hi, {guestName}
                  </span>
                  <button
                    onClick={() => { setMenuOpen(false); handleSignOut(); }}
                    className="block px-3 py-2 text-sm underline text-left w-full"
                    style={{ color: "var(--event-primary)" }}
                  >
                    Sign out
                  </button>
                </div>
              </nav>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          <Outlet context={{ event }} />
        </main>

        {/* Footer */}
        <footer
          className="border-t mt-auto"
          style={{
            borderColor: "var(--event-border)",
            backgroundColor: "var(--event-surface)",
          }}
        >
          <div className="max-w-5xl mx-auto px-4 py-8">
            <p className="font-event text-lg mb-4 text-center" style={{ color: "var(--event-heading)" }}>
              {event.name}
            </p>
            {footerPages && footerPages.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 mb-4">
                {footerPages.map((page) => (
                  <Link
                    key={page.id}
                    to={`/e/${slug}/p/${page.slug}`}
                    className="text-sm underline"
                    style={{ color: "var(--event-primary)" }}
                  >
                    {page.nav_label || page.title}
                  </Link>
                ))}
              </div>
            )}
            <p className="text-xs text-center" style={{ color: "var(--event-muted)" }}>
              Made with MyWedly
            </p>
          </div>
        </footer>
      </div>
    </EventThemeProvider>
  );
}
