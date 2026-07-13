import React from "react";
import { useParams, Outlet, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";
import { useGuestAuth } from "../../lib/guest-auth";
import { LogOut } from "lucide-react";

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { guestName, eventId, signOut } = useGuestAuth();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  const { data: customPages } = useQuery({
    queryKey: ["public-custom-pages", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_pages").select("*").eq("event_id", event!.id).eq("is_published", true).order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPage[];
    },
    enabled: !!event?.id,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  if (isError || !event) return <div className="min-h-screen flex items-center justify-center text-red-600">Event not found</div>;

  const navPages = customPages?.filter((p) => p.show_in_nav) || [];
  const footerPages = customPages?.filter((p) => p.is_footer) || [];

  const handleSignOut = () => { signOut(); navigate(`/e/${slug}`); };

  return (
    <EventThemeProvider initialTheme={event.theme || RUSTY_THEME}>
      <div className="min-h-screen flex flex-col" style={{ background: "var(--event-bg)", color: "var(--event-text)", fontFamily: "var(--event-font)" }}>
        <header className="sticky top-0 z-40" style={{ borderBottom: "2px solid var(--event-border)", background: "var(--event-surface)" }}>
          <div className="max-w-5xl mx-auto px-4">
            <div className="h-16 flex items-center justify-between">
              <Link to={`/e/${slug}`} className="text-xl font-serif" style={{ color: "var(--event-primary)" }}>{event.name}</Link>
              {guestName && eventId === event.id ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: "var(--event-muted)" }}>Hi, {guestName}</span>
                  <button onClick={handleSignOut} className="text-sm" style={{ color: "var(--event-muted)" }}><LogOut className="w-4 h-4" /></button>
                </div>
              ) : null}
            </div>
            <nav className="flex flex-wrap gap-1 pb-2">
              <Link to={`/e/${slug}`} className="px-3 py-1.5 rounded-full text-sm" style={{ color: "var(--event-text)" }}>Home</Link>
              <Link to={`/e/${slug}/rsvp`} className="px-3 py-1.5 rounded-full text-sm" style={{ color: "var(--event-text)" }}>RSVP</Link>
              <Link to={`/e/${slug}/wishes`} className="px-3 py-1.5 rounded-full text-sm" style={{ color: "var(--event-text)" }}>Wishes</Link>
              <Link to={`/e/${slug}/contact`} className="px-3 py-1.5 rounded-full text-sm" style={{ color: "var(--event-text)" }}>Contact</Link>
              {navPages.map((page) => (
                <Link key={page.id} to={`/e/${slug}/p/${page.slug}`} className="px-3 py-1.5 rounded-full text-sm" style={{ color: "var(--event-text)" }}>{page.nav_label}</Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          <Outlet context={{ event }} />
        </main>
        <footer className="border-t mt-8" style={{ borderColor: "var(--event-border)", background: "var(--event-surface)" }}>
          <div className="max-w-5xl mx-auto px-4 py-6">
            {footerPages.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-4">
                {footerPages.map((page) => (
                  <Link key={page.id} to={`/e/${slug}/p/${page.slug}`} className="text-sm" style={{ color: "var(--event-muted)" }}>{page.nav_label}</Link>
                ))}
              </div>
            )}
            <p className="text-sm text-center" style={{ color: "var(--event-muted)" }}>&copy; {new Date().getFullYear()} {event.name}</p>
          </div>
        </footer>
      </div>
    </EventThemeProvider>
  );
}
