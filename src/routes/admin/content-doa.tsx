import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { DoaPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Toast, EmptyState } from "../../components/ui/index";
import { Save, Send, RefreshCw } from "lucide-react";

export function ContentDoaPage() {
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
        doa_title: draft.doa_title ?? pub.doa_title ?? "",
        doa_body: draft.doa_body ?? pub.doa_body ?? "",
        doa_image_url: draft.doa_image_url ?? pub.doa_image_url ?? "",
      };
      setContent(merged);
    }
  }, [wedding]);

  const saveDraftMutation = useMutation({
    mutationFn: async (values: WeddingContent) => {
      if (!wedding) throw new Error("No wedding");
      const existingDraft = (wedding.draft_content || {}) as WeddingContent;
      const merged = { ...existingDraft, ...values };
      const { data, error } = await supabase
        .from("weddings")
        .update({ draft_content: merged, updated_at: new Date().toISOString() })
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
      const existingDraft = (wedding.draft_content || {}) as WeddingContent;
      const mergedDraft = { ...existingDraft, ...content };
      const existingPub = (wedding.content || {}) as WeddingContent;
      const mergedPub = { ...existingPub, ...content };
      const { data, error } = await supabase
        .from("weddings")
        .update({ draft_content: mergedDraft, content: mergedPub, updated_at: new Date().toISOString() })
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
      setToast({ message: "Doa content published", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish", type: "error" }),
  });

  const handleSaveDraft = () => saveDraftMutation.mutate(content);
  const handlePublish = () => {
    saveDraftMutation.mutate(content, {
      onSuccess: () => publishMutation.mutate(),
    });
  };

  const update = (key: keyof WeddingContent, value: string) => {
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
      <SplitEditor title="Doa Content Editor" preview={<DoaPreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-xl text-[var(--color-text)] mb-1">Doa / Prayer</h2>
            <p className="font-ui text-xs text-[var(--color-text-muted)]">A prayer or blessing for your guests</p>
          </div>

          <FormField label="Doa Title">
            <Input
              value={content.doa_title || ""}
              onChange={(e) => update("doa_title", e.target.value)}
              placeholder="Doa / Prayer"
            />
          </FormField>

          <FormField label="Doa Body" hint="Supports line breaks">
            <Textarea
              value={content.doa_body || ""}
              onChange={(e) => update("doa_body", e.target.value)}
              placeholder="Enter your prayer or blessing here..."
              className="min-h-[200px]"
            />
          </FormField>

          <ImageUpload
            label="Doa Image"
            value={content.doa_image_url || null}
            onChange={(url) => update("doa_image_url", url || "")}
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
