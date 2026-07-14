import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { BlockRenderer } from "./block-renderer";

interface GuestPage extends CustomPage {
  nav_label?: string;
}

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const navigate = useNavigate();
  const { event } = useGuestOutletContext();

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ["guest-custom-page", event.id, pageSlug],
    enabled: !!pageSlug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event.id)
        .eq("slug", pageSlug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as GuestPage | null;
    },
  });

  if (isLoading) {
    return (
      <section className="guest-section text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "var(--event-primary)", borderTopColor: "transparent" }} />
      </section>
    );
  }

  if (isError || !page) {
    return (
      <section className="guest-section text-center">
        <div className="mx-auto max-w-md">
          <h1 className="guest-title mb-2">Page Not Found</h1>
          <p className="guest-subtitle mb-6">This page could not be found or is no longer available.</p>
          <button onClick={() => navigate(`/e/${slug}/home`)} className="event-btn-primary">Back to Home</button>
        </div>
      </section>
    );
  }

  return (
    <section className="guest-section">
      <div className="mx-auto max-w-3xl">
        <p className="guest-eyebrow text-center">{page.nav_label || page.title}</p>
        <h1 className="guest-title mb-8 text-center">{page.title}</h1>
        <BlockRenderer content={page.content} />
      </div>
    </section>
  );
}
