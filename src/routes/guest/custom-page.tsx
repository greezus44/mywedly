import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { BlockRenderer } from "./block-renderer";
import { LoadingSpinner } from "../../components/ui";
import type { BlockContent } from "../event/block-types";

export default function CustomPageView() {
  const { pageSlug } = useParams<{ pageSlug: string }>();
  const { event } = useGuestOutletContext();

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ["custom-page-guest", event.id, pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event.id)
        .eq("slug", pageSlug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    enabled: !!pageSlug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--event-bg)" }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center" style={{ backgroundColor: "var(--event-bg)" }}>
        <h1 className="guest-title mb-2">Page Not Found</h1>
        <p style={{ color: "var(--event-muted)" }}>This page could not be found or is no longer available.</p>
      </div>
    );
  }

  const blocks = Array.isArray(page.blocks) ? (page.blocks as unknown as BlockContent[]) : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--event-bg)" }}>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="guest-title mb-8 text-center">{page.title}</h1>
        <div className="space-y-6">
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} event={event} />
          ))}
          {blocks.length === 0 && (
            <p className="text-center" style={{ color: "var(--event-muted)" }}>No content yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
