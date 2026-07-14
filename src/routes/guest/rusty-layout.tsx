import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";
import { LoadingSpinner } from "../../components/ui";
import type { GuestOutletContext } from "./guest-layout";

export { useGuestOutletContext } from "./guest-layout";
export type { GuestOutletContext } from "./guest-layout";

export default function RustyLayout(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guestName, eventId, guestId, signOut } = useGuestAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: event, isLoading, error } = useQuery({
    queryKey: ["guest-event", slug],
    enabled: !!slug,
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
  });

  useEffect(() => {
    if (!isLoading && event && eventId !== event.id) {
      navigate(`/r/${slug}`, { replace: true });
    }
  }, [isLoading, event, eventId, slug, navigate]);

  const { data: pages } = useQuery({
    queryKey: ["guest-custom-pages", event?.id],
    enabled: !!event?.id,
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
  });

  const { data: footerPages } = useQuery({
    queryKey: ["guest-footer-pages", event?.id],
    enabled: !!event?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event!.id)
        .eq("is_published", true)
        .eq("is_footer", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomPage[];
    },
  });

  const { data: invitedSubEventIds } = useQuery({
    queryKey: ["guest-invitations", event?.id, guestId],
    enabled: !!event?.id && !!guestId,
    queryFn: async () => {
      const invitations = await resolveGuestInvitations(supabase, guestId!, event!.id);
      return getInvitedSubEventIds(invitations);
    },
  });

  const hasInvitedEvents = (invitedSubEventIds ?? []).length > 0;

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900"><LoadingSpinner className="h-8 w-8 text-white" /></div>;
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 px-6 text-center">
        <p className="text-lg text-white/80">This invitation website could not be found or is no longer available.</p>
      </div>
    );
  }

  const navPages = pages ?? [];
  const fPages = footerPages ?? [];
  const invitedIds = invitedSubEventIds ?? [];
  const baseLink = `/r/${slug}`;

  const navItems: { label: string; to: string; show: boolean }[] = [
    { label: "Home", to: `${baseLink}/home`, show: true },
    { label: "Events", to: `${baseLink}/events`, show: hasInvitedEvents },
    { label: "RSVP", to: `${baseLink}/rsvp`, show: hasInvitedEvents },
    { label: "Wishes", to: `${baseLink}/wishes`, show: true },
    { label: "Contact", to: `${baseLink}/contact`, show: true },
    ...navPages.map((p) => ({ label: p.nav_label ?? p.title, to: `${baseLink}/p/${p.slug}`, show: true })),
  ];

  const ctx: GuestOutletContext = { event, slug: slug!, theme: RUSTY_THEME, invitedSubEventIds: invitedIds };

  return (
    <EventThemeProvider initialTheme={RUSTY_THEME}>
      <div className="event-themed min-h-screen">
        <header className="sticky top-0 z-40 border-b backdrop-blur-md" style={{ borderColor: RUSTY_THEME.border, background: "rgba(42,31,26,0.85)" }}>
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex h-16 items-center justify-between">
              <Link to={`${baseLink}/home`} className="text-lg font-semibold" style={{ color: RUSTY_THEME.heading, fontFamily: RUSTY_THEME.fontHeading }}>
                {event.name}
              </Link>
              <nav className="hidden items-center gap-1 md:flex">
                {navItems.filter((n) => n.show).map((item) => (
                  <NavLink key={item.to} to={item.to} className={({ isActive }) => `guest-nav-link${isActive ? " active" : ""}`}>
                    {item.label}
                  </NavLink>
                ))}
                <button onClick={() => { signOut(); navigate(`/r/${slug}`); }} className="guest-nav-link">Sign Out</button>
              </nav>
              <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu" style={{ color: RUSTY_THEME.text }}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
          {mobileOpen && (
            <nav className="border-t px-4 py-3 md:hidden" style={{ borderColor: RUSTY_THEME.border }}>
              <div className="flex flex-col gap-1">
                {navItems.filter((n) => n.show).map((item) => (
                  <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `guest-nav-link text-left${isActive ? " active" : ""}`}>
                    {item.label}
                  </NavLink>
                ))}
                <button onClick={() => { signOut(); navigate(`/r/${slug}`); }} className="guest-nav-link text-left">Sign Out</button>
              </div>
            </nav>
          )}
        </header>

        <main><Outlet context={ctx} /></main>

        <footer className="border-t px-4 py-12" style={{ borderColor: RUSTY_THEME.border }}>
          <div className="mx-auto max-w-5xl text-center">
            {fPages.length > 0 && (
              <nav className="mb-6 flex flex-wrap items-center justify-center gap-4">
                {fPages.map((p) => (
                  <Link key={p.id} to={`${baseLink}/p/${p.slug}`} className="text-sm transition" style={{ color: RUSTY_THEME.muted }}>
                    {p.nav_label ?? p.title}
                  </Link>
                ))}
              </nav>
            )}
            <p className="text-xs" style={{ color: RUSTY_THEME.muted }}>
              {event.name} • {event.event_date ? new Date(event.event_date).getFullYear() : ""} • Made with MyWedly
            </p>
          </div>
        </footer>
      </div>
    </EventThemeProvider>
  );
}
