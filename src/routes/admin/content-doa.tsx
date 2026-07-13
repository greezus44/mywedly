import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Globe } from "lucide-react";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { DoaPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Toast } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";

export function ContentDoaPage() {
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
      setToast({ message: "Doa content published", type: "success" });
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
      <SplitEditor title="Doa Content Editor" preview={<DoaPreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Doa / Prayer</h2>
            <p className="font-ui text-xs text-[var(--color-text-muted)] mb-6">A prayer or blessing section for your guests</p>
          </div>

          <FormField label="Doa Title" hint="Section heading">
            <Input value={content.doa_title || ""} onChange={(e) => update("doa_title", e.target.value)} placeholder="Doa Restu" />
          </FormField>

          <FormField label="Doa Body" hint="The prayer or blessing text">
            <Textarea value={content.doa_body || ""} onChange={(e) => update("doa_body", e.target.value)} placeholder="Write your prayer or blessing..." className="min-h-[200px]" />
          </FormField>

          <FormField label="Doa Image" hint="An optional image to accompany the prayer">
            <ImageUpload value={content.doa_image_url || null} onChange={(url) => update("doa_image_url", url)} label="Upload doa image" />
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
              {publishMutation.isPending ? "Publishing..." : "Publish Doa"}
            </Button>
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
