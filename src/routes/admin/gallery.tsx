import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit2, Save, Eye, Star, Check, X, Image as ImageIcon, FolderOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Gallery, GalleryItem } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { getDraftTheme } from "@/lib/theme";
import type { ThemeConfig } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Toggle } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState, SectionTitle, Toast } from "@/components/ui";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { SplitEditor } from "@/components/preview/SplitEditor";
import { GalleryPreview } from "@/components/preview/PreviewRenderers";

// ─── Form states ───
type GalleryForm = { title: string };

type ItemForm = {
  image_url: string | null;
  caption: string;
  is_featured: boolean;
};

const emptyItemForm: ItemForm = { image_url: null, caption: "", is_featured: false };

// ─── Component ───
export function AdminGallery() {
  const { wedding, loading } = useHostWedding();
  const theme: ThemeConfig = useMemo(() => getDraftTheme(wedding), [wedding]);

  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeGalleryId, setActiveGalleryId] = useState<string | null>(null);
  const [createGalleryOpen, setCreateGalleryOpen] = useState(false);
  const [newGalleryTitle, setNewGalleryTitle] = useState("");
  const [renameTarget, setRenameTarget] = useState<Gallery | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [deleteGalleryTarget, setDeleteGalleryTarget] = useState<Gallery | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<GalleryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const weddingId = wedding?.id ?? "";

  // ─── Load galleries ───
  const loadGalleries = useCallback(async () => {
    if (!weddingId) { setGalleries([]); setFetching(false); return; }
    setFetching(true);
    const { data, error } = await supabase
      .from("galleries")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("sort_order", { ascending: true });
    if (!error && data) {
      const gals = data as Gallery[];
      setGalleries(gals);
      if (gals.length > 0 && !activeGalleryId) setActiveGalleryId(gals[0].id);
    }
    setFetching(false);
  }, [weddingId, activeGalleryId]);

  // ─── Load items ───
  const loadItems = useCallback(async () => {
    if (!weddingId) { setItems([]); return; }
    const { data, error } = await supabase
      .from("gallery_items")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("created_at", { ascending: false });
    if (!error && data) setItems(data as GalleryItem[]);
  }, [weddingId]);

  useEffect(() => { if (weddingId) loadGalleries(); }, [weddingId, loadGalleries]);
  useEffect(() => { if (weddingId) loadItems(); }, [weddingId, loadItems]);

  // ─── Helpers ───
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const activeGallery = useMemo(
    () => galleries.find((g) => g.id === activeGalleryId) ?? null,
    [galleries, activeGalleryId]
  );

  const activeItems = useMemo(
    () => items.filter((i) => i.gallery_id === activeGalleryId),
    [items, activeGalleryId]
  );

  const editingItem = useMemo(
    () => activeItems.find((i) => i.id === editingItemId) ?? null,
    [activeItems, editingItemId]
  );

  const previewImages = useMemo(
    () => activeItems.map((i) => ({ image_url: i.image_url, caption: i.caption, is_featured: i.is_featured })),
    [activeItems]
  );

  // ─── Gallery CRUD ───
  const createGallery = async () => {
    if (!weddingId) return;
    const title = newGalleryTitle.trim();
    if (!title) { showToast("Gallery title is required", "error"); return; }
    setSaving(true);
    const sortMax = galleries.reduce((mx, g) => Math.max(mx, g.sort_order), -1);
    const { data, error } = await supabase
      .from("galleries")
      .insert({ wedding_id: weddingId, title, sort_order: sortMax + 1 })
      .select()
      .single();
    setSaving(false);
    if (error) { showToast(`Create failed: ${error.message}`, "error"); return; }
    setNewGalleryTitle("");
    setCreateGalleryOpen(false);
    showToast("Gallery created");
    await loadGalleries();
    if (data) setActiveGalleryId((data as Gallery).id);
  };

  const renameGallery = async () => {
    if (!renameTarget) return;
    const title = renameTitle.trim();
    if (!title) { showToast("Gallery title is required", "error"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("galleries")
      .update({ title })
      .eq("id", renameTarget.id);
    setSaving(false);
    if (error) { showToast(`Rename failed: ${error.message}`, "error"); return; }
    showToast("Gallery renamed");
    setRenameTarget(null);
    await loadGalleries();
  };

  const deleteGallery = async (g: Gallery) => {
    // Delete items first, then gallery
    await supabase.from("gallery_items").delete().eq("gallery_id", g.id);
    const { error } = await supabase.from("galleries").delete().eq("id", g.id);
    if (error) { showToast(`Delete failed: ${error.message}`, "error"); return; }
    showToast("Gallery deleted");
    setDeleteGalleryTarget(null);
    if (activeGalleryId === g.id) setActiveGalleryId(null);
    await loadGalleries();
    await loadItems();
  };

  // ─── Item CRUD ───
  const startAddItem = () => {
    setItemForm(emptyItemForm);
    setEditingItemId(null);
  };

  const startEditItem = (item: GalleryItem) => {
    setItemForm({
      image_url: item.image_url,
      caption: item.caption ?? "",
      is_featured: item.is_featured,
    });
    setEditingItemId(item.id);
  };

  const cancelItemEdit = () => {
    setItemForm(emptyItemForm);
    setEditingItemId(null);
  };

  const saveItem = async () => {
    if (!weddingId || !activeGalleryId) return;
    if (!itemForm.image_url) { showToast("Image is required", "error"); return; }
    setSaving(true);
    let error: { message: string } | null = null;
    const payload = {
      wedding_id: weddingId,
      gallery_id: activeGalleryId,
      image_url: itemForm.image_url,
      caption: itemForm.caption.trim() || null,
      is_featured: itemForm.is_featured,
      is_approved: true,
    };
    if (editingItemId) {
      ({ error } = await supabase.from("gallery_items").update({
        image_url: payload.image_url,
        caption: payload.caption,
        is_featured: payload.is_featured,
      }).eq("id", editingItemId));
    } else {
      ({ error } = await supabase.from("gallery_items").insert(payload).select().single());
    }
    setSaving(false);
    if (error) { showToast(`Save failed: ${error.message}`, "error"); return; }
    showToast(editingItemId ? "Image updated" : "Image added");
    cancelItemEdit();
    await loadItems();
  };

  const deleteItem = async (item: GalleryItem) => {
    const { error } = await supabase.from("gallery_items").delete().eq("id", item.id);
    if (error) { showToast(`Delete failed: ${error.message}`, "error"); return; }
    showToast("Image deleted");
    setDeleteItemTarget(null);
    await loadItems();
  };

  const toggleApprove = async (item: GalleryItem) => {
    const { error } = await supabase
      .from("gallery_items")
      .update({ is_approved: !item.is_approved })
      .eq("id", item.id);
    if (error) { showToast(`Update failed: ${error.message}`, "error"); return; }
    await loadItems();
  };

  const toggleFeatured = async (item: GalleryItem) => {
    const { error } = await supabase
      .from("gallery_items")
      .update({ is_featured: !item.is_featured })
      .eq("id", item.id);
    if (error) { showToast(`Update failed: ${error.message}`, "error"); return; }
    await loadItems();
  };

  // ─── Render ───
  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading gallery…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to manage galleries." />;
  }

  // ─── Gallery view (SplitEditor with live preview) ───
  if (activeGallery) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveGalleryId(null)}
              className="text-sepia hover:text-onyx text-sm flex items-center gap-1.5 transition-colors"
            >
              ← Back to galleries
            </button>
            <span className="text-sepia/30">/</span>
            <h1 className="text-xl font-serif text-onyx">{activeGallery.title}</h1>
            <Badge>{activeItems.length} images</Badge>
          </div>
        </div>

        <SplitEditor
          editor={
            <div className="space-y-5">
              {/* ─── Add / Edit image form ─── */}
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-base text-onyx">
                    {editingItemId ? "Edit Image" : "Add Image"}
                  </h3>
                  {editingItemId && (
                    <Button size="sm" variant="ghost" onClick={cancelItemEdit}>
                      <X className="w-3.5 h-3.5" /> Cancel edit
                    </Button>
                  )}
                </div>

                <div>
                  <Label>Image</Label>
                  <ImageUpload
                    weddingId={weddingId}
                    value={itemForm.image_url}
                    onChange={(url) => setItemForm((f) => ({ ...f, image_url: url }))}
                  />
                </div>

                <div>
                  <Label>Caption</Label>
                  <Input
                    value={itemForm.caption}
                    onChange={(e) => setItemForm((f) => ({ ...f, caption: e.target.value }))}
                    placeholder="Optional caption…"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-sand">
                  <div>
                    <Label>Featured</Label>
                    <p className="text-xs text-sepia/60 -mt-1">Highlight this image on the site.</p>
                  </div>
                  <Toggle
                    checked={itemForm.is_featured}
                    onChange={(v) => setItemForm((f) => ({ ...f, is_featured: v }))}
                    label={itemForm.is_featured ? "Featured" : "No"}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  {editingItemId && (
                    <Button variant="outline" onClick={cancelItemEdit}>Cancel</Button>
                  )}
                  <Button onClick={saveItem} disabled={saving || !itemForm.image_url}>
                    <Save className="w-4 h-4" /> {editingItemId ? "Update" : "Add"} Image
                  </Button>
                </div>
              </Card>

              {/* ─── Image list ─── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-base text-onyx">Images in this gallery</h3>
                  {!editingItemId && (
                    <Button size="sm" variant="outline" onClick={startAddItem}>
                      <Plus className="w-3.5 h-3.5" /> Add
                    </Button>
                  )}
                </div>

                {activeItems.length === 0 ? (
                  <Card className="p-8 text-center">
                    <ImageIcon className="w-8 h-8 text-sepia/30 mx-auto mb-2" />
                    <p className="text-sm text-sepia/60">No images yet. Add your first image above.</p>
                  </Card>
                ) : (
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                    {activeItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden group">
                        <div className="relative aspect-square">
                          <img
                            src={item.image_url}
                            alt={item.caption ?? ""}
                            className="w-full h-full object-cover"
                          />
                          {/* Badges */}
                          <div className="absolute top-1.5 left-1.5 flex gap-1">
                            {item.is_featured && (
                              <span className="bg-onyx/80 text-parchment p-1 rounded-full" title="Featured">
                                <Star className="w-3 h-3 fill-current" />
                              </span>
                            )}
                            <span
                              className={`p-1 rounded-full ${item.is_approved ? "bg-green-600/80 text-white" : "bg-yellow-500/80 text-white"}`}
                              title={item.is_approved ? "Approved" : "Pending"}
                            >
                              {item.is_approved ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            </span>
                          </div>
                          {/* Hover actions */}
                          <div className="absolute inset-0 bg-onyx/0 group-hover:bg-onyx/30 transition-colors flex items-end justify-center gap-1 pb-2 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => toggleFeatured(item)}
                              className={`p-1.5 rounded-full transition-colors ${item.is_featured ? "bg-onyx text-parchment" : "bg-white/90 text-sepia hover:bg-white"}`}
                              title={item.is_featured ? "Unfeature" : "Feature"}
                            >
                              <Star className={`w-3.5 h-3.5 ${item.is_featured ? "fill-current" : ""}`} />
                            </button>
                            <button
                              onClick={() => toggleApprove(item)}
                              className={`p-1.5 rounded-full transition-colors ${item.is_approved ? "bg-green-600 text-white" : "bg-white/90 text-sepia hover:bg-white"}`}
                              title={item.is_approved ? "Unapprove" : "Approve"}
                            >
                              {item.is_approved ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => startEditItem(item)}
                              className="p-1.5 rounded-full bg-white/90 text-sepia hover:bg-white transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteItemTarget(item)}
                              className="p-1.5 rounded-full bg-white/90 text-red-600 hover:bg-white transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {item.caption && (
                          <p className="text-xs text-sepia/70 px-2 py-1.5 truncate">{item.caption}</p>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          }
          preview={
            <GalleryPreview images={previewImages} theme={theme} />
          }
          previewLabel="Guest Preview"
          actions={
            <>
              <Button variant="outline" onClick={() => setRenameTarget(activeGallery)}>
                <Edit2 className="w-4 h-4" /> Rename
              </Button>
              <Button variant="danger" onClick={() => setDeleteGalleryTarget(activeGallery)}>
                <Trash2 className="w-4 h-4" /> Delete Gallery
              </Button>
            </>
          }
        />

        {/* ─── Rename gallery modal ─── */}
        <Modal open={!!renameTarget} onClose={() => setRenameTarget(null)} title="Rename Gallery">
          <div className="space-y-4">
            <div>
              <Label>Gallery Title</Label>
              <Input
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                placeholder="Gallery name"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancel</Button>
              <Button onClick={renameGallery} disabled={saving}>Rename</Button>
            </div>
          </div>
        </Modal>

        {/* ─── Delete gallery confirmation ─── */}
        <Modal open={!!deleteGalleryTarget} onClose={() => setDeleteGalleryTarget(null)} title="Delete Gallery">
          <div className="space-y-4">
            <p className="text-sm text-sepia">
              Are you sure you want to delete{" "}
              <span className="font-medium text-onyx">{deleteGalleryTarget?.title}</span> and all
              its images? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteGalleryTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => deleteGalleryTarget && deleteGallery(deleteGalleryTarget)}>
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>
          </div>
        </Modal>

        {/* ─── Delete item confirmation ─── */}
        <Modal open={!!deleteItemTarget} onClose={() => setDeleteItemTarget(null)} title="Delete Image">
          <div className="space-y-4">
            <p className="text-sm text-sepia">Are you sure you want to delete this image?</p>
            {deleteItemTarget && (
              <img
                src={deleteItemTarget.image_url}
                alt=""
                className="w-full max-w-xs mx-auto rounded-lg border border-sand"
              />
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteItemTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => deleteItemTarget && deleteItem(deleteItemTarget)}>
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>
          </div>
        </Modal>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ─── Galleries list view ───
  return (
    <div>
      <SectionTitle
        title="Gallery"
        subtitle="Organize your wedding photos into beautiful galleries."
        action={
          <Button onClick={() => setCreateGalleryOpen(true)}>
            <Plus className="w-4 h-4" /> New Gallery
          </Button>
        }
      />

      {galleries.length === 0 ? (
        <EmptyState
          title="No galleries yet"
          description="Create a gallery to start adding photos."
          action={
            <Button onClick={() => setCreateGalleryOpen(true)}>
              <Plus className="w-4 h-4" /> Create Gallery
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleries.map((g) => {
            const gItems = items.filter((i) => i.gallery_id === g.id);
            const cover = gItems.find((i) => i.is_featured)?.image_url ?? gItems[0]?.image_url ?? null;

            return (
              <Card key={g.id} className="overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow" >
                <div
                  className="relative h-40 overflow-hidden bg-mist"
                  onClick={() => setActiveGalleryId(g.id)}
                >
                  {cover ? (
                    <img src={cover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-10 h-10 text-sepia/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <Badge className="absolute top-2 right-2 bg-white/90">{gItems.length} photos</Badge>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-serif text-lg text-onyx mb-1">{g.title}</h3>
                  <p className="text-sm text-sepia/60 flex-1">
                    {gItems.length === 0
                      ? "No images yet"
                      : `${gItems.filter((i) => i.is_approved).length} approved · ${gItems.filter((i) => i.is_featured).length} featured`}
                  </p>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-sand">
                    <Button size="sm" onClick={() => setActiveGalleryId(g.id)}>
                      <FolderOpen className="w-3.5 h-3.5" /> Open
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setRenameTarget(g); setRenameTitle(g.title); }}>
                      <Edit2 className="w-3.5 h-3.5" /> Rename
                    </Button>
                    <button
                      onClick={() => setDeleteGalleryTarget(g)}
                      className="ml-auto text-sepia/50 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                      title="Delete gallery"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Create gallery modal ─── */}
      <Modal open={createGalleryOpen} onClose={() => setCreateGalleryOpen(false)} title="New Gallery">
        <div className="space-y-4">
          <div>
            <Label>Gallery Title</Label>
            <Input
              value={newGalleryTitle}
              onChange={(e) => setNewGalleryTitle(e.target.value)}
              placeholder="e.g. Wedding Day"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateGalleryOpen(false)}>Cancel</Button>
            <Button onClick={createGallery} disabled={saving}>
              <Plus className="w-4 h-4" /> Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Rename gallery modal ─── */}
      <Modal open={!!renameTarget} onClose={() => setRenameTarget(null)} title="Rename Gallery">
        <div className="space-y-4">
          <div>
            <Label>Gallery Title</Label>
            <Input
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              placeholder="Gallery name"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancel</Button>
            <Button onClick={renameGallery} disabled={saving}>Rename</Button>
          </div>
        </div>
      </Modal>

      {/* ─── Delete gallery confirmation ─── */}
      <Modal open={!!deleteGalleryTarget} onClose={() => setDeleteGalleryTarget(null)} title="Delete Gallery">
        <div className="space-y-4">
          <p className="text-sm text-sepia">
            Are you sure you want to delete{" "}
            <span className="font-medium text-onyx">{deleteGalleryTarget?.title}</span> and all
            its images? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteGalleryTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteGalleryTarget && deleteGallery(deleteGalleryTarget)}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminGallery;
