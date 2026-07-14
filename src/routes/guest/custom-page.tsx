import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { BlockRenderer, parseBlocks } from "./block-renderer";
import { RichTextContent } from "../../lib/sanitize";

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const { event } = useGuestOutletContext();

  const { data: page, isLoading, isError, error } = useQuery({
    queryKey: ["custom-page", event.id, pageSlug],
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--event-primary)] border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <section className="guest-section text-center">
        <div className="mx-auto max-w-md">
          <h1 className="guest-title">Something went wrong</h1>
          <p className="guest-subtitle mx-auto">{error instanceof Error ? error.message : "Please try again later."}</p>
          <Link to={`/e/${slug}/home`} className="mt-4 inline-block text-sm hover:underline" style={{ color: "var(--event-primary)" }}>Back to home</Link>
        </div>
      </section>
    );
  }

  if (!page) {
    return (
      <section className="guest-section text-center">
        <div className="mx-auto max-w-md">
          <h1 className="guest-title">Page Not Found</h1>
          <p className="guest-subtitle mx-auto">This page could not be found or is no longer available.</p>
          <Link to={`/e/${slug}/home`} className="mt-4 inline-block text-sm hover:underline" style={{ color: "var(--event-primary)" }}>Back to home</Link>
        </div>
      </section>
    );
  }

  const blocks = parseBlocks(page.blocks);

  return (
    <article>
      {/* Cover image */}
      {page.cover_image_url && (
        <div className="relative w-full" style={{ aspectRatio: "16 / 9", maxHeight: "40vh", overflow: "hidden" }}>
          <img src={page.cover_image_url} alt={page.title} className="h-full w-full object-cover" />
        </div>
      )}

      {/* Title */}
      <section className="guest-section-tight text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="guest-title">{page.title}</h1>
        </div>
      </section>

      {/* Inline image */}
      {page.inline_image_url && (
        <div className="px-6">
          <img src={page.inline_image_url} alt="" className="mx-auto max-w-3xl" style={{ borderRadius: "var(--event-radius)" }} />
        </div>
      )}

      {/* Body (rich text) */}
      {page.body && (
        <section className="guest-section-tight">
          <div className="mx-auto max-w-3xl rich-content">
            <RichTextContent html={page.body} />
          </div>
        </section>
      )}

      {/* Blocks */}
      <BlockRenderer blocks={blocks} />

      {/* Footer link */}
      <div className="pb-12 text-center">
        <Link to={`/e/${slug}/home`} className="text-sm hover:underline" style={{ color: "var(--event-muted)" }}>Back to home</Link>
      </div>
    </article>
  );
}
