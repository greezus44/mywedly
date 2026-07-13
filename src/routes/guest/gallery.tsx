import { useCallback, useEffect, useMemo, useState } from "react";
import { Star, X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Gallery, GalleryItem } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Card, EmptyState } from "@/components/ui";

export function GuestGallery() {
  const { wedding, loading } = useGuestData();

  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const theme = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const weddingId = wedding?.id ?? null;

  const fetchAll = useCallback(async () => {
    if (!weddingId) return;
    setFetching(true);
    const [gRes, iRes] = await Promise.all([
      supabase.from("galleries").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
      supabase
        .from("gallery_items")
        .select("*")
        .eq("wedding_id", weddingId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false }),
    ]);
    setGalleries((gRes.data ?? []) as Gallery[]);
    setItems((iRes.data ?? []) as GalleryItem[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => {
    if (weddingId) fetchAll();
  }, [weddingId, fetchAll]);

  // ── Keyboard navigation for lightbox ──
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length));
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? null : (i + 1) % items.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, items.length]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia animate-fade-in">
        Loading gallery…
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="Wedding Not Found" description="We couldn't find the wedding you're looking for." />;
  }

  if (items.length === 0) {
    return (
      <div style={cssVars as React.CSSProperties} className="animate-fade-in">
        <section className="px-6 py-24 text-center" style={{ background: "var(--c-background)" }}>
          <EmptyState
            title="No photos yet"
            description="Check back soon for photos from our celebration."
          />
        </section>
      </div>
    );
  }

  // Sort: featured first, then by created_at
  const sortedItems = [...items].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  const currentLightboxItem = lightboxIndex !== null ? sortedItems[lightboxIndex] : null;

  return (
    <div style={cssVars as React.CSSProperties} className="animate-fade-in">
      {/* ── Header ── */}
      <section className="px-6 pt-16 pb-8 text-center" style={{ background: "var(--c-background)" }}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ background: "var(--c-secondary)" }}>
          <Images className="w-6 h-6" style={{ color: "var(--c-accent)" }} />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
          Memories
        </p>
        <h1 className="text-4xl md:text-5xl font-serif" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)", fontStyle: "var(--f-style)" }}>
          Gallery
        </h1>
        {galleries.length > 0 && (
          <p className="text-sm mt-3" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
            {galleries.map((g) => g.title).join(" · ")}
          </p>
        )}
      </section>

      {/* ── Gallery grid ── */}
      <section className="px-6 pb-16 md:pb-24" style={{ background: "var(--c-background)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {sortedItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setLightboxIndex(index)}
                className={cn(
                  "relative overflow-hidden rounded-lg group cursor-pointer animate-fade-in",
                  "aspect-square",
                )}
                style={{ boxShadow: "var(--ui-shadow)" }}
              >
                <img
                  src={item.image_url}
                  alt={item.caption ?? ""}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                {/* Featured star */}
                {item.is_featured && (
                  <div className="absolute top-2 right-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.9)" }}>
                      <Star className="w-4 h-4 fill-current" style={{ color: "var(--c-accent)" }} />
                    </div>
                  </div>
                )}
                {/* Caption on hover */}
                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <p className="text-xs text-white text-left line-clamp-2" style={{ fontFamily: "var(--f-body)" }}>
                      {item.caption}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lightbox ── */}
      {currentLightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: "rgba(0,0,0,0.9)" }}
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous button */}
          {sortedItems.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i === null ? null : (i - 1 + sortedItems.length) % sortedItems.length));
              }}
              className="absolute left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next button */}
          {sortedItems.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i === null ? null : (i + 1) % sortedItems.length));
              }}
              className="absolute right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-5xl max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentLightboxItem.image_url}
              alt={currentLightboxItem.caption ?? ""}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {currentLightboxItem.caption && (
              <p className="text-sm text-white/90 mt-4 text-center max-w-2xl" style={{ fontFamily: "var(--f-body)" }}>
                {currentLightboxItem.caption}
              </p>
            )}
            {currentLightboxItem.uploader_name && (
              <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "var(--f-body)" }}>
                — {currentLightboxItem.uploader_name}
              </p>
            )}
            {/* Position indicator */}
            {sortedItems.length > 1 && (
              <p className="text-xs text-white/40 mt-3" style={{ fontFamily: "var(--f-body)" }}>
                {(lightboxIndex ?? 0) + 1} of {sortedItems.length}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
