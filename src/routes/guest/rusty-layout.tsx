import React from "react";
import { useParams, useNavigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guest, loading } = useGuestAuth();

  const { data: event } = useQuery({
    queryKey: ["event_by_slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!slug,
  });

  React.useEffect(() => {
    if (!loading && !guest && slug) {
      navigate(`/r/${slug}/signin`, { replace: true });
    }
  }, [loading, guest, slug, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!guest) return null;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

  return (
    <EventThemeProvider themeJson={event.theme}>
      <div className="min-h-screen" style={{ backgroundColor: "var(--event-bg)" }}>
        <nav className="sticky top-0 z-20 bg-[var(--event-surface)] border-b border-[var(--event-border)] px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-semibold text-[var(--event-text)]" style={{ fontFamily: "var(--event-heading-font)" }}>
            {event.name}
          </span>
          <div className="flex gap-1">
            {[
              { to: "home", label: "Home" },
              { to: "rsvp", label: "RSVP" },
              { to: "wishes", label: "Wishes" },
            ].map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(`/r/${slug}/${item.to}`)}
                className="px-3 py-1.5 rounded text-sm text-[var(--event-text-muted)] hover:text-[var(--event-primary)]"
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
        <Outlet />
      </div>
    </EventThemeProvider>
  );
}
