import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWedding } from "@/lib/use-wedding";
import { supabase, type CustomPage, type WeddingContent } from "@/lib/supabase";
import { styleWithGlobal } from "@/lib/text-styles";

export function GuestCustomPage() {
  const parts = location.pathname.split("/");
  const slug = parts[2]; const pageSlug = parts[4];
  const { wedding, loading, error } = useWedding(slug);
  const [page, setPage] = useState<CustomPage | null>(null);
  useEffect(() => { if (!wedding) return; supabase.from("custom_pages").select("*").eq("wedding_id", wedding.id).eq("slug", pageSlug).maybeSingle().then(({ data }) => setPage(data as CustomPage | null)); }, [wedding, pageSlug]);
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sepia">Loading…</div>;
  if (error || !wedding) return <div className="min-h-screen flex items-center justify-center text-red-600">{error ?? "Not found"}</div>;
  if (!page) return <div className="min-h-screen flex items-center justify-center text-sepia">Page not found</div>;
  const content = (wedding.content ?? {}) as WeddingContent;
  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-16 bg-parchment">
      <div className="max-w-2xl mx-auto text-center">
        {page.cover_image_url && <img src={page.cover_image_url} alt="" className="w-full h-64 md:h-80 object-cover rounded-md mb-10" />}
        <h1 className="mb-10" style={styleWithGlobal(content, "custom_page_title")}>{page.title}</h1>
        {page.inline_image_url && <img src={page.inline_image_url} alt="" className="max-w-full mx-auto mb-8 rounded-md" />}
        {page.body && <div className="whitespace-pre-line text-left" style={styleWithGlobal(content, "custom_page_body")}>{page.body}</div>}
        <div className="mt-12"><Link to={`/w/${slug}`} className="text-sepia text-xs uppercase tracking-widest hover:text-onyx">Back to Home</Link></div>
      </div>
    </div>
  );
}
