import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, NavLink, Outlet, Link, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { resolveGuestInvitations, getInvitedSubEventIds, type ResolveResult } from "../../lib/invitations";
import { useGuestAuth } from "../../lib/guest-auth";
import { LoadingSpinner } from "../../components/ui";

export interface GuestOutletContext {
  event: UserEvent;
  slug: string;
  theme: unknown;
  invitedSubEventIds: string[];
}

export function useGuestOutletContext(): GuestOutletContext {
  return useOutletContext<GuestOutletContext>();
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

  const { data: customPages } = useQuery({
    queryKey: ["custom-pages-nav", event?.id],
    queryFn: async () => {
      if (!event) return [];
      const { data, error } = await supabase
        .from("custom_pages")
        .select("id, title, slug, show_in_nav, is_published")
        .eq("event_id", event.id)
        .eq("is_published", true)
        .eq("show_in_nav", true)
        .order("title", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomPage[];
    },
    enabled: !!event,
  });

  const { data: invitations } = useQuery({
    queryKey: ["guest-invitations", guest?.id, event?.id],
    queryFn: async (): Promise<ResolveResult> => {
      if (!guest || !event) return { invitations: [], error: null };
      return resolveGuestInvitations(supabase, guest.id, event.id);
    },
    enabled: !!guest && !!event,
  });

  const invitedSubEventIds = invitations ? getInvitedSubEventIds(invitations) : [];

  // FIX #4: Strict auth enforcement — if no guest session, redirect to sign-in.
  // This catches direct navigation to any protected page.
  useEffect(() => {
    if (!authLoading && event && (!guest || eventId !== event.id)) {
      navigate(`/e/${slug}/signin`, { replace: true });
    }
  }, [authLoading, guest, eventId, event, slug, navigate]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Something went wrong</h1>
        <p className="text-dash-muted">{error instanceof Error ? error.message : "Please try again later."}</p>
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

  // FIX #4: If no valid guest session, render nothing (redirect is in-flight)
  if (!guest || eventId !== event.id) return null;

  // No Contact page in navigation
  const navLinks = [
    { label: "Home", to: `/e/${slug}/home` },
    ...(invitedSubEventIds.length > 0 ? [{ label: "RSVP", to: `/e/${slug}/rsvp` }] : []),
    { label: "Wishes", to: `/e/${slug}/wishes` },
    ...(customPages ?? []).map((p) => ({ label: p.title, to: `/e/${slug}/p/${p.slug}` })),
  ];

  return (
    <EventThemeProvider theme={event.theme}>
      {/* Hamburger icon — no circular background, uses accent colour */}
      <button
        onClick={() => setMenuOpen(true)}
        aria-label="Open navigation menu"
        className="fixed left-4 top-4 z-40 flex h-8 w-8 items-center justify-center transition-all hover:scale-105"
        style={{ color: "var(--event-accent)" }}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Full-screen navigation overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 animate-fadeIn">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeMenu} />
          <div
            className="absolute left-0 top-0 h-full w-full max-w-sm overflow-y-auto shadow-2xl scrollbar-thin"
            style={{ backgroundColor: "var(--event-bg)", borderRight: "1px solid var(--event-border)" }}
          >
            <div className="flex items-center justify-between p-5">
              <h2 className="text-lg font-semibold" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>
                {event.name || "Menu"}
              </h2>
              <button
                onClick={closeMenu}
                aria-label="Close navigation menu"
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-70"
                style={{ color: "var(--event-text)", backgroundColor: "var(--event-surface)", border: "1px solid var(--event-border)" }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-3 pb-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-3 text-base font-medium transition-colors ${isActive ? "opacity-100" : "opacity-70 hover:opacity-100"}`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? "var(--event-primary)" : "var(--event-text)",
                    backgroundColor: isActive ? "var(--event-surface-alt)" : "transparent",
                  })}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      <Outlet context={{ event, slug: slug!, theme: event.theme, invitedSubEventIds } satisfies GuestOutletContext} />
    </EventThemeProvider>
  );
}
