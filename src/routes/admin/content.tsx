import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Globe } from "lucide-react";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle } from "../../components/ui/Input";
import { Toast } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";

export function ContentPage() {
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
      setToast({ message: "Content published", type: "success" });
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
      <SplitEditor title="Home Content Editor" preview={<HomePreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Home Content</h2>
            <p className="font-ui text-xs text-[var(--color-text-muted)] mb-6">The main invitation page guests see after the cover</p>
          </div>

          <FormField label="Home Title" hint="Displayed as the main heading">
            <Input value={content.home_title || ""} onChange={(e) => update("home_title", e.target.value)} placeholder="Our Wedding" />
          </FormField>

          <FormField label="Home Subtitle">
            <Input value={content.home_subtitle || ""} onChange={(e) => update("home_subtitle", e.target.value)} placeholder="A short subtitle" />
          </FormField>

          <FormField label="Home Body" hint="Main body text shown on the home page">
            <Textarea value={content.home_body || ""} onChange={(e) => update("home_body", e.target.value)} placeholder="Write your welcome message..." />
          </FormField>

          <FormField label="Home Image">
            <ImageUpload value={content.home_image_url || null} onChange={(url) => update("home_image_url", url)} label="Upload home image" />
          </FormField>

          <div className="pt-4 border-t border-[var(--color-border)]/15">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-4">Invitation Section</h3>

            <FormField label="Invitation Intro" hint="Opening text for the invitation">
              <Input value={content.invitation_intro || ""} onChange={(e) => update("invitation_intro", e.target.value)} placeholder="With the blessing of Allah..." />
            </FormField>

            <FormField label="Quran Verse" hint="Arabic verse text">
              <Textarea value={content.invitation_quran_verse || ""} onChange={(e) => update("invitation_quran_verse", e.target.value)} placeholder="Arabic verse" />
            </FormField>

            <FormField label="Quran Translation">
              <Textarea value={content.invitation_quran_translation || ""} onChange={(e) => update("invitation_quran_translation", e.target.value)} placeholder="English translation" />
            </FormField>

            <FormField label="Quran Reference" hint="e.g. Surah Ar-Rum: 21">
              <Input value={content.invitation_quran_reference || ""} onChange={(e) => update("invitation_quran_reference", e.target.value)} placeholder="Surah Ar-Rum: 21" />
            </FormField>

            <FormField label="Invitation Closing">
              <Textarea value={content.invitation_closing || ""} onChange={(e) => update("invitation_closing", e.target.value)} placeholder="Closing message" />
            </FormField>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)]/15">
            <div className="flex items-center justify-between">
              <div>
                <Label>Countdown Enabled</Label>
                <p className="font-ui text-xs text-[var(--color-text-muted)]">Show a countdown timer to the wedding date</p>
              </div>
              <Toggle checked={content.countdown_enabled ?? true} onChange={(v) => update("countdown_enabled", v)} />
            </div>
          </div>

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
              {publishMutation.isPending ? "Publishing..." : "Publish Content"}
            </Button>
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
