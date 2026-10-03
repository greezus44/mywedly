import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { BlockRenderer } from "./block-renderer";
import { jsonToBlocks } from "../event/block-types";
import { LoadingSpinner } from "../../components/ui";
import { useLanguage } from "../../lib/language";
import { setCurrentLanguage } from "../../lib/translations";
import { sanitizeHtml } from "../../lib/sanitize";
import { getTypographyStyle, type TypographyStyle } from "../../lib/typography";

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const { event } = useGuestOutletContext();
  const { t, language } = useLanguage();
  setCurrentLanguage(language);

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
      <h1 className="guest-title mb-2">{t("Page Not Found", "Halaman Tidak Ditemui")}</h1>
      <p className="guest-subtitle mb-4">{t("This page could not be found or is not published.", "Halaman ini tidak ditemui atau tidak diterbitkan.")}</p>
      <Link to={`/e/${slug}/home`} className="event-btn-primary inline-block">{t("Back to Home", "Kembali ke Utama")}</Link>
    </div>
  );

  const blocks = jsonToBlocks(page.blocks);

  return (
    <div className="guest-section guest-rsvp-page">
      <div className="mx-auto max-w-3xl guest-rsvp-content">
        <div className="pt-8 sm:pt-12 mb-12 sm:mb-16">
          <h1 className="guest-title text-center" style={{ ...getTypographyStyle(page.heading_typography as TypographyStyle | null), marginBottom: 0 }}>{page.title}</h1>
        </div>
        {blocks.length > 0 ? (
          <div className="space-y-6">
            {blocks.map((block) => <BlockRenderer key={block.id} block={block} eventId={event.id} />)}
          </div>
        ) : (
          page.body ? <div className="rich-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.body) }} /> : <p className="text-center text-dash-muted">{t("No content yet.", "Tiada kandungan lagi.")}</p>
        )}
      </div>
    </div>
  );
}
