import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import { resolveGuestInvitations } from "../../lib/invitations";
import { type GuestOutletContext } from "./guest-layout";

export function useRustyOutletContext(): GuestOutletContext {
  return useOutletContext<GuestOutletContext>();
}

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guestId, eventId } = useGuestAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const { data: invitedSubEventIds = [] } = useQuery({
    queryKey: ["invited-sub-events", event?.id, guestId],
    queryFn: async () => {
      if (!event || !guestId) return [];
      const resolved = await resolveGuestInvitations(event.id, guestId);
      return resolved?.invitedSubEventIds ?? [];
    },
    enabled: !!event && !!guestId,
  });

  const { data: pages = [] } = useQuery({
    queryKey: ["guest-custom-pages", event?.id],
    queryFn: async () => {
      if (!event) return [];
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event.id)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomPage[];
    },
    enabled: !!event,
  });

  // Redirect to rustic sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && event && (!guestId || eventId !== event.id)) {
      navigate(`/r/${slug}/signin`, { replace: true });
    }
  }, [isLoading, event, guestId, eventId, slug, navigate]);

  if (isLoading || !event || !guestId || eventId !== event.id) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: RUSTY_THEME.bg }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: RUSTY_THEME.primary }} />
      </div>
    );
  }

  const navPages = pages.filter((p) => p.show_in_nav && !p.is_footer);
  const footerPages = pages.filter((p) => p.is_footer);
  const hasInvites = invitedSubEventIds.length > 0;

  const navItems = [
    { label: "Home", to: `/r/${slug}/home`, end: true, show: true },
    { label: "Events", to: `/r/${slug}/events`, end: false, show: hasInvites },
    { label: "RSVP", to: `/r/${slug}/rsvp`, end: false, show: hasInvites },
    { label: "Wishes", to: `/r/${slug}/wishes`, end: false, show: true },
    { label: "Contact", to: `/r/${slug}/contact`, end: false, show: true },
    ...navPages.map((p) => ({
      label: p.nav_label || p.title,
      to: `/r/${slug}/p/${p.slug}`,
      end: true,
      show: true,
    })),
  ].filter((n) => n.show);

  const ctx: GuestOutletContext = { event, slug: slug!, theme: RUSTY_THEME, invitedSubEventIds };

  return (
    <EventThemeProvider theme={event.theme}>
      {/* Sticky header with backdrop blur */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: `color-mix(in srgb, ${RUSTY_THEME.surface} 88%, transparent)`,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderColor: RUSTY_THEME.border,
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to={`/r/${slug}/home`} className="font-semibold" style={{ color: RUSTY_THEME.heading, fontFamily: RUSTY_THEME.fontHeading }}>
            {event.title || "MyWedly"}
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden items-center md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `guest-nav-link${isActive ? " active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            style={{ color: RUSTY_THEME.text }}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="border-t md:hidden" style={{ borderColor: RUSTY_THEME.border, backgroundColor: RUSTY_THEME.surface }}>
            <div className="flex flex-col px-4 py-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `guest-nav-link${isActive ? " active" : ""}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Page content */}
      <main className="animate-fadeIn">
        <Outlet context={ctx} />
      </main>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: RUSTY_THEME.border, backgroundColor: RUSTY_THEME.surface }}>
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="mb-4 text-sm font-semibold" style={{ color: RUSTY_THEME.heading, fontFamily: RUSTY_THEME.fontHeading }}>
            {event.title || "MyWedly"}
          </p>
          {footerPages.length > 0 && (
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {footerPages.map((p) => (
                <NavLink
                  key={p.id}
                  to={`/r/${slug}/p/${p.slug}`}
                  className="text-sm hover:underline"
                  style={{ color: RUSTY_THEME.muted }}
                >
                  {p.nav_label || p.title}
                </NavLink>
              ))}
            </nav>
          )}
          <p className="mt-6 text-xs" style={{ color: RUSTY_THEME.muted }}>Made with MyWedly</p>
        </div>
      </footer>
    </EventThemeProvider>
  );
}
