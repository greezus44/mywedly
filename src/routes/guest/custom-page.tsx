import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { BlockRenderer, jsonToBlocks, type Block } from "./block-renderer";

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();

  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ["published-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  const { data: page, isLoading: pageLoading, error: pageError } = useQuery({
    queryKey: ["guest-custom-page", event?.id, pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event!.id)
        .eq("slug", pageSlug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    enabled: !!event?.id && !!pageSlug,
  });

  if (eventLoading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Invitation Not Found</h1>
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
      </div>
    );
  }

  if (pageError || !page) {
    return (
      <EventThemeProvider theme={event.theme}>
        <div className="guest-section flex min-h-screen flex-col items-center justify-center gap-4 text-center">
          <h1 className="guest-title">Page Not Found</h1>
          <p className="guest-subtitle mx-auto">The page you're looking for doesn't exist or has been removed.</p>
          <Link to={`/e/${slug}/home`} className="event-btn-primary">Back to Home</Link>
        </div>
      </EventThemeProvider>
    );
  }

  const blocks = jsonToBlocks(page.blocks);
  const theme = jsonToTheme(event.theme);

  return (
    <EventThemeProvider theme={event.theme}>
      <div>
        <section className="guest-section text-center">
          <div className="mx-auto max-w-3xl">
            <p className="guest-eyebrow">{event.name}</p>
            <h1 className="guest-title">{page.title}</h1>
          </div>
        </section>
        <BlockRenderer blocks={blocks} eventId={event.id} slug={slug!} />
        <section className="guest-section-tight text-center">
          <Link to={`/e/${slug}/home`} className="text-sm hover:underline" style={{ color: "var(--event-muted)" }}>
            Back to Home
          </Link>
        </section>
      </div>
    </EventThemeProvider>
  );
}
