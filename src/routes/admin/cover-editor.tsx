import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Upload, Globe } from "lucide-react";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Select } from "../../components/ui/Input";
import { Card, Toast } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { getCoverContent } from "../../lib/theme";

export function CoverEditorPage() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState<WeddingContent>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading } = useQuery({
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

  const saveDraftMutation = useMutation({
    mutationFn: async (newContent: WeddingContent) => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("weddings").update({ draft_content: newContent }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Draft saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save draft", type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const draftContent = { ...(wedding.content || {}), ...content } as WeddingContent;
      const { error } = await supabase.from("weddings").update({ content: draftContent, draft_content: draftContent }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Cover published successfully", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish", type: "error" }),
  });

  const update = (key: keyof WeddingContent, value: string | boolean | null) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Wedding not found</p>
        </div>
      </AdminLayout>
    );
  }

  const previewWedding = { ...wedding, draft_content: content } as Wedding;

  return (
    <AdminLayout>
      <SplitEditor title="Cover Page Editor" preview={<CoverPreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Cover Page</h2>
            <p className="font-ui text-xs text-[var(--color-text-muted)] mb-6">The first page guests see when they open your invitation</p>
          </div>

          <FormField label="Welcome Text" hint="Small text above the names">
            <Input value={content.cover_welcome || ""} onChange={(e) => update("cover_welcome", e.target.value)} placeholder="Welcome to our wedding" />
          </FormField>

          <FormField label="Heading" hint="Main heading (uses couple names by default)">
            <Input value={content.cover_heading || ""} onChange={(e) => update("cover_heading", e.target.value)} placeholder="Custom heading" />
          </FormField>

          <FormField label="Subtitle">
            <Textarea value={content.cover_subtitle || ""} onChange={(e) => update("cover_subtitle", e.target.value)} placeholder="A short subtitle or tagline" />
          </FormField>

          <FormField label="Button Text">
            <Input value={content.cover_button_text || ""} onChange={(e) => update("cover_button_text", e.target.value)} placeholder="Enter Website" />
          </FormField>

          <div>
            <Label>Background Type</Label>
            <Select value={content.cover_background_type || "image"} onChange={(e) => update("cover_background_type", e.target.value as "image" | "video")}>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </Select>
          </div>

          <FormField label="Background Image">
            <ImageUpload value={content.cover_background_url || null} onChange={(url) => update("cover_background_url", url)} label="Upload background image" />
          </FormField>

          <FormField label="Logo / Monogram" hint="A small logo or monogram displayed at the top">
            <ImageUpload value={content.cover_logo_url || null} onChange={(url) => update("cover_logo_url", url)} label="Upload logo" />
          </FormField>

          <div className="pt-4 border-t border-[var(--color-border)]/15 space-y-3">
            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => saveDraftMutation.mutate(content)}
              disabled={saveDraftMutation.isPending}
            >
              <Save size={14} className="mr-2" />
              {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              <Globe size={14} className="mr-2" />
              {publishMutation.isPending ? "Publishing..." : "Publish Cover"}
            </Button>
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
