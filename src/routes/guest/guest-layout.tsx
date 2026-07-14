import { useParams, Outlet, Navigate, useOutletContext, Link, NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme, type ThemeConfig } from "../../lib/theme";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";
import { cn } from "../../lib/utils";
import { useState } from "react";

export interface GuestOutletContext {
  event: UserEvent;
  slug: string;
  theme: ThemeConfig;
  invitedSubEventIds: string[];
}

export default function GuestLayout() {
  const { slug } = useParams<{ slug: string }>();
  const { guestId, eventId, signOut } = useGuestAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      return data as CustomPage[];
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
        .eq("is_published", true)
        .eq("is_footer", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
    enabled: !!event?.id,
  });

  const { data: invitedSubEventIds } = useQuery({
    queryKey: ["guest-invited-sub-events", event?.id, guestId],
    queryFn: async () => {
      const invitations = await resolveGuestInvitations(supabase, guestId!, event!.id);
      return getInvitedSubEventIds(invitations);
    },
    enabled: !!event?.id && !!guestId,
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
        <p className="text-dash-muted">This invitation website could not be found or is no longer available.</p>
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
      </div>
    );
  }

  if (!guestId || eventId !== event.id) {
    return <Navigate to={`/e/${slug}`} replace />;
  }

  const theme = jsonToTheme(event.theme);
  const invitedIds = invitedSubEventIds ?? [];
  const logoConfig = (event.logo_config ?? {}) as { url?: string };

  const navItems = [
    { to: `/e/${slug}/home`, label: "Home", always: true },
    { to: `/e/${slug}/events`, label: "Events", always: invitedIds.length > 0 },
    { to: `/e/${slug}/rsvp`, label: "RSVP", always: invitedIds.length > 0 },
    { to: `/e/${slug}/wishes`, label: "Wishes", always: true },
    { to: `/e/${slug}/contact`, label: "Contact", always: true },
  ];

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="min-h-screen">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}>
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
            <Link to={`/e/${slug}/home`} className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>
              {logoConfig.url && <img src={logoConfig.url} alt="" className="h-7 w-auto" />}
              {!logoConfig.url && event.name}
            </Link>

            {/* Desktop nav */}
            <div className="hidden items-center gap-1 md:flex">
              {navItems.filter(n => n.always).map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("guest-nav-link", isActive && "active")}>
                  {item.label}
                </NavLink>
              ))}
              {navPages?.map((page) => (
                <NavLink key={page.id} to={`/e/${slug}/p/${page.slug}`} className={({ isActive }) => cn("guest-nav-link", isActive && "active")}>
                  {page.nav_label || page.title}
                </NavLink>
              ))}
              <button
                onClick={() => { signOut(); window.location.href = `/e/${slug}`; }}
                className="guest-nav-link"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 md:hidden"
              style={{ color: "var(--event-text)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

          {/* Mobile nav */}
          {mobileMenuOpen && (
            <div className="border-t md:hidden" style={{ borderColor: "var(--event-border)" }}>
              <div className="flex flex-col px-4 py-3">
                {navItems.filter(n => n.always).map((item) => (
                  <NavLink key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => cn("guest-nav-link text-left", isActive && "active")}>
                    {item.label}
                  </NavLink>
                ))}
                {navPages?.map((page) => (
                  <NavLink key={page.id} to={`/e/${slug}/p/${page.slug}`} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => cn("guest-nav-link text-left", isActive && "active")}>
                    {page.nav_label || page.title}
                  </NavLink>
                ))}
                <button
                  onClick={() => { signOut(); window.location.href = `/e/${slug}`; }}
                  className="guest-nav-link text-left"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Main content */}
        <main className="mx-auto max-w-5xl">
          <Outlet context={{ event, slug: slug!, theme, invitedSubEventIds: invitedIds } satisfies GuestOutletContext} />
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t px-4 py-10 md:px-6" style={{ borderColor: "var(--event-border)" }}>
          <div className="mx-auto max-w-5xl">
            {footerPages && footerPages.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-6 text-sm" style={{ color: "var(--event-muted)" }}>
                {footerPages.map((page) => (
                  <Link key={page.id} to={`/e/${slug}/p/${page.slug}`} className="hover:underline">
                    {page.nav_label || page.title}
                  </Link>
                ))}
              </div>
            )}
            <p className="text-sm opacity-50" style={{ color: "var(--event-muted)" }}>
              {event.name}
            </p>
          </div>
        </footer>
      </div>
    </EventThemeProvider>
  );
}

export function useGuestOutletContext() {
  return useOutletContext<GuestOutletContext>();
}
