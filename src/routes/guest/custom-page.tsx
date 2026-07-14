import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { useGuestAuth } from "../../lib/guest-auth";
import { BlockRenderer, jsonToBlocks, type Block } from "./block-renderer";
import { RichTextContent } from "../../lib/sanitize";

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const { guest, eventId } = useGuestAuth();

  const { data: event, isLoading: eventLoading } = useQuery({
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

  if (eventLoading || pageLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );

  if (!event)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Invitation Not Found</h1>
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
      </div>
    );

  if (pageError || !page)
    return (
      <EventThemeProvider theme={event.theme}>
        <div className="guest-section text-center">
          <div className="mx-auto max-w-md">
            <p className="guest-eyebrow">Page Not Found</p>
            <h1 className="guest-title mb-2">This page isn't available</h1>
            <p className="guest-subtitle mx-auto mb-6">The page you're looking for may have been moved or unpublished.</p>
            <Link to={`/e/${slug}/home`} className="event-btn-primary inline-block">Back to Home</Link>
          </div>
        </div>
      </EventThemeProvider>
    );

  // Guard: require sign-in
  if (!guest || eventId !== event.id) {
    return (
      <EventThemeProvider theme={event.theme}>
        <div className="guest-section text-center">
          <div className="mx-auto max-w-md">
            <p className="guest-eyebrow">Welcome</p>
            <h1 className="guest-title mb-2">{event.name}</h1>
            <p className="guest-subtitle mx-auto mb-6">Please sign in to view this page.</p>
            <Link to={`/e/${slug}/signin`} className="event-btn-primary inline-block">Sign In</Link>
          </div>
        </div>
      </EventThemeProvider>
    );
  }

  const theme = jsonToTheme(event.theme);
  const blocks = jsonToBlocks(page.blocks);
  const hasBlocks = blocks.length > 0;
  const hasBody = !!page.body;

  return (
    <EventThemeProvider theme={event.theme}>
      <article>
        {page.cover_image_url && (
          <div className="relative h-64 w-full overflow-hidden md:h-80">
            <img src={page.cover_image_url} alt={page.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}
        <section className="guest-section">
          <div className="mx-auto max-w-2xl">
            <header className="mb-8 text-center">
              <p className="guest-eyebrow">{event.name}</p>
              <h1 className="guest-title">{page.title}</h1>
            </header>
            {page.inline_image_url && !page.cover_image_url && (
              <div className="mb-8 overflow-hidden rounded-lg" style={{ borderRadius: "var(--event-radius)" }}>
                <img src={page.inline_image_url} alt={page.title} className="w-full object-cover" />
              </div>
            )}
            {hasBlocks && <BlockRenderer blocks={blocks} />}
            {!hasBlocks && hasBody && <RichTextContent html={page.body!} />}
            {!hasBlocks && !hasBody && (
              <p className="guest-subtitle mx-auto text-center">Content coming soon.</p>
            )}
          </div>
        </section>
      </article>
    </EventThemeProvider>
  );
}
