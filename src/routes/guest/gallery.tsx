import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X, Star, Images as ImagesIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Gallery, GalleryItem } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import type { ThemeConfig } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui";

export function GuestGallery() {
  const { wedding, loading } = useGuestData();
  const theme: ThemeConfig = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const weddingId = wedding?.id ?? "";

  const loadAll = useCallback(async () => {
    if (!weddingId) { setFetching(false); return; }
    setFetching(true);
    const [gals, its] = await Promise.all([
      supabase.from("galleries").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
      supabase.from("gallery_items")
        .select("*")
        .eq("wedding_id", weddingId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false }),
    ]);
    if (gals.data) setGalleries(gals.data as Gallery[]);
    if (its.data) setItems(its.data as GalleryItem[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => { if (weddingId) loadAll(); }, [weddingId, loadAll]);

  // ─── Flat list of all images (featured first) ───
  const allImages = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return 0;
    });
  }, [items]);

  // ─── Lightbox controls ───
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + allImages.length) % allImages.length));
  };
  const nextImage = () => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % allImages.length));
  };

  // ─── Keyboard nav ───
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, allImages.length]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading gallery…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" />;
  }

  if (allImages.length === 0) {
    return (
      <div style={cssVars as React.CSSProperties} className="animate-fade-in px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <EmptyState
            title="No photos yet"
            description="Check back soon for photos from our special moments."
          />
        </div>
      </div>
    );
  }

  const currentImage = lightboxIndex !== null ? allImages[lightboxIndex] : null;

  return (
    <div style={cssVars as React.CSSProperties} className="animate-fade-in px-6 py-12">
      <div className="max-w-5xl mx-auto">
        {/* ─── Header ─── */}
        <div className="text-center mb-12">
          <ImagesIcon className="w-6 h-6 mx-auto mb-3" style={{ color: "var(--c-accent)" }} />
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: "var(--c-textMuted)" }}>
            Memories
          </p>
          <h1 className="text-4xl font-serif" style={{ color: "var(--c-text)" }}>
            Gallery
          </h1>
          {galleries.length > 0 && (
            <p className="text-sm mt-2" style={{ color: "var(--c-textMuted)" }}>
              {galleries.length} {galleries.length === 1 ? "album" : "albums"} · {allImages.length} photos
            </p>
          )}
        </div>

        {/* ─── Gallery sections ─── */}
        {galleries.length > 0 ? (
          <div className="space-y-12">
            {galleries.map((gallery) => {
              const galleryItems = allImages.filter((i) => i.gallery_id === gallery.id);
              if (galleryItems.length === 0) return null;

              return (
                <div key={gallery.id}>
                  <h2 className="text-xl font-serif mb-4" style={{ color: "var(--c-text)" }}>
                    {gallery.title}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {galleryItems.map((item) => {
                      const globalIndex = allImages.findIndex((i) => i.id === item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => setLightboxIndex(globalIndex)}
                          className="relative aspect-square overflow-hidden rounded-lg group"
                          style={{ borderRadius: "var(--ui-radius)" }}
                        >
                          <img
                            src={item.image_url}
                            alt={item.caption ?? ""}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {item.is_featured && (
                            <span
                              className="absolute top-2 left-2 p-1 rounded-full"
                              style={{ background: "var(--c-button)", color: "var(--c-buttonText)" }}
                              title="Featured"
                            >
                              <Star className="w-3 h-3 fill-current" />
                            </span>
                          )}
                          {item.caption && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-xs text-white truncate">{item.caption}</p>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── No galleries — show all images ─── */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {allImages.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setLightboxIndex(index)}
                className="relative aspect-square overflow-hidden rounded-lg group"
                style={{ borderRadius: "var(--ui-radius)" }}
              >
                <img
                  src={item.image_url}
                  alt={item.caption ?? ""}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {item.is_featured && (
                  <span
                    className="absolute top-2 left-2 p-1 rounded-full"
                    style={{ background: "var(--c-button)", color: "var(--c-buttonText)" }}
                    title="Featured"
                  >
                    <Star className="w-3 h-3 fill-current" />
                  </span>
                )}
                {item.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white truncate">{item.caption}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Lightbox ─── */}
      {currentImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          <div className="max-w-4xl max-h-[85vh] px-16" onClick={(e) => e.stopPropagation()}>
            <img
              src={currentImage.image_url}
              alt={currentImage.caption ?? ""}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {currentImage.caption && (
              <p className="text-center text-sm text-white/80 mt-4">{currentImage.caption}</p>
            )}
            {currentImage.is_featured && (
              <div className="flex justify-center mt-2">
                <span className="inline-flex items-center gap-1 text-xs text-white/60">
                  <Star className="w-3 h-3 fill-current" /> Featured
                </span>
              </div>
            )}
          </div>

          {/* Next */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/60">
              {(lightboxIndex ?? 0) + 1} / {allImages.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GuestGallery;
