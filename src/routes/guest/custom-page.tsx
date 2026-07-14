import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { BlockRenderer } from "./block-renderer";
import { RichTextContent } from "../../lib/sanitize";

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();

  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
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

  const { data: page, isLoading: pageLoading, error: pageError } = useQuery({
    queryKey: ["guest-custom-page", slug, pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("slug", pageSlug)
        .eq("event_id", event!.id)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    enabled: !!event?.id && !!pageSlug,
  });

  const theme = jsonToTheme(event?.theme);

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
        <div className="guest-section text-center">
          <h1 className="guest-title mb-2">Page Not Found</h1>
          <p className="guest-subtitle mx-auto mb-6">This page could not be found or is no longer available.</p>
          <Link to={`/e/${slug}/home`} className="event-btn-primary">
            Back to Home
          </Link>
        </div>
      </EventThemeProvider>
    );
  }

  return (
    <EventThemeProvider theme={event.theme}>
      <div className="guest-section">
        <div className="mx-auto max-w-3xl">
          {/* Page Title */}
          <div className="mb-8 text-center animate-fadeIn">
            <p className="guest-eyebrow">{event.name}</p>
            <h1 className="guest-title">{page.title}</h1>
          </div>

          {/* Cover Image */}
          {page.cover_image_url && (
            <div className="mb-8 animate-slideUp">
              <img
                src={page.cover_image_url}
                alt={page.title}
                className="w-full object-cover"
                style={{ borderRadius: "var(--event-radius)", maxHeight: "400px" }}
              />
            </div>
          )}

          {/* Inline Image */}
          {page.inline_image_url && !page.cover_image_url && (
            <div className="mb-8 animate-slideUp">
              <img
                src={page.inline_image_url}
                alt={page.title}
                className="w-full object-cover"
                style={{ borderRadius: "var(--event-radius)", maxHeight: "300px" }}
              />
            </div>
          )}

          {/* Body (fallback HTML body) */}
          {page.body && (!page.blocks || (page.blocks as unknown[]).length === 0) && (
            <div className="animate-slideUp">
              <RichTextContent html={page.body} />
            </div>
          )}

          {/* Blocks */}
          {page.blocks && (page.blocks as unknown[]).length > 0 && (
            <div className="animate-slideUp">
              <BlockRenderer blocks={page.blocks} />
            </div>
          )}

          {/* Back link */}
          <div className="mt-12 text-center">
            <Link
              to={`/e/${slug}/home`}
              className="text-sm hover:underline"
              style={{ color: "var(--event-muted)" }}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
