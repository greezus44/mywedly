import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { RichTextContent } from "../../lib/sanitize";
import { BlockRenderer, type Block } from "./block-renderer";

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
      return data;
    },
    enabled: !!slug,
  });

  const { data: page, isLoading: pageLoading } = useQuery({
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
      <EventThemeProvider theme={event.theme as Json}>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="guest-title">Page Not Found</h1>
          <p className="guest-subtitle">This page could not be found or is no longer available.</p>
          <Link to={`/e/${slug}/home`} className="event-btn-primary">Back to Home</Link>
        </div>
      </EventThemeProvider>
    );
  }

  const theme = jsonToTheme(event.theme);
  const blocks = Array.isArray(page.blocks) ? (page.blocks as unknown as Block[]) : [];
  const hasBlocks = blocks.length > 0;

  return (
    <EventThemeProvider theme={event.theme as Json}>
      <div className="min-h-screen">
        {page.cover_image_url && (
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img src={page.cover_image_url} alt={page.title} className="w-full h-full object-cover" />
          </div>
        )}
        <section className="guest-section">
          <div className="mx-auto max-w-3xl">
            <h1 className="guest-title mb-4 text-center">{page.title}</h1>
            {page.inline_image_url && !page.cover_image_url && (
              <img src={page.inline_image_url} alt={page.title} className="mx-auto mb-6 max-w-full rounded-lg" style={{ borderRadius: "var(--event-radius)" }} />
            )}
            {hasBlocks ? (
              <BlockRenderer blocks={blocks} />
            ) : (
              page.body && <RichTextContent html={page.body} />
            )}
          </div>
        </section>
      </div>
    </EventThemeProvider>
  );
}
