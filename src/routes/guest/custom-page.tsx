import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { BlockRenderer } from "./block-renderer";

type AnyBlock = Record<string, unknown> & { id: string; type: string };

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();

  const { data: event, isLoading: eventLoading } = useQuery({
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

  const { data: page, isLoading: pageLoading } = useQuery({
    queryKey: ["guest-custom-page", event?.id, pageSlug],
    queryFn: async () => {
      if (!event || !pageSlug) return null;
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event.id)
        .eq("slug", pageSlug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    enabled: !!event && !!pageSlug,
  });

  if (eventLoading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Invitation Not Found</h1>
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
      </div>
    );
  }

  if (!page) {
    return (
      <EventThemeProvider theme={event.theme}>
        <div className="guest-section flex flex-col items-center justify-center text-center">
          <h1 className="guest-title">Page Not Found</h1>
          <p className="guest-subtitle">This page may have been moved or is no longer available.</p>
          <Link to={`/e/${slug}/home`} className="event-btn-primary mt-6 inline-block">Back to Home</Link>
        </div>
      </EventThemeProvider>
    );
  }

  const theme = jsonToTheme(event.theme);
  const blocks = (Array.isArray(page.blocks) ? page.blocks : []) as AnyBlock[];

  return (
    <EventThemeProvider theme={event.theme}>
      <div className="guest-section">
        <div className="mx-auto max-w-3xl">
          {/* Page title */}
          <div className="mb-10 text-center">
            <p className="guest-eyebrow">{event.title}</p>
            <h1 className="guest-title">{page.title}</h1>
          </div>

          {/* Render blocks */}
          {blocks.length === 0 ? (
            <p className="text-center" style={{ color: theme.muted }}>No content yet.</p>
          ) : (
            <div className="space-y-6">
              {blocks.map((block) => (
                <BlockRenderer key={block.id} block={block} theme={theme} />
              ))}
            </div>
          )}
        </div>
      </div>
    </EventThemeProvider>
  );
}
