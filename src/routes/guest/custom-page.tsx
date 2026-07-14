import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { BlockRenderer } from "./block-renderer";
import { jsonToBlocks } from "../event/block-types";
import { RichTextContent } from "../../lib/sanitize";

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const { event } = useGuestOutletContext();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["guest-custom-page", event.id, pageSlug],
    queryFn: async () => {
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
    enabled: !!event.id && !!pageSlug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="guest-section flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="guest-title">Page Not Found</h1>
        <p className="guest-subtitle mx-auto">This page could not be found or is no longer available.</p>
        <Link to={`/e/${slug}/home`} className="mt-6 event-btn-primary">Back to Home</Link>
      </div>
    );
  }

  const blocks = jsonToBlocks(page.blocks);

  return (
    <EventThemeProvider theme={event.theme}>
      <article>
        {page.cover_image_url && (
          <div className="relative h-64 w-full overflow-hidden sm:h-80" style={{ borderRadius: "var(--event-radius)" }}>
            <img src={page.cover_image_url} alt={page.title} className="h-full w-full object-cover" />
          </div>
        )}
        <section className="guest-section">
          <div className="mx-auto max-w-3xl">
            <header className="mb-10 text-center">
              <p className="guest-eyebrow">{event.name}</p>
              <h1 className="guest-title">{page.title}</h1>
            </header>
            {blocks.length > 0 ? (
              <div className="space-y-8">
                {blocks.map((block) => (
                  <BlockRenderer key={block.id} block={block} eventId={event.id} slug={slug!} guest={null} />
                ))}
              </div>
            ) : page.body ? (
              <RichTextContent html={page.body} />
            ) : (
              <p className="guest-subtitle mx-auto text-center">No content yet.</p>
            )}
          </div>
        </section>
      </article>
    </EventThemeProvider>
  );
}
