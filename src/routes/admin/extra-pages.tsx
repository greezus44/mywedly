import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, FileText, Pencil, ExternalLink } from "lucide-react";
import { supabase, Wedding, WeddingContent, ThemeConfig, ExtraPage } from "../../lib/supabase";
import { DEFAULT_CONTENT, DEFAULT_THEME } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, FormField, Modal, EmptyState, Toast, ErrorState } from "../../components/ui/index";
import { debounce, generateToken } from "../../lib/utils";

type OutletContext = { wedding: Wedding | null };

export default function ExtraPagesPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<WeddingContent>(wedding?.draft_content || wedding?.content || DEFAULT_CONTENT);
  const [theme, setTheme] = useState<ThemeConfig>(wedding?.draft_theme || wedding?.theme || DEFAULT_THEME);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState("0");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ExtraPage | null>(null);
  const [formData, setFormData] = useState<Omit<ExtraPage, "id">>({ title: "", content: "", slug: "" });

  const extraPages = content.extra_pages || [];

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

  const openAdd = useCallback(() => {
    setEditingPage(null);
    setFormData({ title: "", content: "", slug: "" });
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((page: ExtraPage) => {
    setEditingPage(page);
    setFormData({ title: page.title, content: page.content, slug: page.slug });
    setModalOpen(true);
  }, []);

  const handleSavePage = useCallback(() => {
    if (!formData.title.trim()) return;
    const slug = formData.slug.trim() || formData.title.trim().toLowerCase().replace(/\s+/g, "-");
    if (editingPage) {
      updateContent({
        extra_pages: extraPages.map((p) => p.id === editingPage.id ? { ...p, ...formData, slug } : p),
      });
      setToast("Page updated!");
    } else {
      const newPage: ExtraPage = { id: generateToken(), ...formData, slug };
      updateContent({ extra_pages: [...extraPages, newPage] });
      setToast("Page added!");
    }
    setModalOpen(false);
    setTimeout(() => setToast(null), 3000);
  }, [formData, editingPage, extraPages, updateContent]);

  const handleDelete = useCallback((id: string) => {
    updateContent({ extra_pages: extraPages.filter((p) => p.id !== id) });
    setToast("Page deleted");
    setTimeout(() => setToast(null), 3000);
  }, [extraPages, updateContent]);

  const handleSave = useCallback(async () => {
    if (!wedding) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("weddings").update({ draft_content: content }).eq("id", wedding.id);
      if (error) throw error;
      queryClient.setQueryData(["wedding"], (old: Wedding | null) => old ? { ...old, draft_content: content } : old);
      setToast("Extra pages saved!");
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
          <h1 className="text-xl font-bold text-gray-900">Extra Pages</h1>
          <p className="text-sm text-gray-500">Create additional pages for your website</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} loading={saving}>Save</Button>
          <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Page</Button>
        </div>
      </div>

      <SplitEditor
        title="Extra Pages"
        previewKey={previewKey}
        preview={<HomePreview wedding={wedding} theme={theme} content={content} />}
        children={
          <div className="space-y-3">
            {extraPages.length > 0 ? (
              extraPages.map((page) => (
                <Card key={page.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{page.title}</h3>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{page.content || "No content"}</p>
                      <div className="flex items-center gap-1 text-xs text-blue-500">
                        <ExternalLink className="w-3 h-3" />
                        /{page.slug}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(page)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(page.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState icon={<FileText className="w-10 h-10" />} title="No extra pages" description="Add custom pages like 'Our Story', 'Travel Guide', etc." action={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Page</Button>} />
            )}
          </div>
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingPage ? "Edit Page" : "Add Page"} size="lg">
        <div className="space-y-4">
          <FormField label="Page Title"><Input value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} placeholder="e.g. Travel Guide" /></FormField>
          <FormField label="Slug" hint="URL path (auto-generated from title if left blank)"><Input value={formData.slug} onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))} placeholder="travel-guide" /></FormField>
          <FormField label="Content"><Textarea value={formData.content} onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))} placeholder="Page content..." className="min-h-[200px]" /></FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePage}>{editingPage ? "Save Changes" : "Add Page"}</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
