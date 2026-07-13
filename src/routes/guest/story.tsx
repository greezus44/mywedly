import { useCallback, useEffect, useMemo, useState } from "react";
import { Heart, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WebsiteContent } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import type { ThemeConfig } from "@/lib/theme";
import { EmptyState } from "@/components/ui";

export function GuestStory() {
  const { wedding, loading } = useGuestData();
  const theme: ThemeConfig = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [fetching, setFetching] = useState(true);

  const weddingId = wedding?.id ?? "";

  const loadContent = useCallback(async () => {
    if (!weddingId) { setFetching(false); return; }
    setFetching(true);
    const { data } = await supabase
      .from("website_content")
      .select("*")
      .eq("wedding_id", weddingId)
      .eq("section", "story")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) setContent(data as WebsiteContent);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => { if (weddingId) loadContent(); }, [weddingId, loadContent]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" />;
  }

  // Prefer website_content, fall back to wedding.story
  const title = content?.title || "Our Story";
  const body = content?.body || wedding.story || "";
  const image = content?.image_url || wedding.hero_image_url;

  if (!body && !image) {
    return (
      <div style={cssVars as React.CSSProperties} className="animate-fade-in px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <EmptyState
            title="Our story is coming soon"
            description="Check back later for the tale of how we met."
          />
        </div>
      </div>
    );
  }

  return (
    <div style={cssVars as React.CSSProperties} className="animate-fade-in px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* ─── Header ─── */}
        <div className="text-center mb-12">
          <Heart className="w-6 h-6 mx-auto mb-3" style={{ color: "var(--c-accent)" }} />
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: "var(--c-textMuted)" }}>
            How it began
          </p>
          <h1 className="text-4xl font-serif" style={{ color: "var(--c-text)" }}>
            {title}
          </h1>
        </div>

        {/* ─── Image ─── */}
        {image && (
          <div className="mb-8 overflow-hidden rounded-lg shadow-lg" style={{ borderRadius: "var(--ui-radius)" }}>
            <img
              src={image}
              alt={title}
              className="w-full max-h-[480px] object-cover"
            />
          </div>
        )}

        {/* ─── Body ─── */}
        {body && (
          <div className="prose prose-lg max-w-none">
            <p
              className="whitespace-pre-line text-base leading-relaxed"
              style={{ color: "var(--c-text)", fontFamily: "var(--f-body)" }}
            >
              {body}
            </p>
          </div>
        )}

        {/* ─── Footer ornament ─── */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-3" style={{ color: "var(--c-accent)" }}>
            <span className="h-px w-12" style={{ background: "var(--c-accent)" }} />
            <BookOpen className="w-4 h-4" />
            <span className="h-px w-12" style={{ background: "var(--c-accent)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestStory;
