import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME, type ThemeConfig } from "../../lib/theme";
import { cn } from "../../lib/utils";

function parseTheme(theme: Json | null | undefined): ThemeConfig {
  if (theme && typeof theme === "object" && !Array.isArray(theme)) {
    return { ...RUSTY_THEME, ...(theme as Partial<ThemeConfig>) };
  }
  return RUSTY_THEME;
}

const BASE_NAV = [
  { label: "Home", to: "home", end: false },
  { label: "Events", to: "events", end: false },
  { label: "RSVP", to: "rsvp", end: false },
  { label: "Wishes", to: "wishes", end: false },
  { label: "Contact", to: "contact", end: false },
];

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guestName, eventId, signOut } = useGuestAuth();

  useEffect(() => {
    if (!guestName || !eventId) {
      navigate(`/r/${slug}`, { replace: true });
    }
  }, [guestName, eventId, slug, navigate]);

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["user_events", "slug", slug],
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
    enabled: !!slug,
  });

  const { data: navPages } = useQuery({
    queryKey: ["custom_pages", "nav", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("id, slug, nav_label, title, show_in_nav, is_footer, is_published, event_id")
        .eq("event_id", event!.id)
        .eq("show_in_nav", true)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomPage[];
    },
    enabled: !!event,
  });

  const { data: footerPages } = useQuery({
    queryKey: ["custom_pages", "footer", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("id, slug, nav_label, title, is_footer, is_published, event_id")
        .eq("event_id", event!.id)
        .eq("is_footer", true)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomPage[];
    },
    enabled: !!event,
  });

  if (!guestName || !eventId) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse opacity-70">Loading…</div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Invitation not found</h1>
        <p className="max-w-md opacity-80">
          This invitation website could not be found or is no longer available.
        </p>
        <Link to="/" className="underline">Go to homepage</Link>
      </div>
    );
  }

  const theme = parseTheme(event.theme);
  const customNav = (navPages ?? []).map((p) => ({
    label: p.nav_label || p.title,
    to: `p/${p.slug}`,
    end: false,
  }));

  return (
    <EventThemeProvider theme={theme}>
      <div className="flex min-h-screen flex-col">
        <header
          className="sticky top-0 z-40 border-b"
          style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}
        >
          <div className="mx-auto max-w-5xl px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to={`/r/${slug}/home`} className="text-lg font-bold">{event.name}</Link>
              <span className="text-sm opacity-70">Welcome, {guestName}</span>
            </div>
          </div>
          <nav className="mx-auto max-w-5xl px-4">
            <div className="flex gap-1 overflow-x-auto pb-px">
              {[...BASE_NAV, ...customNav].map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    cn(
                      "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ? "border-current" : "border-transparent opacity-70 hover:opacity-100"
                    )
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          <Outlet context={{ event }} />
        </main>

        <footer
          className="border-t"
          style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-surface)" }}
        >
          <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm opacity-70">
            {(footerPages ?? []).length > 0 && (
              <div className="mb-3 flex flex-wrap justify-center gap-4">
                {(footerPages ?? []).map((p) => (
                  <Link key={p.id} to={`/r/${slug}/p/${p.slug}`} className="hover:underline">
                    {p.nav_label || p.title}
                  </Link>
                ))}
              </div>
            )}
            <button onClick={() => signOut()} className="underline">Sign out</button>
            <p className="mt-2">Powered by MyWedly</p>
          </div>
        </footer>
      </div>
    </EventThemeProvider>
  );
}
