import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { DoaPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label } from "../../components/ui/Input";
import { Card, Toast } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Save, Eye } from "lucide-react";

export function ContentDoaPage() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState<WeddingContent>({});
  const [previewWedding, setPreviewWedding] = useState<Wedding | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
      setToast({ message: "Doa content saved to draft", type: "success" });
    },
    onError: (err) => setToast({ message: err.message || "Failed to save", type: "error" }),
  });

  const handleSave = () => saveMutation.mutate(content);
  const update = (key: keyof WeddingContent, value: unknown) => setContent((prev) => ({ ...prev, [key]: value }));

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="font-ui text-sm text-gray-400">Loading doa editor...</div>
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
            <h1 className="font-heading text-xl text-[var(--color-text)]">Doa / Prayer</h1>
            <p className="font-ui text-xs text-[var(--color-text-muted)]">Edit the prayer or blessing section</p>
          </div>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save size={14} className="mr-1.5" />
            {saveMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SplitEditor
            title="Doa Content"
            preview={previewWedding ? <DoaPreview wedding={previewWedding} /> : <div />}
          >
            <div className="space-y-6">
              <FormField label="Section Title" hint="Heading for the prayer section">
                <Input
                  value={content.doa_title || ""}
                  onChange={(e) => update("doa_title", e.target.value)}
                  placeholder="Doa & Blessings"
                />
              </FormField>

              <FormField label="Prayer Body" hint="The main prayer or blessing text">
                <Textarea
                  value={content.doa_body || ""}
                  onChange={(e) => update("doa_body", e.target.value)}
                  placeholder="Enter the prayer or blessing text..."
                  rows={10}
                />
              </FormField>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-heading text-base text-[var(--color-text)] mb-4">Prayer Image</h3>
                <ImageUpload
                  value={content.doa_image_url || null}
                  onChange={(v) => update("doa_image_url", v)}
                  label="Doa Image"
                />
              </div>

              <Card className="p-4 bg-[var(--color-bg-light)] border-[var(--color-primary)]/20">
                <div className="flex items-start gap-3">
                  <Eye size={16} className="text-[var(--color-primary)] mt-0.5" />
                  <div>
                    <p className="font-ui text-xs text-[var(--color-text)] font-medium mb-1">Live Preview</p>
                    <p className="font-ui text-xs text-[var(--color-text-muted)]">
                      The doa section displays a title, optional image, and prayer text on the guest site.
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
