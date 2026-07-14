import { useState } from "react";
import { useParams, useNavigate, NavLink, Outlet, Link, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { resolveGuestInvitations } from "../../lib/invitations";

export interface GuestOutletContext {
  event: UserEvent;
  slug: string;
  theme: Json | null | undefined;
  invitedSubEventIds: string[];
}

export function useGuestOutletContext(): GuestOutletContext {
  return useOutletContext<GuestOutletContext>();
}

interface NavPage {
  slug: string;
  title: string;
  nav_label: string;
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

  const { data: navPages } = useQuery({
    queryKey: ["guest-nav-pages", event?.id],
    queryFn: async () => {
      if (!event) return [] as NavPage[];
      const { data, error } = await supabase
        .from("custom_pages")
        .select("slug, title, nav_label")
        .eq("event_id", event.id)
        .eq("is_published", true)
        .eq("show_in_nav", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as NavPage[];
    },
    enabled: !!event,
  });

  const { data: invitedSubEventIds } = useQuery({
    queryKey: ["guest-invitations", event?.id, guest?.id],
    queryFn: async () => {
      if (!event || !guest) return [] as string[];
      const result = await resolveGuestInvitations(supabase, guest.id, event.id);
      return result.invitations.filter((i) => i.isInvited).map((i) => i.subEventId);
    },
    enabled: !!event && !!guest,
  });

  // Redirect to sign-in if not authenticated
  const shouldRedirect = !authLoading && !eventLoading && !!event && (!guest || eventId !== event.id);
  if (shouldRedirect) {
    navigate(`/e/${slug}/signin`, { replace: true });
  }

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
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
      </div>
    );
  }

  const context: GuestOutletContext = {
    event,
    slug: slug!,
    theme: event.theme,
    invitedSubEventIds: invitedSubEventIds ?? [],
  };

  const pages = navPages ?? [];

  return (
    <EventThemeProvider theme={event.theme}>
      <div className="relative min-h-screen">
        {/* Hamburger header */}
        <header className="sticky top-0 z-30" style={{ backgroundColor: "var(--event-surface)", borderBottom: "1px solid var(--event-border)" }}>
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link to={`/e/${slug}/home`} className="text-sm font-semibold" style={{ color: "var(--event-heading)" }}>
              {event.name || "Our Event"}
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md p-2 transition-colors"
              style={{ color: "var(--event-text)" }}
              aria-label="Menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </header>

        {/* Slide-down menu */}
        {menuOpen && (
          <nav className="absolute left-0 right-0 top-full z-20 border-b shadow-lg" style={{ backgroundColor: "var(--event-surface)", borderColor: "var(--event-border)" }}>
            <div className="mx-auto max-w-5xl px-4 py-3">
              <div className="flex flex-col gap-1">
                <MenuLink to={`/e/${slug}/home`} label="Home" onNavigate={() => setMenuOpen(false)} />
                {(invitedSubEventIds ?? []).length > 0 && (
                  <MenuLink to={`/e/${slug}/rsvp`} label="RSVP" onNavigate={() => setMenuOpen(false)} />
                )}
                <MenuLink to={`/e/${slug}/wishes`} label="Wishes" onNavigate={() => setMenuOpen(false)} />
                <MenuLink to={`/e/${slug}/contact`} label="Contact" onNavigate={() => setMenuOpen(false)} />
                {pages.map((p) => (
                  <MenuLink key={p.slug} to={`/e/${slug}/p/${p.slug}`} label={p.nav_label || p.title} onNavigate={() => setMenuOpen(false)} />
                ))}
              </div>
            </div>
          </nav>
        )}

        {/* Page content */}
        <main>
          <Outlet context={context} />
        </main>
      </div>
    </EventThemeProvider>
  );
}

function MenuLink({ to, label, onNavigate }: { to: string; label: string; onNavigate: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `guest-nav-link ${isActive ? "active" : ""}`
      }
    >
      {label}
    </NavLink>
  );
}
