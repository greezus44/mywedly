import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, NavLink, Link, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme, RUSTY_THEME, type ThemeConfig as ThemeConfigType } from "../../lib/theme";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";
import { cn } from "../../lib/utils";
import { useGuestOutletContext, type GuestOutletContext } from "./guest-layout";

// Re-export so rusty child routes can import from ./rusty-layout
export { useGuestOutletContext };
export type { GuestOutletContext };

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { guest, eventId, loading: authLoading } = useGuestAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ["published-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  const { data: customPages } = useQuery({
    queryKey: ["guest-custom-pages", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_pages").select("*").eq("event_id", event!.id).eq("is_published", true).eq("show_in_nav", true).order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomPage[];
    },
    enabled: !!event?.id,
  });

  const { data: invitedSubEventIds, isLoading: invitationsLoading } = useQuery({
    queryKey: ["guest-invitations", event?.id, guest?.id],
    queryFn: async () => {
      if (!event || !guest) return [];
      const result = await resolveGuestInvitations(supabase, guest.id, event.id);
      return getInvitedSubEventIds(result.invitations);
    },
    enabled: !!event?.id && !!guest?.id,
  });

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen]);

  // Redirect to /r/:slug/signin (not /e/:slug/signin)
  if (!authLoading && !guest && event) { navigate(`/r/${slug}/signin`, { replace: true }); return null; }
  if (authLoading || eventLoading || (event && guest && eventId === event.id && invitationsLoading))
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );
  if (eventError || !event)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Invitation Not Found</h1>
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
      </div>
    );
  if (!guest || eventId !== event.id) { navigate(`/r/${slug}/signin`, { replace: true }); return null; }

  // Use published theme, but fall back to RUSTY_THEME if none set
  const theme: ThemeConfigType = event.theme ? jsonToTheme(event.theme) : RUSTY_THEME;
  const themeJson: Json = event.theme ?? (RUSTY_THEME as unknown as Json);
  const invitedIds = invitedSubEventIds ?? [];
  const hasInvitedEvents = invitedIds.length > 0;
  const headerPages = (customPages ?? []).filter((p) => !p.is_footer);
  const footerPages = (customPages ?? []).filter((p) => p.is_footer);

  // Menu items use /r/ prefix
  const menuItems = [
    { to: `/r/${slug}/home`, label: "Home" },
    ...(hasInvitedEvents ? [{ to: `/r/${slug}/rsvp`, label: "RSVP" }] : []),
    { to: `/r/${slug}/wishes`, label: "Wishes" },
    { to: `/r/${slug}/contact`, label: "Contact" },
    ...headerPages.map((p) => ({ to: `/r/${slug}/p/${p.slug}`, label: p.nav_label || p.title })),
  ];
  const contextValue: GuestOutletContext = { event, slug: slug!, theme, invitedSubEventIds: invitedIds };

  return (
    <EventThemeProvider theme={themeJson}>
      <div className="min-h-screen">
        {/* Hamburger menu — same as guest-layout */}
        <div ref={menuRef} className="fixed left-4 top-4 z-50">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            aria-controls="rusty-nav-menu"
            className="flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: "var(--event-surface)",
              border: "1px solid var(--event-border)",
              color: "var(--event-text)",
              boxShadow: menuOpen ? "0 4px 20px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex h-5 w-5 flex-col items-center justify-center gap-[5px]">
              <span className="block h-[2px] w-5 rounded-full transition-all duration-300" style={{ backgroundColor: "var(--event-text)", transform: menuOpen ? "translateY(7px) rotate(45deg)" : "none" }} />
              <span className="block h-[2px] w-5 rounded-full transition-all duration-300" style={{ backgroundColor: "var(--event-text)", opacity: menuOpen ? 0 : 1 }} />
              <span className="block h-[2px] w-5 rounded-full transition-all duration-300" style={{ backgroundColor: "var(--event-text)", transform: menuOpen ? "translateY(-7px) rotate(-45deg)" : "none" }} />
            </div>
          </button>
          {menuOpen && (
            <nav
              id="rusty-nav-menu"
              role="menu"
              aria-label="Rustic navigation"
              className="absolute left-0 top-14 w-64 origin-top-left animate-scaleIn rounded-2xl py-2 shadow-xl"
              style={{ backgroundColor: "var(--event-surface)", border: "1px solid var(--event-border)" }}
            >
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  className={({ isActive }) => cn("block px-5 py-3 text-sm font-medium transition-colors", isActive && "font-semibold")}
                  style={({ isActive }) => ({
                    color: isActive ? "var(--event-primary)" : "var(--event-text)",
                    backgroundColor: isActive ? "var(--event-surface-alt)" : "transparent",
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>

        <main>
          <Outlet context={contextValue} />
        </main>

        {footerPages.length > 0 && (
          <footer className="border-t px-4 py-6" style={{ borderColor: "var(--event-border)" }}>
            <div className="mx-auto flex max-w-5xl flex-wrap gap-4">
              {footerPages.map((page) => (
                <Link key={page.id} to={`/r/${slug}/p/${page.slug}`} className="text-sm hover:underline" style={{ color: "var(--event-muted)" }}>
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
