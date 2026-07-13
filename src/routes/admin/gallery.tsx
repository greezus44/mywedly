import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Image as ImageIcon, MoveUp, MoveDown } from "lucide-react";
import { supabase, Wedding, WeddingContent, ThemeConfig } from "../../lib/supabase";
import { DEFAULT_CONTENT, DEFAULT_THEME } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, FormField, ImageUpload, EmptyState, Toast, ErrorState } from "../../components/ui/index";
import { debounce } from "../../lib/utils";

type OutletContext = { wedding: Wedding | null };

export default function GalleryPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<WeddingContent>(wedding?.draft_content || wedding?.content || DEFAULT_CONTENT);
  const [theme, setTheme] = useState<ThemeConfig>(wedding?.draft_theme || wedding?.theme || DEFAULT_THEME);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState("0");

  const gallery = content.gallery || [];
  const galleryTitles = content.gallery_titles || [];

  useEffect(() => {
    if (wedding) {
      setContent(wedding.draft_content || wedding.content || DEFAULT_CONTENT);
      setTheme(wedding.draft_theme || wedding.theme || DEFAULT_THEME);
    }
  }, [wedding?.id]);

  const debouncedPreviewUpdate = useMemo(() => debounce(() => setPreviewKey((k) => String(Number(k) + 1)), 150), []);
  const updateContent = useCallback((patch: Partial<WeddingContent>) => {
    setContent((prev) => ({ ...prev, ...patch }));
    debouncedPreviewUpdate();
  }, [debouncedPreviewUpdate]);

  const addImage = useCallback(() => {
    updateContent({
      gallery: [...gallery, ""],
      gallery_titles: [...galleryTitles, ""],
    });
  }, [gallery, galleryTitles, updateContent]);

  const updateImage = useCallback((index: number, url: string) => {
    const newGallery = [...gallery];
    newGallery[index] = url;
    updateContent({ gallery: newGallery });
  }, [gallery, updateContent]);

  const updateTitle = useCallback((index: number, title: string) => {
    const newTitles = [...galleryTitles];
    newTitles[index] = title;
    updateContent({ gallery_titles: newTitles });
  }, [galleryTitles, updateContent]);

  const removeImage = useCallback((index: number) => {
    updateContent({
      gallery: gallery.filter((_, i) => i !== index),
      gallery_titles: galleryTitles.filter((_, i) => i !== index),
    });
  }, [gallery, galleryTitles, updateContent]);

  const moveImage = useCallback((index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= gallery.length) return;
    const newGallery = [...gallery];
    const newTitles = [...galleryTitles];
    [newGallery[index], newGallery[newIndex]] = [newGallery[newIndex], newGallery[index]];
    [newTitles[index], newTitles[newIndex]] = [newTitles[newIndex], newTitles[index]];
    updateContent({ gallery: newGallery, gallery_titles: newTitles });
  }, [gallery, galleryTitles, updateContent]);

  const handleSave = useCallback(async () => {
    if (!wedding) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("weddings").update({ draft_content: content }).eq("id", wedding.id);
      if (error) throw error;
      queryClient.setQueryData(["wedding"], (old: Wedding | null) => old ? { ...old, draft_content: content } : old);
      setToast("Gallery saved!");
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast("Failed: " + err.message);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [wedding, content, queryClient]);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gallery</h1>
          <p className="text-sm text-gray-500">Manage your photo gallery</p>
        </div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>

      <SplitEditor
        title="Gallery"
        previewKey={previewKey}
        preview={<HomePreview wedding={wedding} theme={theme} content={content} />}
        children={
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Gallery Images ({gallery.length})</h3>
              <Button variant="outline" size="sm" onClick={addImage}><Plus className="w-3.5 h-3.5" /> Add Image</Button>
            </div>

            {gallery.length === 0 ? (
              <EmptyState icon={<ImageIcon className="w-10 h-10" />} title="No images yet" description="Add images to your gallery" action={<Button size="sm" onClick={addImage}><Plus className="w-4 h-4" /> Add Image</Button>} />
            ) : (
              <div className="space-y-3">
                {gallery.map((img, index) => (
                  <Card key={index} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Image {index + 1}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => moveImage(index, -1)} disabled={index === 0}><MoveUp className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => moveImage(index, 1)} disabled={index === gallery.length - 1}><MoveDown className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => removeImage(index)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                      </div>
                    </div>
                    <ImageUpload value={img} onChange={(v) => updateImage(index, v)} label="Image URL" />
                    <FormField label="Title (optional)"><Input value={galleryTitles[index] || ""} onChange={(e) => updateTitle(index, e.target.value)} placeholder="Image title" /></FormField>
                  </Card>
                ))}
              </div>
            )}
          </div>
        }
      />

      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
