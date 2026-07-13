import { useCallback, useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Gallery, GalleryItem } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { EmptyState } from "@/components/ui";

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */

type GalleryWithItems = Gallery & { items: GalleryItem[] };

/** Group gallery_items under their parent galleries, preserving sort order. */
function groupItems(galleries: Gallery[], items: GalleryItem[]): GalleryWithItems[] {
  return galleries.map((g) => ({
    ...g,
    items: items
      .filter((it) => it.gallery_id === g.id)
      // Featured images first within each gallery, then by created_at desc.
      .sort((a, b) => (a.is_featured === b.is_featured ? 0 : a.is_featured ? -1 : 1)),
  }));
}

/** Flatten all gallery items into a single ordered list for lightbox navigation. */
function flattenItems(galleries: GalleryWithItems[]): GalleryItem[] {
  return galleries.flatMap((g) => g.items);
}

/* ------------------------------------------------------------------ */
/* Lightbox                                                            */
/* ------------------------------------------------------------------ */

function Lightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[index];

  // Keyboard navigation
  useEffect(() => {
    if (!item) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    // Prevent body scroll while lightbox is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [item, onClose, onPrev, onNext]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-onyx/80 backdrop-blur-sm" onClick={onClose} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-20 rounded-full bg-parchment/10 p-2 text-parchment transition-colors hover:bg-parchment/20"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Previous */}
      {items.length > 1 && (
        <button
          onClick={onPrev}
          className="absolute left-2 sm:left-4 z-20 rounded-full bg-parchment/10 p-2 text-parchment transition-colors hover:bg-parchment/20"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next */}
      {items.length > 1 && (
        <button
          onClick={onNext}
          className="absolute right-2 sm:right-4 z-20 rounded-full bg-parchment/10 p-2 text-parchment transition-colors hover:bg-parchment/20"
          aria-label="Next image"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Image + caption */}
      <figure className="relative z-10 flex max-h-[90vh] max-w-5xl flex-col items-center">
        <img
          src={item.image_url}
          alt={item.caption ?? ""}
          className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
        />
        {(item.caption || item.uploader_name) && (
          <figcaption className="mt-4 text-center">
            {item.caption && (
              <p className="font-serif text-lg text-parchment leading-relaxed">
                {item.caption}
              </p>
            )}
            {item.uploader_name && (
              <p className="mt-1 text-sm text-parchment/60 italic">
                — {item.uploader_name}
              </p>
            )}
          </figcaption>
        )}
        {items.length > 1 && (
          <p className="mt-3 text-xs text-parchment/50 tracking-widest uppercase">
            {index + 1} / {items.length}
          </p>
        )}
      </figure>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function GuestGallery() {
  const { wedding, loading } = useGuestData();

  const [galleries, setGalleries] = useState<GalleryWithItems[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox state — index into the flattened list of all visible items.
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    if (!wedding) return;
    setContentLoading(true);
    setError(null);

    const [gRes, iRes] = await Promise.all([
      supabase.from("galleries").select("*").eq("wedding_id", wedding.id).order("sort_order"),
      supabase
        .from("gallery_items")
        .select("*")
        .eq("wedding_id", wedding.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false }),
    ]);

    if (gRes.error || iRes.error) {
      setError(gRes.error?.message ?? iRes.error?.message ?? "Failed to load gallery.");
    } else {
      setGalleries(
        groupItems((gRes.data ?? []) as Gallery[], (iRes.data ?? []) as GalleryItem[]),
      );
    }
    setContentLoading(false);
  }, [wedding]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Flat list of all items across galleries for lightbox navigation.
  const allItems = useMemo(() => flattenItems(galleries), [galleries]);
  const totalPhotos = allItems.length;

  // Lightbox navigation helpers — wrap around the full list.
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevImage = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? null : (prev - 1 + allItems.length) % allItems.length));
  }, [allItems.length]);
  const nextImage = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % allItems.length));
  }, [allItems.length]);

  /* ---------------------------------------------------------------- */
  /* Render states                                                     */
  /* ---------------------------------------------------------------- */

  if (loading || contentLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sepia">
        Loading…
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sepia">
        Wedding not found.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 text-sepia mb-4">
          <span className="h-px w-12 bg-sand" />
          <ImageIcon className="w-5 h-5" />
          <span className="h-px w-12 bg-sand" />
        </div>
        <h1 className="text-4xl md:text-5xl font-script text-onyx mb-2">Gallery</h1>
        {totalPhotos > 0 && (
          <p className="text-sepia/70 text-sm tracking-widest uppercase">
            {totalPhotos} {totalPhotos === 1 ? "Photo" : "Photos"}
          </p>
        )}
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Galleries */}
      {galleries.length === 0 ? (
        <EmptyState
          title="No galleries yet"
          description="Photos from the celebration will appear here once they're shared."
        />
      ) : totalPhotos === 0 ? (
        <EmptyState
          title="No photos yet"
          description="Check back after the celebration to see photos from the big day."
        />
      ) : (
        <div className="space-y-12">
          {galleries.map((gallery) => {
            if (gallery.items.length === 0) return null;
            return (
              <section key={gallery.id} className="space-y-5">
                {/* Section header */}
                <div className="flex items-center gap-3 border-b border-sand pb-3">
                  <ImageIcon className="w-5 h-5 text-sepia/60" />
                  <h2 className="font-serif text-2xl text-onyx">{gallery.title}</h2>
                  <span className="text-sm text-sepia/60">
                    {gallery.items.length} {gallery.items.length === 1 ? "photo" : "photos"}
                  </span>
                </div>

                {/* Responsive image grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {gallery.items.map((item) => {
                    const flatIdx = allItems.findIndex((it) => it.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => setLightboxIndex(flatIdx)}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-sand bg-mist focus:outline-none focus:ring-2 focus:ring-sepia/40"
                      >
                        <img
                          src={item.image_url}
                          alt={item.caption ?? ""}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Featured star indicator */}
                        {item.is_featured && (
                          <div className="absolute left-2 top-2 rounded-full bg-onyx/70 p-1 text-parchment shadow-sm backdrop-blur-sm">
                            <Star className="h-3.5 w-3.5 fill-current" />
                          </div>
                        )}

                        {/* Caption overlay on hover */}
                        {item.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-onyx/70 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <p className="line-clamp-2 text-left text-xs text-parchment leading-snug">
                              {item.caption}
                            </p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Decorative footer */}
      <div className="flex items-center justify-center gap-3 text-sepia mt-12">
        <span className="h-px w-10 bg-sand" />
        <ImageIcon className="w-4 h-4" />
        <span className="h-px w-10 bg-sand" />
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && allItems.length > 0 && (
        <Lightbox
          items={allItems}
          index={Math.min(lightboxIndex, allItems.length - 1)}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </div>
  );
}

export default GuestGallery;
