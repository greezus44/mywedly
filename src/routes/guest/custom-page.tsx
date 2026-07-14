import { useGuestOutletContext } from "./guest-layout";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase, type CustomPage } from "../../lib/supabase";
import { LoadingSpinner } from "../../components/ui";
import { BlockRenderer } from "./block-renderer";
import type { BlockContent } from "../event/block-types";

export default function GuestCustomPage() {
  const { event, slug } = useGuestOutletContext();
  const { pageSlug } = useParams<{ pageSlug: string }>();

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

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (!page) return (
    <section className="guest-section text-center">
      <div className="mx-auto max-w-md">
        <h2 className="guest-title mb-3">Page Not Found</h2>
        <p className="guest-subtitle">This page could not be found.</p>
      </div>
    </section>
  );

  const blocks = (page.blocks as unknown as BlockContent[]) ?? [];

  return (
    <div>
      {blocks.length === 0 ? (
        <section className="guest-section text-center">
          <div className="mx-auto max-w-md">
            <h2 className="guest-title mb-3">{page.title}</h2>
            <p className="guest-subtitle">No content yet.</p>
          </div>
        </section>
      ) : (
        blocks.map((block, i) => <BlockRenderer key={i} block={block} />)
      )}
    </div>
  );
}
