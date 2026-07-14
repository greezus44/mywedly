import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { BlockRenderer } from "./block-renderer";
import { type BlockContent } from "../event/block-types";
import { LoadingSpinner } from "../../components/ui";

export default function GuestCustomPage() {
  const { slug } = useParams<{ slug: string }>();
  const pageSlug = useParams<{ pageSlug: string }>().pageSlug;
  const { event } = useGuestOutletContext();

  const { data: page, isLoading } = useQuery({
    queryKey: ["custom-page-by-slug", event.id, pageSlug],
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
    enabled: !!pageSlug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="guest-section text-center">
        <div className="mx-auto max-w-md">
          <h1 className="guest-title mb-2">Page Not Found</h1>
          <p className="guest-subtitle">This page could not be found or is no longer available.</p>
        </div>
      </div>
    );
  }

  const blocks = (Array.isArray(page.blocks) ? page.blocks : []) as unknown as BlockContent[];

  return (
    <div>
      <section className="guest-section">
        <div className="mx-auto max-w-3xl">
          <h1 className="guest-title mb-6 text-center">{page.title}</h1>
          {blocks.length === 0 ? (
            <p className="text-center guest-subtitle">No content yet.</p>
          ) : (
            <div className="space-y-6">
              {blocks.map((block) => (
                <BlockRenderer key={block.id} block={block} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
