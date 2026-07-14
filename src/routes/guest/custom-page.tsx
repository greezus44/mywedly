import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { BlockRenderer, type Block } from "./block-renderer";

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();

  // Fetch published event
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

  // Fetch custom page by slug and event_id with is_published = true
  const { data: page, isLoading: pageLoading, error } = useQuery({
    queryKey: ["guest-custom-page", slug, pageSlug],
    queryFn: async () => {
      if (!event) return null;
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("slug", pageSlug)
        .eq("event_id", event.id)
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
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">Page Not Found</h1>
        <p className="text-dash-muted">This page could not be found or is no longer available.</p>
      </div>
    );
  }

  // Uses jsonToTheme(event.theme) — the published theme field
  const theme = jsonToTheme(event.theme);
  const blocks = (Array.isArray(page.blocks) ? page.blocks : []) as unknown as Block[];

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="animate-fadeIn">
        {/* Cover image with title overlay */}
        {page.cover_image_url ? (
          <div className="relative h-[40vh] min-h-[280px] w-full overflow-hidden">
            <img src={page.cover_image_url} alt={page.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.3)" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="text-3xl font-bold text-white md:text-5xl" style={{ fontFamily: "var(--event-font-heading)" }}>
                {page.title}
              </h1>
            </div>
          </div>
        ) : (
          <section className="guest-section text-center">
            <p className="guest-eyebrow">{page.nav_label || "Page"}</p>
            <h1 className="guest-title">{page.title}</h1>
          </section>
        )}

        {/* Render blocks from blocks jsonb field */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-3xl space-y-8">
            {blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} eventId={event.id} />
            ))}
          </div>
        </section>
      </div>
    </EventThemeProvider>
  );
}
