import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage, type UserEvent } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { BlockRenderer } from "./block-renderer";

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();

  // Fetch the published event
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

  // Fetch the custom page
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
      <EventThemeProvider theme={event.theme}>
        <div className="guest-section text-center">
          <h1 className="guest-title">Page Not Found</h1>
          <p className="guest-subtitle mx-auto mb-6">This page could not be found or is no longer available.</p>
          <Link to={`/e/${slug}/home`} className="event-btn-secondary">Back to Home</Link>
        </div>
      </EventThemeProvider>
    );
  }

  return (
    <EventThemeProvider theme={event.theme}>
      <div className="animate-fadeIn">
        {page.cover_image_url && (
          <div className="h-48 w-full overflow-hidden sm:h-64">
            <img src={page.cover_image_url} alt={page.title} className="h-full w-full object-cover" />
          </div>
        )}
        <section className="guest-section">
          <div className="mx-auto max-w-2xl">
            <h1 className="guest-title text-center">{page.title}</h1>
            {page.inline_image_url && (
              <div className="mb-6 overflow-hidden rounded-xl">
                <img src={page.inline_image_url} alt={page.title} className="w-full object-cover" />
              </div>
            )}
            <BlockRenderer blocks={page.blocks} />
            <div className="mt-8 text-center">
              <Link to={`/e/${slug}/home`} className="event-btn-secondary">Back to Home</Link>
            </div>
          </div>
        </section>
      </div>
    </EventThemeProvider>
  );
}
