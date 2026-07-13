import React from "react";
import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import { useGuestAuth } from "../../lib/guest-auth";
import { cn } from "../../lib/utils";

const BASE_NAV = [
  { label: "Home", to: "home", end: false },
  { label: "Events", to: "events", end: false },
  { label: "RSVP", to: "rsvp", end: false },
  { label: "Wishes", to: "wishes", end: false },
  { label: "Contact", to: "contact", end: false },
];

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guestName, eventId, signOut } = useGuestAuth();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["guest-event", slug],
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

  const { data: navPages } = useQuery({
    queryKey: ["guest-nav-pages", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event!.id)
        .eq("show_in_nav", true)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomPage[];
    },
    enabled: !!event?.id,
  });

  const { data: footerPages } = useQuery({
    queryKey: ["guest-footer-pages", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event!.id)
        .eq("is_footer", true)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomPage[];
    },
    enabled: !!event?.id,
  });

  // Redirect to cover if not signed in for this event
  React.useEffect(() => {
    if (!isLoading && event && (!guestName || eventId !== event.id)) {
      navigate(`/r/${slug}`, { replace: true });
    }
  }, [isLoading, event, guestName, eventId, slug, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading…</div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center">
        <p className="text-lg text-gray-600">
          This invitation website could not be found or is no longer available.
        </p>
        <Link to="/" className="text-sm font-semibold text-blue-600 hover:underline">
          Go to homepage
        </Link>
      </div>
    );
  }

  if (!guestName || eventId !== event.id) {
    return null;
  }

  const handleSignOut = () => {
    signOut();
    navigate(`/r/${slug}`);
  };

  return (
    <EventThemeProvider initialTheme={RUSTY_THEME}>
      <div className="flex min-h-screen flex-col">
        {/* Header / Nav */}
        <header className="sticky top-0 z-20 border-b" style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}>
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link to={`/r/${slug}/home`} className="text-lg font-bold" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>
              {event.name}
            </Link>
            <div className="text-sm" style={{ color: "var(--event-muted)" }}>
              Hi, {guestName}
            </div>
          </div>
          <nav className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-4 pb-2 scrollbar-thin">
            {BASE_NAV.map((tab) => (
              <NavLink
                key={tab.label}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "text-white" : "hover:opacity-80",
                  )
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? "var(--event-primary)" : "transparent",
                  color: isActive ? "var(--event-primary-fg)" : "var(--event-muted)",
                })}
              >
                {tab.label}
              </NavLink>
            ))}
            {(navPages ?? []).map((page) => (
              <NavLink
                key={page.id}
                to={`p/${page.slug}`}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "text-white" : "hover:opacity-80",
                  )
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? "var(--event-primary)" : "transparent",
                  color: isActive ? "var(--event-primary-fg)" : "var(--event-muted)",
                })}
              >
                {page.nav_label || page.title}
              </NavLink>
            ))}
          </nav>
        </header>

        {/* Main content */}
        <main className="flex-1">
          <Outlet context={{ event }} />
        </main>

        {/* Footer */}
        <footer className="border-t px-4 py-8" style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}>
          <div className="mx-auto max-w-4xl text-center">
            {(footerPages ?? []).length > 0 && (
              <div className="mb-4 flex flex-wrap justify-center gap-4">
                {(footerPages ?? []).map((page) => (
                  <Link
                    key={page.id}
                    to={`p/${page.slug}`}
                    className="text-sm hover:underline"
                    style={{ color: "var(--event-muted)" }}
                  >
                    {page.nav_label || page.title}
                  </Link>
                ))}
              </div>
            )}
            <p className="text-sm" style={{ color: "var(--event-muted)" }}>
              {event.name}
            </p>
            <button
              onClick={handleSignOut}
              className="mt-2 text-xs hover:underline"
              style={{ color: "var(--event-muted)" }}
            >
              Sign out
            </button>
          </div>
        </footer>
      </div>
    </EventThemeProvider>
  );
}
