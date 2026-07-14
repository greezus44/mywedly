import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { BlockRenderer } from "./block-renderer";
import { jsonToBlocks } from "../event/block-types";
import { LoadingSpinner } from "../../components/ui";

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const { event } = useGuestOutletContext();

  const { data: page, isLoading } = useQuery({
    queryKey: ["custom-page-public", event.id, pageSlug],
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
    enabled: !!pageSlug && !!event.id,
  });

  if (isLoading) return <div className="flex min-h-[50vh] items-center justify-center"><LoadingSpinner /></div>;
  if (!page) return (
    <div className="guest-section text-center">
      <h1 className="guest-title mb-2">Page Not Found</h1>
      <p className="guest-subtitle mb-4">This page could not be found or is not published.</p>
      <Link to={`/e/${slug}/home`} className="event-btn-primary inline-block">Back to Home</Link>
    </div>
  );

  const blocks = jsonToBlocks(page.blocks);

  return (
    <div className="guest-section">
      <div className="mx-auto max-w-3xl">
        <h1 className="guest-title mb-6 text-center">{page.title}</h1>
        {blocks.length > 0 ? (
          <div className="space-y-6">
            {blocks.map((block) => <BlockRenderer key={block.id} block={block} eventId={event.id} />)}
          </div>
        ) : (
          page.body ? <div className="rich-content" dangerouslySetInnerHTML={{ __html: page.body }} /> : <p className="text-center text-dash-muted">No content yet.</p>
        )}
      </div>
    </div>
  );
}
