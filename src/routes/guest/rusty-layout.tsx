import { useParams, Outlet, Navigate, useOutletContext, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME, jsonToTheme, type ThemeConfig } from "../../lib/theme";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";
import { useGuestOutletContext as useGuestOutletContextBase, type GuestOutletContext } from "./guest-layout";

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const { guestId, eventId, signOut } = useGuestAuth();

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
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold">Invitation Not Found</h1>
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
      </div>
    );
  }

  if (!guestId || eventId !== event.id) {
    return <Navigate to={`/r/${slug}`} replace />;
  }

  const theme = RUSTY_THEME;
  const invitedIds = invitedSubEventIds ?? [];

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="min-h-screen">
        <nav className="sticky top-0 z-50 border-b border-event-border bg-event-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link to={`/r/${slug}/home`} className="text-lg font-bold" style={{ fontFamily: "var(--event-font-heading)" }}>
              {event.name}
            </Link>
            <div className="flex items-center gap-1 text-sm">
              <Link to={`/r/${slug}/home`} className="rounded-lg px-3 py-1.5 font-medium opacity-70 hover:opacity-100" style={{ color: "var(--event-text)" }}>Home</Link>
              {invitedIds.length > 0 && <Link to={`/r/${slug}/rsvp`} className="rounded-lg px-3 py-1.5 font-medium opacity-70 hover:opacity-100" style={{ color: "var(--event-text)" }}>RSVP</Link>}
              <Link to={`/r/${slug}/wishes`} className="rounded-lg px-3 py-1.5 font-medium opacity-70 hover:opacity-100" style={{ color: "var(--event-text)" }}>Wishes</Link>
              <Link to={`/r/${slug}/contact`} className="rounded-lg px-3 py-1.5 font-medium opacity-70 hover:opacity-100" style={{ color: "var(--event-text)" }}>Contact</Link>
              {navPages?.map((page) => (
                <Link key={page.id} to={`/r/${slug}/p/${page.slug}`} className="rounded-lg px-3 py-1.5 font-medium opacity-70 hover:opacity-100" style={{ color: "var(--event-text)" }}>
                  {page.nav_label || page.title}
                </Link>
              ))}
              <button onClick={() => { signOut(); window.location.href = `/r/${slug}`; }} className="ml-2 rounded-lg px-3 py-1.5 text-xs font-medium opacity-70 hover:opacity-100">Sign Out</button>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-4xl px-4 py-8">
          <Outlet context={{ event, slug: slug!, theme, invitedSubEventIds: invitedIds } satisfies GuestOutletContext} />
        </main>
        {footerPages && footerPages.length > 0 && (
          <footer className="border-t border-event-border px-4 py-6">
            <div className="mx-auto flex max-w-4xl flex-wrap gap-4 text-sm opacity-70">
              {footerPages.map((page) => (
                <Link key={page.id} to={`/r/${slug}/p/${page.slug}`} className="hover:underline">{page.nav_label || page.title}</Link>
              ))}
            </div>
          </footer>
        )}
      </div>
    </EventThemeProvider>
  );
}
