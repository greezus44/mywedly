import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME, jsonToTheme, type ThemeConfig } from "../../lib/theme";
import { cn } from "../../lib/utils";

const BASE_NAV = [
  { label: "Home", to: "home", end: false },
  { label: "Events", to: "events", end: false },
  { label: "RSVP", to: "rsvp", end: false },
  { label: "Wishes", to: "wishes", end: false },
  { label: "Contact", to: "contact", end: false },
];

export default function RustyLayout() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const auth = useGuestAuth();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["guest-event", slug],
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
  });

  const { data: navPages } = useQuery({
    queryKey: ["guest-nav-pages", event?.id],
    enabled: !!event,
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
  });

  const { data: footerPages } = useQuery({
    queryKey: ["guest-footer-pages", event?.id],
    enabled: !!event,
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
  });

  // Auth gate: must be signed in AND for this event
  if (!isLoading && event && (!auth.isAuthenticated || auth.eventId !== event.id)) {
    navigate(`/r/${slug}`, { replace: true });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <p className="max-w-md text-dash-muted">
          This invitation website could not be found or is no longer available.
        </p>
      </div>
    );
  }

  const savedTheme = jsonToTheme(event.theme as Json | null);
  const theme: ThemeConfig = { ...RUSTY_THEME, ...savedTheme };
  const customNav = (navPages ?? []).map((p) => ({
    label: p.nav_label ?? p.title,
    to: `p/${p.slug}`,
    end: false,
  }));
  const navItems = [...BASE_NAV, ...customNav];

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="event-themed flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-event-border bg-event-surface/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <span className="font-event text-base font-semibold text-event-heading">
              {event.name}
            </span>
            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-event-primary text-event-primary-fg"
                        : "text-event-muted hover:bg-event-surface-alt hover:text-event-heading"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <Outlet context={{ event }} />
        </main>

        <footer className="border-t border-event-border bg-event-surface/60">
          <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-event-muted">
            {footerPages && footerPages.length > 0 && (
              <div className="mb-3 flex flex-wrap justify-center gap-3">
                {footerPages.map((p) => (
                  <NavLink
                    key={p.id}
                    to={`p/${p.slug}`}
                    className="hover:text-event-primary"
                  >
                    {p.nav_label ?? p.title}
                  </NavLink>
                ))}
              </div>
            )}
            <p>© {new Date().getFullYear()} {event.name}</p>
          </div>
        </footer>
      </div>
    </EventThemeProvider>
  );
}
