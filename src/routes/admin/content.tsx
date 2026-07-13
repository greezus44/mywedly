import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle } from "../../components/ui/Input";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Toast, EmptyState } from "../../components/ui/index";
import { Save, Send, RefreshCw } from "lucide-react";

export function ContentPage() {
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
        home_title: draft.home_title ?? pub.home_title ?? "",
        home_subtitle: draft.home_subtitle ?? pub.home_subtitle ?? "",
        home_body: draft.home_body ?? pub.home_body ?? "",
        home_image_url: draft.home_image_url ?? pub.home_image_url ?? "",
        invitation_intro: draft.invitation_intro ?? pub.invitation_intro ?? "",
        invitation_quran_verse: draft.invitation_quran_verse ?? pub.invitation_quran_verse ?? "",
        invitation_quran_translation: draft.invitation_quran_translation ?? pub.invitation_quran_translation ?? "",
        invitation_quran_reference: draft.invitation_quran_reference ?? pub.invitation_quran_reference ?? "",
        invitation_closing: draft.invitation_closing ?? pub.invitation_closing ?? "",
        countdown_enabled: draft.countdown_enabled ?? pub.countdown_enabled ?? true,
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
      setToast({ message: "Content published", type: "success" });
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
      <SplitEditor title="Home Content Editor" preview={<HomePreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-xl text-[var(--color-text)] mb-1">Home Content</h2>
            <p className="font-ui text-xs text-[var(--color-text-muted)]">Main page content and invitation</p>
          </div>

          <FormField label="Home Title">
            <Input
              value={content.home_title || ""}
              onChange={(e) => update("home_title", e.target.value)}
              placeholder="Our Wedding"
            />
          </FormField>

          <FormField label="Home Subtitle">
            <Input
              value={content.home_subtitle || ""}
              onChange={(e) => update("home_subtitle", e.target.value)}
              placeholder="We're getting married"
            />
          </FormField>

          <FormField label="Home Body" hint="Main text shown on the home page">
            <Textarea
              value={content.home_body || ""}
              onChange={(e) => update("home_body", e.target.value)}
              placeholder="Together with their families, we invite you to celebrate..."
              className="min-h-[120px]"
            />
          </FormField>

          <ImageUpload
            label="Home Image"
            value={content.home_image_url || null}
            onChange={(url) => update("home_image_url", url || "")}
          />

          <div className="pt-4 border-t border-[var(--color-border)]/15">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-4">Invitation</h3>
          </div>

          <FormField label="Invitation Intro">
            <Input
              value={content.invitation_intro || ""}
              onChange={(e) => update("invitation_intro", e.target.value)}
              placeholder="Bismillahirrahmanirrahim"
            />
          </FormField>

          <FormField label="Quran Verse">
            <Textarea
              value={content.invitation_quran_verse || ""}
              onChange={(e) => update("invitation_quran_verse", e.target.value)}
              placeholder="And among His signs is that He created for you mates from yourselves..."
              className="min-h-[80px]"
            />
          </FormField>

          <FormField label="Quran Translation">
            <Textarea
              value={content.invitation_quran_translation || ""}
              onChange={(e) => update("invitation_quran_translation", e.target.value)}
              placeholder="Translation of the verse..."
              className="min-h-[80px]"
            />
          </FormField>

          <FormField label="Quran Reference">
            <Input
              value={content.invitation_quran_reference || ""}
              onChange={(e) => update("invitation_quran_reference", e.target.value)}
              placeholder="Surah Ar-Rum: 21"
            />
          </FormField>

          <FormField label="Invitation Closing">
            <Textarea
              value={content.invitation_closing || ""}
              onChange={(e) => update("invitation_closing", e.target.value)}
              placeholder="We look forward to celebrating with you..."
              className="min-h-[80px]"
            />
          </FormField>

          <div className="flex items-center justify-between py-3 px-4 bg-[var(--color-bg)] rounded-lg">
            <div>
              <Label className="mb-0">Countdown Enabled</Label>
              <p className="font-ui text-xs text-[var(--color-text-muted)] mt-1">Show wedding countdown timer</p>
            </div>
            <Toggle
              checked={content.countdown_enabled ?? true}
              onChange={(v) => update("countdown_enabled", v)}
            />
          </div>

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
