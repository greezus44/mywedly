import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Select } from "../../components/ui/Input";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Toast, EmptyState } from "../../components/ui/index";
import { getCoverContent } from "../../lib/theme";
import { Save, Send, RefreshCw } from "lucide-react";

export function CoverEditorPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [content, setContent] = useState<WeddingContent>({});

  const weddingQuery = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const wedding = weddingQuery.data;

  useEffect(() => {
    if (wedding) {
      const draft = (wedding.draft_content || {}) as WeddingContent;
      const pub = (wedding.content || {}) as WeddingContent;
      const merged: WeddingContent = {
        cover_welcome: draft.cover_welcome ?? pub.cover_welcome ?? "",
        cover_heading: draft.cover_heading ?? pub.cover_heading ?? "",
        cover_subtitle: draft.cover_subtitle ?? pub.cover_subtitle ?? "",
        cover_button_text: draft.cover_button_text ?? pub.cover_button_text ?? "",
        cover_background_url: draft.cover_background_url ?? pub.cover_background_url ?? "",
        cover_background_type: draft.cover_background_type ?? pub.cover_background_type ?? "image",
        cover_logo_url: draft.cover_logo_url ?? pub.cover_logo_url ?? "",
      };
      setContent(merged);
    }
  }, [wedding]);

  const saveDraftMutation = useMutation({
    mutationFn: async (values: WeddingContent) => {
      if (!wedding) throw new Error("No wedding");
      const { data, error } = await supabase
        .from("weddings")
        .update({ draft_content: values, updated_at: new Date().toISOString() })
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
      setToast({ message: "Draft saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save draft", type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const draftContent = (wedding.draft_content || {}) as WeddingContent;
      const mergedContent = { ...draftContent, ...content };
      const { data, error } = await supabase
        .from("weddings")
        .update({ draft_content: mergedContent, content: mergedContent, updated_at: new Date().toISOString() })
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
      setToast({ message: "Cover published", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish", type: "error" }),
  });

  const handleSaveDraft = () => saveDraftMutation.mutate(content);
  const handlePublish = () => {
    saveDraftMutation.mutate(content, {
      onSuccess: () => publishMutation.mutate(),
    });
  };

  const update = (key: keyof WeddingContent, value: string | boolean) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  if (weddingQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-20">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary)]" />
        </div>
      </AdminLayout>
    );
  }

  if (weddingQuery.isError || !wedding) {
    return (
      <AdminLayout>
        <div className="p-8">
          <EmptyState title="Unable to load editor" description="Please try again later." />
        </div>
      </AdminLayout>
    );
  }

  const previewWedding: Wedding = {
    ...wedding,
    draft_content: { ...(wedding.draft_content || {}), ...content },
  };

  return (
    <AdminLayout>
      <SplitEditor title="Cover Page Editor" preview={<CoverPreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-xl text-[var(--color-text)] mb-1">Cover Page</h2>
            <p className="font-ui text-xs text-[var(--color-text-muted)]">Design the first thing guests see</p>
          </div>

          <FormField label="Welcome Text">
            <Input
              value={content.cover_welcome || ""}
              onChange={(e) => update("cover_welcome", e.target.value)}
              placeholder="Welcome to our wedding"
            />
          </FormField>

          <FormField label="Heading">
            <Input
              value={content.cover_heading || ""}
              onChange={(e) => update("cover_heading", e.target.value)}
              placeholder="The Wedding Of"
            />
          </FormField>

          <FormField label="Subtitle">
            <Textarea
              value={content.cover_subtitle || ""}
              onChange={(e) => update("cover_subtitle", e.target.value)}
              placeholder="We invite you to celebrate with us"
              className="min-h-[80px]"
            />
          </FormField>

          <FormField label="Button Text">
            <Input
              value={content.cover_button_text || ""}
              onChange={(e) => update("cover_button_text", e.target.value)}
              placeholder="Enter Website"
            />
          </FormField>

          <div>
            <Label>Background Type</Label>
            <Select
              value={content.cover_background_type || "image"}
              onChange={(e) => update("cover_background_type", e.target.value as "image" | "video")}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </Select>
          </div>

          <ImageUpload
            label="Background Image"
            value={content.cover_background_url || null}
            onChange={(url) => update("cover_background_url", url || "")}
          />

          <ImageUpload
            label="Logo / Monogram"
            value={content.cover_logo_url || null}
            onChange={(url) => update("cover_logo_url", url || "")}
          />

          <div className="pt-4 space-y-3 border-t border-[var(--color-border)]/15">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSaveDraft}
              disabled={saveDraftMutation.isPending}
            >
              <Save size={14} className="mr-2" />
              {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              variant="primary"
              className="w-full"
              onClick={handlePublish}
              disabled={publishMutation.isPending || saveDraftMutation.isPending}
            >
              <Send size={14} className="mr-2" />
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
