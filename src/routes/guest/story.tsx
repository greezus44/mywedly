import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WebsiteContent } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import { Card, EmptyState } from "@/components/ui";

export function GuestStory() {
  const { wedding, loading } = useGuestData();

  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [fetching, setFetching] = useState(true);

  const theme = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const weddingId = wedding?.id ?? null;

  useEffect(() => {
    if (!weddingId) return;
    setFetching(true);
    supabase
      .from("website_content")
      .select("*")
      .eq("wedding_id", weddingId)
      .eq("section", "story")
      .maybeSingle()
      .then(({ data }) => {
        setContent((data as WebsiteContent) ?? null);
        setFetching(false);
      });
  }, [weddingId]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia animate-fade-in">
        Loading…
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="Wedding Not Found" description="We couldn't find the wedding you're looking for." />;
  }

  // Prefer website_content, fall back to wedding.story
  const title = content?.title ?? "Our Story";
  const body = content?.body ?? wedding.story ?? null;
  const imageUrl = content?.image_url ?? wedding.hero_image_url ?? null;

  if (!body && !imageUrl) {
    return (
      <div style={cssVars as React.CSSProperties} className="animate-fade-in">
        <section className="px-6 py-24 text-center" style={{ background: "var(--c-background)" }}>
          <EmptyState
            title="Our story is coming soon"
            description="Check back soon to read about our journey together."
          />
        </section>
      </div>
    );
  }

  return (
    <div style={cssVars as React.CSSProperties} className="animate-fade-in">
      {/* ── Header ── */}
      <section className="px-6 pt-16 pb-8 text-center" style={{ background: "var(--c-background)" }}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ background: "var(--c-secondary)" }}>
          <Heart className="w-6 h-6" style={{ color: "var(--c-accent)" }} />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
          How it all began
        </p>
        <h1 className="text-4xl md:text-5xl font-serif" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)", fontStyle: "var(--f-style)" }}>
          {title}
        </h1>
      </section>

      {/* ── Story content ── */}
      <section className="px-6 pb-16 md:pb-24" style={{ background: "var(--c-background)" }}>
        <div className="max-w-3xl mx-auto">
          {imageUrl && (
            <div className="mb-8 overflow-hidden rounded-lg animate-fade-in" style={{ boxShadow: "var(--ui-shadow)" }}>
              <img src={imageUrl} alt={title} className="w-full h-auto object-cover max-h-[480px]" />
            </div>
          )}

          {body && (
            <Card
              className="p-8 md:p-10 animate-fade-in"
              style={{ borderColor: "var(--c-secondary)", background: "var(--c-card)" } as React.CSSProperties}
            >
              <p
                className="text-base md:text-lg leading-relaxed whitespace-pre-line"
                style={{ color: "var(--c-text)", fontFamily: "var(--f-body)" }}
              >
                {body}
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
