import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label } from "../../components/ui/Input";
import { Card, Toast } from "../../components/ui/index";
import { ImageUpload, VideoUpload, FormField } from "../../components/ui/ImageUpload";
import { DEFAULT_THEME, themeToCssVars, getCoverContent } from "../../lib/theme";
import { Save, Eye } from "lucide-react";

export function CoverEditorPage() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState<WeddingContent>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [previewWedding, setPreviewWedding] = useState<Wedding | null>(null);

  const { data: wedding, isLoading, error } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  useEffect(() => {
    if (wedding) {
      const draft = (wedding.draft_content || {}) as WeddingContent;
      const pub = (wedding.content || {}) as WeddingContent;
      setContent({ ...pub, ...draft });
    }
  }, [wedding]);

  useEffect(() => {
    if (wedding) {
      setPreviewWedding({
        ...wedding,
        draft_content: content,
        theme_config: wedding.draft_theme_config || wedding.theme_config,
      } as Wedding);
    }
  }, [wedding, content]);

  const saveMutation = useMutation({
    mutationFn: async (data: WeddingContent) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("weddings")
        .update({ draft_content: data, updated_at: new Date().toISOString() })
        .eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Cover saved to draft", type: "success" });
    },
    onError: (err) => setToast({ message: err.message || "Failed to save", type: "error" }),
  });

  const handleSave = () => saveMutation.mutate(content);

  const update = (key: keyof WeddingContent, value: unknown) => setContent((prev) => ({ ...prev, [key]: value }));

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="font-ui text-sm text-gray-400">Loading cover editor...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl text-[var(--color-text)]">Cover Page Editor</h1>
            <p className="font-ui text-xs text-[var(--color-text-muted)]">Customize the first thing guests see</p>
          </div>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save size={14} className="mr-1.5" />
            {saveMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SplitEditor
            title="Cover Page"
            preview={previewWedding ? <CoverPreview wedding={previewWedding} /> : <div />}
          >
            <div className="space-y-6">
              <FormField label="Welcome Text" hint="Small text above the couple names">
                <Input
                  value={content.cover_welcome || ""}
                  onChange={(e) => update("cover_welcome", e.target.value)}
                  placeholder="Welcome to our wedding"
                />
              </FormField>

              <FormField label="Cover Heading" hint="Optional override for couple names display">
                <Input
                  value={content.cover_heading || ""}
                  onChange={(e) => update("cover_heading", e.target.value)}
                  placeholder="Auto uses couple names"
                />
              </FormField>

              <FormField label="Subtitle" hint="Date or additional text below names">
                <Input
                  value={content.cover_subtitle || ""}
                  onChange={(e) => update("cover_subtitle", e.target.value)}
                  placeholder="Auto uses wedding date"
                />
              </FormField>

              <FormField label="Button Text" hint="Call-to-action button label">
                <Input
                  value={content.cover_button_text || ""}
                  onChange={(e) => update("cover_button_text", e.target.value)}
                  placeholder="Enter Website"
                />
              </FormField>

              <div className="border-t border-gray-100 pt-6">
                <Label>Background Type</Label>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => update("cover_background_type", "image")}
                    className={`flex-1 px-4 py-2.5 border rounded-lg font-ui text-xs uppercase tracking-wider-luxe transition-all ${
                      (content.cover_background_type || "image") === "image"
                        ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    Image
                  </button>
                  <button
                    onClick={() => update("cover_background_type", "video")}
                    className={`flex-1 px-4 py-2.5 border rounded-lg font-ui text-xs uppercase tracking-wider-luxe transition-all ${
                      content.cover_background_type === "video"
                        ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    Video
                  </button>
                </div>

                {content.cover_background_type === "video" ? (
                  <VideoUpload
                    value={content.cover_background_url || null}
                    onChange={(v) => update("cover_background_url", v)}
                    label="Background Video URL"
                  />
                ) : (
                  <ImageUpload
                    value={content.cover_background_url || null}
                    onChange={(v) => update("cover_background_url", v)}
                    label="Background Image"
                  />
                )}
              </div>

              <div className="border-t border-gray-100 pt-6">
                <ImageUpload
                  value={content.cover_logo_url || null}
                  onChange={(v) => update("cover_logo_url", v)}
                  label="Logo / Monogram"
                />
              </div>

              <Card className="p-4 bg-[var(--color-bg-light)] border-[var(--color-primary)]/20">
                <div className="flex items-start gap-3">
                  <Eye size={16} className="text-[var(--color-primary)] mt-0.5" />
                  <div>
                    <p className="font-ui text-xs text-[var(--color-text)] font-medium mb-1">Live Preview</p>
                    <p className="font-ui text-xs text-[var(--color-text-muted)]">
                      Changes appear instantly in the preview panel. Save to persist to draft.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </SplitEditor>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
