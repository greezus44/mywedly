import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME, type ThemeConfig } from "../../lib/theme";
import { cn } from "../../lib/utils";

interface NavItem { to: string; label: string }

const BASE_NAV: NavItem[] = [
  { to: "home", label: "Home" },
  { to: "events", label: "Events" },
  { to: "rsvp", label: "RSVP" },
  { to: "wishes", label: "Wishes" },
  { to: "contact", label: "Contact" },
];

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guestName, eventId } = useGuestAuth();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ["rusty_event", slug],
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

  const { data: customPages } = useQuery({
    queryKey: ["rusty_custom_pages", event?.id],
    enabled: !!event?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event!.id)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
  });

  if (!isLoading && event && (!guestName || eventId !== event.id)) {
    navigate(`/r/${slug}`, { replace: true });
  }

  if (!isLoading && (error || !event)) {
    navigate(`/r/${slug}`, { replace: true });
  }

  if (isLoading || !event) {
    return <div className="flex min-h-screen items-center justify-center bg-event-bg"><div className="animate-pulse text-event-muted">Loading…</div></div>;
  }

  const theme = (event.theme ?? RUSTY_THEME) as ThemeConfig;
  const navPages = (customPages || []).filter((p) => p.show_in_nav);
  const footerPages = (customPages || []).filter((p) => p.is_footer);
  const navItems: NavItem[] = [...BASE_NAV, ...navPages.map((p) => ({ to: `p/${p.slug}`, label: p.nav_label || p.title }))];

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 border-b border-event-border bg-event-surface/90 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex h-16 items-center justify-between">
              <span className="font-event text-lg font-semibold text-event-heading truncate">{event.name}</span>
              <span className="text-xs text-event-muted hidden sm:block">Signed in as {guestName}</span>
            </div>
            <nav className="flex gap-1 overflow-x-auto pb-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive ? "bg-event-primary text-event-primary-fg" : "text-event-muted hover:bg-event-surface-alt hover:text-event-text"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8">
          <Outlet context={{ event }} />
        </main>

        <footer className="border-t border-event-border bg-event-surface">
          <div className="mx-auto max-w-5xl px-4 py-6 text-center">
            {footerPages.length > 0 && (
              <div className="mb-3 flex flex-wrap justify-center gap-4">
                {footerPages.map((p) => (
                  <NavLink key={p.id} to={`p/${p.slug}`} className="text-sm text-event-muted hover:text-event-primary hover:underline">
                    {p.nav_label || p.title}
                  </NavLink>
                ))}
              </div>
            )}
            <p className="text-xs text-event-muted">© {new Date().getFullYear()} {event.name}</p>
          </div>
        </footer>
      </div>
    </EventThemeProvider>
  );
}
