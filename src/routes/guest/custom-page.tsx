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

  if (eventError || !event)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Invitation Not Found</h1>
        <p className="text-dash-muted">This invitation website could not be found or is no longer available.</p>
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
      </div>
    );

  if (pageError || !page)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Page Not Found</h1>
        <p className="text-dash-muted">This page could not be found or is no longer available.</p>
        <Link to={`/e/${slug}/home`} className="text-dash-primary hover:underline">Go to home</Link>
      </div>
    );

  return (
    <EventThemeProvider theme={event.theme}>
      <div className="min-h-screen">
        {page.cover_image_url && (
          <div className="relative h-64 w-full overflow-hidden md:h-80">
            <img src={page.cover_image_url} alt={page.title} className="h-full w-full object-cover" />
          </div>
        )}
        <section className="guest-section">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              {page.icon && <span className="mb-2 block text-3xl">{page.icon}</span>}
              <h1 className="guest-title">{page.title}</h1>
            </div>
            <BlockRenderer blocks={page.blocks} eventId={event.id} />
            {page.body && (
              <div className="mt-8">
                <RichTextContent html={page.body} />
              </div>
            )}
            {page.inline_image_url && (
              <div className="mt-8">
                <img src={page.inline_image_url} alt={page.title} className="mx-auto max-w-full rounded-lg" style={{ borderRadius: "var(--event-radius)" }} />
              </div>
            )}
          </div>
        </section>
      </div>
    </EventThemeProvider>
  );
}
