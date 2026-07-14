import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { BlockRenderer } from "./block-renderer";
import { RichTextContent } from "../../lib/sanitize";

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const { event } = useGuestOutletContext();

  const { data: page, isLoading, isError, error } = useQuery({
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (isError) {
    return (
      <section className="guest-section text-center">
        <h1 className="guest-title">Something went wrong</h1>
        <p className="guest-subtitle mx-auto">{error?.message ?? "Failed to load this page."}</p>
        <Link to={`/e/${slug}/home`} className="event-btn-secondary mt-4 inline-block">Back to Home</Link>
      </section>
    );
  }

  if (!page) {
    return (
      <section className="guest-section text-center">
        <h1 className="guest-title">Page Not Found</h1>
        <p className="guest-subtitle mx-auto">This page could not be found or is no longer available.</p>
        <Link to={`/e/${slug}/home`} className="event-btn-secondary mt-4 inline-block">Back to Home</Link>
      </section>
    );
  }

  const hasBlocks = Array.isArray(page.blocks) && (page.blocks as unknown[]).length > 0;

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="guest-eyebrow">{page.nav_label || "Page"}</p>
          <h1 className="guest-title">{page.title}</h1>
        </div>

        {page.cover_image_url && (
          <img src={page.cover_image_url} alt={page.title} className="mb-8 w-full rounded-md object-cover" style={{ maxHeight: "360px" }} />
        )}

        {hasBlocks ? (
          <BlockRenderer blocks={page.blocks} slug={slug} />
        ) : page.body ? (
          <RichTextContent html={page.body} />
        ) : (
          <p className="text-center" style={{ color: "var(--event-muted)" }}>No content yet.</p>
        )}

        {page.inline_image_url && (
          <img src={page.inline_image_url} alt="" className="mt-8 w-full rounded-md object-cover" />
        )}
      </div>
    </section>
  );
}
