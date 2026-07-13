import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Gallery, GalleryItem } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState, SectionTitle } from "@/components/ui";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Plus, Trash2, Edit2, Star, Check, X, Image as ImageIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */

type GalleryWithItems = Gallery & { items: GalleryItem[] };

type GalleryFormState = { title: string };

type ImageFormState = {
  image_url: string | null;
  caption: string;
  is_featured: boolean;
};

const EMPTY_GALLERY_FORM: GalleryFormState = { title: "" };
const EMPTY_IMAGE_FORM: ImageFormState = { image_url: null, caption: "", is_featured: false };

/** Group gallery_items under their parent galleries, preserving sort order. */
function groupItems(galleries: Gallery[], items: GalleryItem[]): GalleryWithItems[] {
  return galleries.map((g) => ({
    ...g,
    items: items
      .filter((it) => it.gallery_id === g.id)
      .sort((a, b) => (a.is_featured === b.is_featured ? 0 : a.is_featured ? -1 : 1)),
  }));
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function AdminGallery() {
  const { wedding } = useHostWedding();
  const weddingId = wedding?.id;

  const [galleries, setGalleries] = useState<GalleryWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gallery create / rename modal
  const [galleryFormOpen, setGalleryFormOpen] = useState(false);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [galleryForm, setGalleryForm] = useState<GalleryFormState>(EMPTY_GALLERY_FORM);

  // Gallery delete confirmation
  const [deleteGalleryTarget, setDeleteGalleryTarget] = useState<Gallery | null>(null);

  // Image add / edit modal (scoped to a gallery)
  const [imageFormOpen, setImageFormOpen] = useState(false);
  const [imageGalleryId, setImageGalleryId] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [imageForm, setImageForm] = useState<ImageFormState>(EMPTY_IMAGE_FORM);

  // Image delete confirmation
  const [deleteImageTarget, setDeleteImageTarget] = useState<{ item: GalleryItem; galleryId: string } | null>(null);

  /* ---------------------------------------------------------------- */
  /* Data fetching                                                    */
  /* ---------------------------------------------------------------- */

  const fetchAll = useCallback(async () => {
    if (!weddingId) return;
    setLoading(true);
    setError(null);
    const [gRes, iRes] = await Promise.all([
      supabase.from("galleries").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
      supabase.from("gallery_items").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
    ]);
    if (gRes.error || iRes.error) {
      setError(gRes.error?.message ?? iRes.error?.message ?? "Failed to load gallery.");
    } else {
      setGalleries(groupItems((gRes.data ?? []) as Gallery[], (iRes.data ?? []) as GalleryItem[]));
    }
    setLoading(false);
  }, [weddingId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ---------------------------------------------------------------- */
  /* Gallery modal helpers                                            */
  /* ---------------------------------------------------------------- */

  const openCreateGallery = () => {
    setEditingGalleryId(null);
    setGalleryForm(EMPTY_GALLERY_FORM);
    setGalleryFormOpen(true);
  };

  const openRenameGallery = (g: Gallery) => {
    setEditingGalleryId(g.id);
    setGalleryForm({ title: g.title });
    setGalleryFormOpen(true);
  };

  const closeGalleryForm = () => {
    setGalleryFormOpen(false);
    setEditingGalleryId(null);
    setGalleryForm(EMPTY_GALLERY_FORM);
  };

  /* ---------------------------------------------------------------- */
  /* Image modal helpers                                              */
  /* ---------------------------------------------------------------- */

  const openAddImage = (galleryId: string) => {
    setImageGalleryId(galleryId);
    setEditingImageId(null);
    setImageForm(EMPTY_IMAGE_FORM);
    setImageFormOpen(true);
  };

  const openEditImage = (galleryId: string, item: GalleryItem) => {
    setImageGalleryId(galleryId);
    setEditingImageId(item.id);
    setImageForm({
      image_url: item.image_url,
      caption: item.caption ?? "",
      is_featured: item.is_featured,
    });
    setImageFormOpen(true);
  };

  const closeImageForm = () => {
    setImageFormOpen(false);
    setImageGalleryId(null);
    setEditingImageId(null);
    setImageForm(EMPTY_IMAGE_FORM);
  };

  /* ---------------------------------------------------------------- */
  /* CRUD: Gallery save (create / rename)                             */
  /* ---------------------------------------------------------------- */

  const handleSaveGallery = async () => {
    if (!weddingId) return;
    if (!galleryForm.title.trim()) {
      setError("Gallery title is required.");
      return;
    }
    setBusy(true);
    setError(null);

    if (editingGalleryId) {
      const { data, error } = await supabase
        .from("galleries")
        .update({ title: galleryForm.title.trim() })
        .eq("id", editingGalleryId)
        .select()
        .single();
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      setGalleries((prev) => prev.map((g) => (g.id === editingGalleryId ? { ...g, ...(data as Gallery) } : g)));
      closeGalleryForm();
    } else {
      const { data, error } = await supabase
        .from("galleries")
        .insert({
          wedding_id: weddingId,
          title: galleryForm.title.trim(),
          sort_order: galleries.length,
        })
        .select()
        .single();
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      setGalleries((prev) => [...prev, { ...(data as Gallery), items: [] }]);
      closeGalleryForm();
    }
  };

  /* ---------------------------------------------------------------- */
  /* CRUD: Gallery delete                                             */
  /* ---------------------------------------------------------------- */

  const handleDeleteGallery = async () => {
    if (!deleteGalleryTarget || !weddingId) return;
    setBusy(true);
    setError(null);

    // Delete child items first, then the gallery row.
    const { error: itemsErr } = await supabase
      .from("gallery_items")
      .delete()
      .eq("gallery_id", deleteGalleryTarget.id);
    if (itemsErr) {
      setBusy(false);
      setError(itemsErr.message);
      return;
    }
    const { error: gErr } = await supabase.from("galleries").delete().eq("id", deleteGalleryTarget.id);
    setBusy(false);
    if (gErr) {
      setError(gErr.message);
      return;
    }
    setGalleries((prev) => prev.filter((g) => g.id !== deleteGalleryTarget.id));
    setDeleteGalleryTarget(null);
  };

  /* ---------------------------------------------------------------- */
  /* CRUD: Image save (create / edit)                                 */
  /* ---------------------------------------------------------------- */

  const handleSaveImage = async () => {
    if (!weddingId || !imageGalleryId) return;
    if (!imageForm.image_url) {
      setError("Please upload an image.");
      return;
    }
    setBusy(true);
    setError(null);

    const row = {
      image_url: imageForm.image_url,
      caption: imageForm.caption.trim() || null,
      is_featured: imageForm.is_featured,
    };

    if (editingImageId) {
      const { data, error } = await supabase
        .from("gallery_items")
        .update(row)
        .eq("id", editingImageId)
        .select()
        .single();
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      setGalleries((prev) =>
        prev.map((g) =>
          g.id === imageGalleryId
            ? { ...g, items: g.items.map((it) => (it.id === editingImageId ? (data as GalleryItem) : it)) }
            : g,
        ),
      );
      closeImageForm();
    } else {
      const { data, error } = await supabase
        .from("gallery_items")
        .insert({
          ...row,
          wedding_id: weddingId,
          gallery_id: imageGalleryId,
          is_approved: true,
        })
        .select()
        .single();
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      setGalleries((prev) =>
        prev.map((g) => (g.id === imageGalleryId ? { ...g, items: [data as GalleryItem, ...g.items] } : g)),
      );
      closeImageForm();
    }
  };

  /* ---------------------------------------------------------------- */
  /* CRUD: Image delete                                               */
  /* ---------------------------------------------------------------- */

  const handleDeleteImage = async () => {
    if (!deleteImageTarget) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("gallery_items").delete().eq("id", deleteImageTarget.item.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setGalleries((prev) =>
      prev.map((g) =>
        g.id === deleteImageTarget.galleryId
          ? { ...g, items: g.items.filter((it) => it.id !== deleteImageTarget.item.id) }
          : g,
      ),
    );
    setDeleteImageTarget(null);
  };

  /* ---------------------------------------------------------------- */
  /* CRUD: Toggle image approval                                       */
  /* ---------------------------------------------------------------- */

  const toggleApproved = async (galleryId: string, item: GalleryItem) => {
    const next = !item.is_approved;
    // Optimistic update for snappy UI.
    setGalleries((prev) =>
      prev.map((g) =>
        g.id === galleryId
          ? { ...g, items: g.items.map((it) => (it.id === item.id ? { ...it, is_approved: next } : it)) }
          : g,
      ),
    );
    const { error } = await supabase.from("gallery_items").update({ is_approved: next }).eq("id", item.id);
    if (error) {
      setError(error.message);
      // Revert on failure.
      setGalleries((prev) =>
        prev.map((g) =>
          g.id === galleryId
            ? { ...g, items: g.items.map((it) => (it.id === item.id ? { ...it, is_approved: item.is_approved } : it)) }
            : g,
        ),
      );
    }
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */

  if (!weddingId) {
    return <div className="text-sepia text-sm">Loading wedding…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Gallery"
        subtitle="Curate photo galleries for your wedding — add, caption, feature, and approve images."
        action={
          <Button onClick={openCreateGallery}>
            <Plus className="w-4 h-4" />
            New Gallery
          </Button>
        }
      />

      {error && (
        <div className="rounded-md border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Galleries                                                  */}
      {/* ---------------------------------------------------------- */}
      {loading ? (
        <div className="text-sepia text-sm">Loading galleries…</div>
      ) : galleries.length === 0 ? (
        <Card>
          <EmptyState
            title="No galleries yet"
            description="Create your first gallery to start collecting and organizing wedding photos."
            action={
              <Button onClick={openCreateGallery}>
                <Plus className="w-4 h-4" />
                Create Gallery
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {galleries.map((gallery) => (
            <section key={gallery.id} className="space-y-4">
              {/* Gallery header */}
              <div className="flex items-center justify-between border-b border-sand pb-3">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-sepia/60" />
                  <h2 className="font-serif text-xl text-onyx">{gallery.title}</h2>
                  <Badge>{gallery.items.length} photos</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => openAddImage(gallery.id)}>
                    <Plus className="w-3.5 h-3.5" />
                    Add Image
                  </Button>
                  <button
                    className="rounded-md p-1.5 text-sepia/60 transition-colors hover:bg-sepia/10 hover:text-onyx"
                    onClick={() => openRenameGallery(gallery)}
                    title="Rename gallery"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="rounded-md p-1.5 text-sepia/60 transition-colors hover:bg-red-50 hover:text-red-600"
                    onClick={() => setDeleteGalleryTarget(gallery)}
                    title="Delete gallery"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Image grid */}
              {gallery.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-sand bg-mist/30 py-10 text-center">
                  <ImageIcon className="w-8 h-8 text-sepia/40 mb-2" />
                  <p className="text-sm text-sepia/70">No images in this gallery yet.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => openAddImage(gallery.id)}>
                    <Plus className="w-3.5 h-3.5" />
                    Add Image
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {gallery.items.map((item) => (
                    <Card key={item.id} className="group relative overflow-hidden p-0">
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-mist">
                        <img
                          src={item.image_url}
                          alt={item.caption ?? ""}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Featured star */}
                        {item.is_featured && (
                          <div className="absolute left-2 top-2 rounded-full bg-onyx/80 p-1 text-parchment">
                            <Star className="h-3.5 w-3.5 fill-current" />
                          </div>
                        )}
                        {/* Approval badge */}
                        <div className="absolute right-2 top-2">
                          {item.is_approved ? (
                            <Badge variant="success">
                              <Check className="mr-1 h-3 w-3" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </div>
                      </div>

                      {/* Caption + actions */}
                      <div className="p-3">
                        {item.caption ? (
                          <p className="mb-2 line-clamp-2 text-sm text-sepia/80">{item.caption}</p>
                        ) : (
                          <p className="mb-2 text-sm italic text-sepia/40">No caption</p>
                        )}

                        <div className="flex items-center gap-1 border-t border-sand pt-2">
                          {/* Toggle approval */}
                          <button
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sepia transition-colors hover:bg-sepia/10"
                            onClick={() => toggleApproved(gallery.id, item)}
                            title={item.is_approved ? "Unapprove image" : "Approve image"}
                          >
                            {item.is_approved ? (
                              <>
                                <X className="h-3.5 w-3.5" />
                                Unapprove
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                Approve
                              </>
                            )}
                          </button>

                          <div className="ml-auto flex items-center gap-1">
                            <button
                              className="rounded-md p-1.5 text-sepia/60 transition-colors hover:bg-sepia/10 hover:text-onyx"
                              onClick={() => openEditImage(gallery.id, item)}
                              title="Edit image"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              className="rounded-md p-1.5 text-sepia/60 transition-colors hover:bg-red-50 hover:text-red-600"
                              onClick={() => setDeleteImageTarget({ item, galleryId: gallery.id })}
                              title="Delete image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Gallery create / rename modal                               */}
      {/* ---------------------------------------------------------- */}
      <Modal
        open={galleryFormOpen}
        onClose={closeGalleryForm}
        title={editingGalleryId ? "Rename Gallery" : "New Gallery"}
      >
        <div className="space-y-4">
          <div>
            <Label>Gallery Title *</Label>
            <Input
              autoFocus
              value={galleryForm.title}
              onChange={(e) => setGalleryForm({ title: e.target.value })}
              placeholder="e.g. Ceremony, Reception, Behind the Scenes"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveGallery();
              }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeGalleryForm}>
              Cancel
            </Button>
            <Button onClick={handleSaveGallery} disabled={busy || !galleryForm.title.trim()}>
              {busy ? "Saving…" : editingGalleryId ? "Save Changes" : "Create Gallery"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---------------------------------------------------------- */}
      {/* Image add / edit modal                                      */}
      {/* ---------------------------------------------------------- */}
      <Modal
        open={imageFormOpen}
        onClose={closeImageForm}
        title={editingImageId ? "Edit Image" : "Add Image"}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div>
            <Label>Image *</Label>
            <ImageUpload
              weddingId={weddingId}
              value={imageForm.image_url}
              onChange={(url) => setImageForm((prev) => ({ ...prev, image_url: url }))}
            />
          </div>

          <div>
            <Label>Caption</Label>
            <Textarea
              rows={2}
              value={imageForm.caption}
              onChange={(e) => setImageForm((prev) => ({ ...prev, caption: e.target.value }))}
              placeholder="A short description or memory behind this photo."
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-sand bg-mist/30 px-4 py-3 transition-colors hover:bg-mist/50">
            <button
              type="button"
              role="switch"
              aria-checked={imageForm.is_featured}
              onClick={() => setImageForm((prev) => ({ ...prev, is_featured: !prev.is_featured }))}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                imageForm.is_featured ? "bg-sepia" : "bg-sand"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-parchment shadow transition-transform ${
                  imageForm.is_featured ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="flex items-center gap-1.5 text-sm text-sepia">
              <Star className={`h-4 w-4 ${imageForm.is_featured ? "fill-current text-sepia" : "text-sepia/50"}`} />
              Feature this image
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeImageForm}>
              Cancel
            </Button>
            <Button onClick={handleSaveImage} disabled={busy || !imageForm.image_url}>
              {busy ? "Saving…" : editingImageId ? "Save Changes" : "Add Image"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---------------------------------------------------------- */}
      {/* Gallery delete confirm modal                                */}
      {/* ---------------------------------------------------------- */}
      <Modal open={!!deleteGalleryTarget} onClose={() => setDeleteGalleryTarget(null)} title="Delete Gallery">
        <div className="space-y-4">
          <p className="text-sm text-sepia">
            Are you sure you want to delete{" "}
            <span className="font-medium text-onyx">"{deleteGalleryTarget?.title}"</span>?
          </p>
          <div className="rounded-md border border-sand bg-mist px-4 py-3 text-xs text-sepia/80">
            <p className="flex items-center gap-2">
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              This will permanently remove the gallery and all of its images. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteGalleryTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteGallery} disabled={busy}>
              {busy ? "Deleting…" : "Delete Gallery"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---------------------------------------------------------- */}
      {/* Image delete confirm modal                                  */}
      {/* ---------------------------------------------------------- */}
      <Modal open={!!deleteImageTarget} onClose={() => setDeleteImageTarget(null)} title="Delete Image">
        <div className="space-y-4">
          <p className="text-sm text-sepia">Are you sure you want to delete this image?</p>
          {deleteImageTarget?.item.image_url && (
            <div className="overflow-hidden rounded-md border border-sand">
              <img
                src={deleteImageTarget.item.image_url}
                alt={deleteImageTarget.item.caption ?? ""}
                className="max-h-48 w-full object-cover"
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteImageTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteImage} disabled={busy}>
              {busy ? "Deleting…" : "Delete Image"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminGallery;
