import { Link } from "react-router-dom";
import { useWedding } from "@/lib/use-wedding";
import { styleWithGlobal } from "@/lib/text-styles";
import { PreserveText } from "@/components/guest/PreserveText";
import type { WeddingContent } from "@/lib/supabase";

export function GuestCover() {
  const slug = location.pathname.split("/")[2];
  const { wedding, loading, error } = useWedding(slug);
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sepia">Loading…</div>;
  if (error || !wedding) return <div className="min-h-screen flex items-center justify-center text-red-600">{error ?? "Not found"}</div>;
  const content = (wedding.content ?? {}) as WeddingContent;
  const heading = content.cover_heading || `${wedding.couple_name_one} & ${wedding.couple_name_two}`;
  const subtitle = content.cover_subtitle;
  const welcome = content.cover_welcome;
  const bgUrl = content.cover_background_url ?? wedding.hero_image_url ?? null;
  const d = wedding.wedding_date ? new Date(wedding.wedding_date) : null;
  const month = d?.toLocaleDateString("en-US", { month: "long" }) ?? "";
  const year = d?.getFullYear().toString() ?? "";
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6" style={{ background: bgUrl ? undefined : "#fdfcf9" }}>
      {bgUrl && <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgUrl})`, opacity: 0.25 }} />}
      <div className="relative z-10 max-w-2xl">
        <p className="mb-6" style={styleWithGlobal(content, "cover_subtitle")}><PreserveText>{subtitle || `${month}${year ? `\n${year}` : ""}`}</PreserveText></p>
        <h1 className="mb-8" style={styleWithGlobal(content, "cover_heading")}><PreserveText>{heading}</PreserveText></h1>
        {welcome && <p className="max-w-md mx-auto mb-10" style={styleWithGlobal(content, "cover_welcome")}><PreserveText>{welcome}</PreserveText></p>}
        <Link to={`/w/${slug}/invitation`} className="inline-block border-2 border-sepia/70 rounded-md px-8 py-3 transition-colors hover:bg-sepia hover:text-parchment" style={styleWithGlobal(content, "cover_button")}>View Invitation</Link>
      </div>
    </div>
  );
}
