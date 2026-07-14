import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToBlocks } from "../event/block-types";
import { BlockRenderer, type Block } from "./block-renderer";

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
        <Link to={`/e/${slug}/home`} className="text-dash-primary hover:underline">Back to invitation</Link>
      </div>
    );

  const blocks = jsonToBlocks(page.blocks as Json) as unknown as Block[];

  return (
    <EventThemeProvider theme={event.theme}>
      <article className="guest-section">
        <div className="mx-auto max-w-2xl">
          <header className="mb-10 text-center">
            <p className="guest-eyebrow">{page.nav_label || page.title}</p>
            <h1 className="guest-title">{page.title}</h1>
          </header>
          {blocks.length > 0 ? (
            <div className="space-y-6">
              {blocks.map((block: Block) => (
                <BlockRenderer key={block.id} block={block} />
              ))}
            </div>
          ) : (
            <p className="guest-subtitle text-center">This page has no content yet. Check back soon.</p>
          )}
        </div>
      </article>
    </EventThemeProvider>
  );
}
