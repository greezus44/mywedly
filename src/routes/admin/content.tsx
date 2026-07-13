import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle } from "../../components/ui/Input";
import { Card, Toast } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Save, Eye } from "lucide-react";

export function ContentPage() {
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
      setToast({ message: "Home content saved to draft", type: "success" });
    },
    onError: (err) => setToast({ message: err.message || "Failed to save", type: "error" }),
  });

  const handleSave = () => saveMutation.mutate(content);
  const update = (key: keyof WeddingContent, value: unknown) => setContent((prev) => ({ ...prev, [key]: value }));

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="font-ui text-sm text-gray-400">Loading content editor...</div>
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
            <h1 className="font-heading text-xl text-[var(--color-text)]">Home Content</h1>
            <p className="font-ui text-xs text-[var(--color-text-muted)]">Edit the main invitation page content</p>
          </div>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save size={14} className="mr-1.5" />
            {saveMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SplitEditor
            title="Home Content"
            preview={previewWedding ? <HomePreview wedding={previewWedding} /> : <div />}
          >
            <div className="space-y-6">
              <FormField label="Invitation Intro" hint="Small text above couple names">
                <Input
                  value={content.invitation_intro || ""}
                  onChange={(e) => update("invitation_intro", e.target.value)}
                  placeholder="Together with their families"
                />
              </FormField>

              <FormField label="Home Body Text" hint="Main invitation message">
                <Textarea
                  value={content.home_body || ""}
                  onChange={(e) => update("home_body", e.target.value)}
                  placeholder="We invite you to celebrate our special day..."
                  rows={5}
                />
              </FormField>

              <FormField label="Home Closing Text" hint="Text after the invitation body">
                <Textarea
                  value={content.home_closing_text || ""}
                  onChange={(e) => update("home_closing_text", e.target.value)}
                  placeholder="We can't wait to share this moment with you"
                  rows={2}
                />
              </FormField>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-heading text-base text-[var(--color-text)] mb-4">Quran Verse / Opening</h3>
                <div className="space-y-4">
                  <FormField label="Verse (Original)">
                    <Textarea
                      value={content.invitation_quran_verse || ""}
                      onChange={(e) => update("invitation_quran_verse", e.target.value)}
                      placeholder="Arabic or original verse text"
                      rows={3}
                    />
                  </FormField>

                  <FormField label="Translation">
                    <Textarea
                      value={content.invitation_quran_translation || ""}
                      onChange={(e) => update("invitation_quran_translation", e.target.value)}
                      placeholder="English translation"
                      rows={2}
                    />
                  </FormField>

                  <FormField label="Reference">
                    <Input
                      value={content.invitation_quran_reference || ""}
                      onChange={(e) => update("invitation_quran_reference", e.target.value)}
                      placeholder="e.g. Surah Ar-Rum: 21"
                    />
                  </FormField>

                  <FormField label="Closing Prayer">
                    <Textarea
                      value={content.invitation_closing || ""}
                      onChange={(e) => update("invitation_closing", e.target.value)}
                      placeholder="Closing prayer or message"
                      rows={2}
                    />
                  </FormField>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-heading text-base text-[var(--color-text)] mb-4">Countdown</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[var(--color-bg-light)] rounded-lg">
                    <div>
                      <p className="font-ui text-sm text-[var(--color-text)] font-medium">Enable Countdown</p>
                      <p className="font-ui text-xs text-[var(--color-text-muted)]">Show days remaining until wedding</p>
                    </div>
                    <Toggle
                      checked={content.countdown_enabled !== false}
                      onChange={(v) => update("countdown_enabled", v)}
                    />
                  </div>
                  <FormField label="Countdown Label">
                    <Input
                      value={content.countdown_label || ""}
                      onChange={(e) => update("countdown_label", e.target.value)}
                      placeholder="Counting down to our big day"
                    />
                  </FormField>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-heading text-base text-[var(--color-text)] mb-4">Home Image</h3>
                <ImageUpload
                  value={content.home_image_url || null}
                  onChange={(v) => update("home_image_url", v)}
                  label="Featured Image"
                />
              </div>

              <Card className="p-4 bg-[var(--color-bg-light)] border-[var(--color-primary)]/20">
                <div className="flex items-start gap-3">
                  <Eye size={16} className="text-[var(--color-primary)] mt-0.5" />
                  <div>
                    <p className="font-ui text-xs text-[var(--color-text)] font-medium mb-1">Live Preview</p>
                    <p className="font-ui text-xs text-[var(--color-text-muted)]">
                      All changes appear instantly. Save to persist to draft.
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
