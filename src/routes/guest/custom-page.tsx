import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage, type Json } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { BlockRenderer } from "./block-renderer";

interface PageBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
}

function blocksFromContent(content: Json | null | undefined): PageBlock[] {
  if (!content || typeof content !== "object" || Array.isArray(content)) return [];
  const obj = content as Record<string, unknown>;
  // Support both { blocks: [...] } and { blocks: [...] } shapes
  const blocks = obj.blocks;
  if (!Array.isArray(blocks)) return [];
  return blocks as PageBlock[];
}

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const { event } = useGuestOutletContext();

  const { data: page, isLoading } = useQuery({
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!page) {
    return (
      <section className="guest-section text-center">
        <div className="mx-auto max-w-md">
          <h1 className="guest-title mb-4">Page Not Found</h1>
          <p className="guest-subtitle mb-6">This page could not be found or is no longer available.</p>
          <Link to={`/e/${slug}/home`} className="event-btn-primary">Back to Home</Link>
        </div>
      </section>
    );
  }

  const blocks = blocksFromContent(page.content);

  return (
    <article>
      {blocks.length === 0 ? (
        <section className="guest-section text-center">
          <div className="mx-auto max-w-md">
            <h1 className="guest-title mb-4">{page.title}</h1>
            <p className="guest-subtitle">Content coming soon.</p>
          </div>
        </section>
      ) : (
        <div>
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>
      )}
    </article>
  );
}
