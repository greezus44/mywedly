import { Link } from "react-router-dom";
import { useWedding } from "@/lib/use-wedding";
import { styleFor, getStyle } from "@/lib/text-styles";
import type { WeddingContent } from "@/lib/supabase";

export function GuestInfo() {
  const slug = location.pathname.split("/")[2];
  const { wedding, loading, error } = useWedding(slug);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sepia">Loading…</div>;
  if (error || !wedding) return <div className="min-h-screen flex items-center justify-center text-red-600">{error ?? "Not found"}</div>;

  const content = (wedding.content ?? {}) as WeddingContent;
  const heading = (content.info_heading as string) ?? "Information";
  const body = (content.info_body as string) ?? "";
  const image = (content.info_image_url as string) ?? null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-16 bg-parchment">
      <div className="max-w-2xl">
        <h1 className="text-2xl md:text-3xl tracking-[0.35em] font-medium mb-12 uppercase text-sepia" style={styleFor(getStyle(content, "info_heading"))}>
          {heading.toUpperCase()}
        </h1>
        {image && <img src={image} alt="" className="max-w-full mx-auto mb-10 rounded-md" />}
        {body ? (
          <div className="text-sepia text-sm tracking-wide leading-[2.4] font-medium whitespace-pre-line mb-16" style={styleFor(getStyle(content, "info_body"))}>
            {body}
          </div>
        ) : (
          <p className="text-sepia/60 italic mb-16" style={{ fontFamily: "var(--font-serif)" }}>
            Additional information can be added from the dashboard.
          </p>
        )}
        <Link
          to={`/w/${slug}/events`}
          className="inline-block border-2 border-sepia/70 rounded-md px-8 py-3 text-sepia text-xs uppercase tracking-widest hover:bg-sepia hover:text-parchment transition-colors"
        >
          Events
        </Link>
      </div>
    </div>
  );
}
