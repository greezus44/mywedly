import { useEffect } from "react";
import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme, RUSTY_THEME } from "../../lib/theme";
import { LoadingSpinner } from "../../components/ui";
import { cn } from "../../lib/utils";

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { eventId, guestId } = useGuestAuth();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["public-event", slug],
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
        .eq("show_in_nav", true)
        .eq("is_published", true)
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
        .eq("is_footer", true)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
    enabled: !!event?.id,
  });

  // Redirect to cover if not signed in for this event
  useEffect(() => {
    if (!isLoading && !isError && event && eventId !== event.id) {
      navigate(`/r/${slug}`, { replace: true });
    }
    if (!isLoading && !isError && event && eventId === event.id && !guestId) {
      navigate(`/r/${slug}`, { replace: true });
    }
  }, [isLoading, isError, event, eventId, guestId, slug, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-semibold text-dash-text">
          This invitation website could not be found or is no longer available.
        </h1>
      </div>
    );
  }

  // Guard: if not authenticated for this event, don't render content
  if (eventId !== event.id || !guestId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const theme = jsonToTheme(event.theme) ?? RUSTY_THEME;

  const navItems = [
    { label: "Home", to: `/r/${slug}/home`, end: false },
    { label: "Events", to: `/r/${slug}/events`, end: false },
    { label: "RSVP", to: `/r/${slug}/rsvp`, end: false },
    { label: "Wishes", to: `/r/${slug}/wishes`, end: false },
    { label: "Contact", to: `/r/${slug}/contact`, end: false },
    ...((navPages ?? []).map((p) => ({
      label: p.nav_label ?? p.title,
      to: `/r/${slug}/p/${p.slug}`,
      end: false,
    }))),
  ];

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="flex min-h-screen flex-col">
        {/* Navigation */}
        <header className="sticky top-0 z-30 border-b border-event-border bg-event-surface/95 backdrop-blur">
          <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-1 px-4 py-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-event-primary text-event-primary-fg"
                      : "text-event-muted hover:bg-event-surface-alt hover:text-event-text"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="mx-auto max-w-3xl px-4 py-8">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        {footerPages && footerPages.length > 0 && (
          <footer className="border-t border-event-border bg-event-surface-alt">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-4 px-4 py-4">
              {footerPages.map((page) => (
                <NavLink
                  key={page.id}
                  to={`/r/${slug}/p/${page.slug}`}
                  className="text-sm text-event-muted hover:text-event-text"
                >
                  {page.nav_label ?? page.title}
                </NavLink>
              ))}
            </div>
          </footer>
        )}
      </div>
    </EventThemeProvider>
  );
}
