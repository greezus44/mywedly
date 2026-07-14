import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { BlockRenderer } from "./block-renderer";

export default function GuestCustomPage() {
  const { slug, event } = useGuestOutletContext();
  const { pageSlug } = useParams<{ pageSlug: string }>();

  // Fetch the custom page by slug + event_id + is_published
  // This is the fix: previously custom pages weren't being fetched correctly on the guest site
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
      <div className="guest-section flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="guest-section text-center">
        <div className="event-card mx-auto max-w-md">
          <h2 className="guest-title mb-2">Page Not Found</h2>
          <p className="guest-subtitle mb-4">This page could not be found or is no longer available.</p>
          <Link to={`/e/${slug}/home`} className="event-btn-secondary">Back to Home</Link>
        </div>
      </div>
    );
  }

  const blocks = (page.blocks ?? []) as Record<string, unknown>[];

  return (
    <div>
      {/* Page title */}
      {(page.title || page.cover_image_url) && (
        <section className="guest-section text-center">
          {page.cover_image_url && (
            <img src={page.cover_image_url} alt={page.title} className="mx-auto mb-6 max-h-96 w-full rounded-2xl object-cover" />
          )}
          {page.title && <h1 className="guest-title">{page.title}</h1>}
        </section>
      )}

      {/* Render blocks if they exist */}
      {blocks.length > 0 ? (
        <BlockRenderer blocks={blocks} />
      ) : page.body ? (
        <section className="guest-section">
          <div className="mx-auto max-w-2xl rich-content" dangerouslySetInnerHTML={{ __html: page.body }} />
        </section>
      ) : null}
    </div>
  );
}
