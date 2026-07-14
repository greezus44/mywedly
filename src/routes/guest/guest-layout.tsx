import React, { useEffect } from "react";
import {
  useParams,
  useNavigate,
  Outlet,
  NavLink,
  useOutletContext as useRRDOutletContext,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  supabase,
  type UserEvent,
  type CustomPage,
  type Json,
} from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { cn } from "../../lib/utils";

export interface GuestOutletContext {
  event: UserEvent;
  slug: string;
}

export function useGuestOutletContext(): GuestOutletContext {
  return useRRDOutletContext<GuestOutletContext>();
}

export default function GuestLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, eventId, guestName, signOut } = useGuestAuth();

  // Redirect to cover if not signed in for this event
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/e/${slug}`, { replace: true });
    }
  }, [isAuthenticated, eventId, slug, navigate]);

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["guest_event", slug],
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

  const { data: navPages } = useQuery({
    queryKey: ["guest_nav_pages", slug],
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
    queryKey: ["guest_footer_pages", slug],
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

  if (!isAuthenticated || (event && eventId !== event.id)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="animate-pulse text-dash-muted">Redirecting…</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="animate-pulse text-dash-muted">Loading…</div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <p className="max-w-md text-lg text-dash-text">
          This invitation website could not be found or is no longer available.
        </p>
      </div>
    );
  }

  const theme = jsonToTheme(event.theme as Json | null);

  const navItems = [
    { label: "Home", to: `/e/${slug}/home` },
    { label: "Events", to: `/e/${slug}/events` },
    { label: "RSVP", to: `/e/${slug}/rsvp` },
    { label: "Wishes", to: `/e/${slug}/wishes` },
    { label: "Contact", to: `/e/${slug}/contact` },
    ...(navPages ?? []).map((p) => ({
      label: p.nav_label ?? p.title,
      to: `/e/${slug}/p/${p.slug}`,
    })),
  ];

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-event-border bg-event-surface/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <h1 className="text-lg font-semibold text-event-heading">
              {event.name}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-event-muted">Hi, {guestName}</span>
              <button
                onClick={() => {
                  signOut();
                  navigate(`/e/${slug}`, { replace: true });
                }}
                className="text-sm text-event-muted hover:text-event-text"
              >
                Sign out
              </button>
            </div>
          </div>
          <nav className="border-t border-event-border">
            <div className="mx-auto max-w-5xl px-4">
              <div className="flex gap-1 overflow-x-auto scrollbar-thin py-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      cn(
                        "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-event-primary text-event-primary-fg"
                          : "text-event-muted hover:bg-event-surface-alt hover:text-event-text"
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>
        </header>

        {/* Main content */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          <Outlet context={{ event, slug: slug! }} />
        </main>

        {/* Footer */}
        {(footerPages?.length ?? 0) > 0 && (
          <footer className="border-t border-event-border bg-event-surface">
            <div className="mx-auto max-w-5xl px-4 py-6">
              <div className="flex flex-wrap gap-4">
                {footerPages!.map((p) => (
                  <NavLink
                    key={p.id}
                    to={`/e/${slug}/p/${p.slug}`}
                    className="text-sm text-event-muted hover:text-event-text"
                  >
                    {p.nav_label ?? p.title}
                  </NavLink>
                ))}
              </div>
            </div>
          </footer>
        )}
      </div>
    </EventThemeProvider>
  );
}
