import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWedding } from "@/lib/use-wedding";
import { supabase, type CustomPage } from "@/lib/supabase";

export function GuestCustomPage() {
  const parts = location.pathname.split("/");
  const slug = parts[2]; const pageSlug = parts[4];
  const { wedding, loading, error } = useWedding(slug);
  const [page, setPage] = useState<CustomPage | null>(null);
  useEffect(() => { if (!wedding) return; supabase.from("custom_pages").select("*").eq("wedding_id", wedding.id).eq("slug", pageSlug).maybeSingle().then(({ data }) => setPage(data as CustomPage | null)); }, [wedding, pageSlug]);
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sepia">Loading…</div>;
  if (error || !wedding) return <div className="min-h-screen flex items-center justify-center text-red-600">{error ?? "Not found"}</div>;
  if (!page) return <div className="min-h-screen flex items-center justify-center text-sepia">Page not found</div>;
  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-16 bg-parchment">
      <div className="max-w-2xl mx-auto text-center text-sepia">
        {page.cover_image_url && <img src={page.cover_image_url} alt="" className="w-full h-64 md:h-80 object-cover rounded-md mb-10" />}
        <h1 className="text-2xl md:text-3xl tracking-[0.3em] font-medium mb-10 uppercase text-sepia">{page.title}</h1>
        {page.inline_image_url && <img src={page.inline_image_url} alt="" className="max-w-full mx-auto mb-8 rounded-md" />}
        {page.body && <div className="text-sm md:text-base tracking-wide leading-[2] whitespace-pre-line text-left">{page.body}</div>}
        <div className="mt-12"><Link to={`/w/${slug}`} className="text-sepia text-xs uppercase tracking-widest hover:text-onyx">Back to Home</Link></div>
      </div>
    </div>
  );
}
