import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme, type ThemeConfig } from "../../lib/theme";
import { resolveGuestInvitations } from "../../lib/invitations";

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

  // Resolve invited sub-event ids for the signed-in guest
  const { data: invitedSubEventIds = [] } = useQuery({
    queryKey: ["invited-sub-events", event?.id, guestId],
    queryFn: async () => {
      if (!event || !guestId) return [];
      const resolved = await resolveGuestInvitations(event.id, guestId);
      return resolved?.invitedSubEventIds ?? [];
    },
    enabled: !!event && !!guestId,
  });

  // Fetch nav + footer custom pages
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

  // Redirect to sign-in if not authenticated for this event
  useEffect(() => {
    if (!isLoading && event && (!guestId || eventId !== event.id)) {
      navigate(`/e/${slug}/signin`, { replace: true });
    }
  }, [isLoading, event, guestId, eventId, slug, navigate]);

  if (isLoading || !event || !guestId || eventId !== event.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );
  }

  const theme = jsonToTheme(event.theme);
  const navPages = pages.filter((p) => p.show_in_nav && !p.is_footer);
  const footerPages = pages.filter((p) => p.is_footer);
  const hasInvites = invitedSubEventIds.length > 0;

  const navItems = [
    { label: "Home", to: `/e/${slug}/home`, end: true, show: true },
    { label: "Events", to: `/e/${slug}/events`, end: false, show: hasInvites },
    { label: "RSVP", to: `/e/${slug}/rsvp`, end: false, show: hasInvites },
    { label: "Wishes", to: `/e/${slug}/wishes`, end: false, show: true },
    { label: "Contact", to: `/e/${slug}/contact`, end: false, show: true },
    ...navPages.map((p) => ({
      label: p.nav_label || p.title,
      to: `/e/${slug}/p/${p.slug}`,
      end: true,
      show: true,
    })),
  ].filter((n) => n.show);

  const ctx: GuestOutletContext = { event, slug: slug!, theme, invitedSubEventIds };

  return (
    <EventThemeProvider theme={event.theme}>
      {/* Sticky header with backdrop blur */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: `color-mix(in srgb, ${theme.surface} 88%, transparent)`,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderColor: theme.border,
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to={`/e/${slug}/home`} className="font-semibold" style={{ color: theme.heading, fontFamily: theme.fontHeading }}>
            {event.title || "MyWedly"}
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden items-center md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `guest-nav-link${isActive ? " active" : ""}`
                }
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
            style={{ color: theme.text }}
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
          <nav className="border-t md:hidden" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
            <div className="flex flex-col px-4 py-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `guest-nav-link${isActive ? " active" : ""}`
                  }
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
      <footer className="border-t" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="mb-4 text-sm font-semibold" style={{ color: theme.heading, fontFamily: theme.fontHeading }}>
            {event.title || "MyWedly"}
          </p>
          {footerPages.length > 0 && (
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {footerPages.map((p) => (
                <NavLink
                  key={p.id}
                  to={`/e/${slug}/p/${p.slug}`}
                  className="text-sm hover:underline"
                  style={{ color: theme.muted }}
                >
                  {p.nav_label || p.title}
                </NavLink>
              ))}
            </nav>
          )}
          <p className="mt-6 text-xs" style={{ color: theme.muted }}>
            Made with MyWedly
          </p>
        </div>
      </footer>
    </EventThemeProvider>
  );
}
