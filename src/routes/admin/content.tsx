import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Upload } from "lucide-react";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Toggle } from "../../components/ui/Input";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Toast } from "../../components/ui/index";
import { getCoverContent } from "../../lib/theme";

export function ContentPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [content, setContent] = useState<WeddingContent>({});
  const [initialized, setInitialized] = useState(false);

  const { data: wedding, isLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("created_by", user.user.id)
        .single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  useEffect(() => {
    if (wedding && !initialized) {
      setContent(getCoverContent(wedding));
      setInitialized(true);
    }
  }, [wedding, initialized]);

  const saveDraftMutation = useMutation({
    mutationFn: async (draft: WeddingContent) => {
      if (!wedding) throw new Error("No wedding");
      const { data, error } = await supabase
        .from("weddings")
        .update({ draft_content: draft, updated_at: new Date().toISOString() })
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const draft = (wedding.draft_content || {}) as WeddingContent;
      const published = (wedding.content || {}) as WeddingContent;
      const merged = { ...published, ...draft };
      const { data, error } = await supabase
        .from("weddings")
        .update({ content: merged, draft_content: merged, updated_at: new Date().toISOString() })
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
      setToast({ message: "Home page published!", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish", type: "error" }),
  });

  const updateField = useCallback(
    (field: keyof WeddingContent, value: string | boolean) => {
      setContent((prev) => {
        const next = { ...prev, [field]: value };
        saveDraftMutation.mutate(next);
        return next;
      });
    },
    [saveDraftMutation]
  );

  const previewWedding: Wedding | undefined = wedding
    ? { ...wedding, draft_content: content }
    : undefined;

  if (isLoading || !wedding || !previewWedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading editor...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <SplitEditor title="Home Page Content" preview={<HomePreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Home Page</h2>
            <p className="font-ui text-sm text-[var(--color-text-muted)]">
              The main invitation page guests land on.
            </p>
          </div>

          {/* Publish bar */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-light)] border border-[var(--color-border)]/15">
            <div className="flex items-center gap-2">
              {saveDraftMutation.isPending && (
                <span className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Save size={12} className="animate-pulse" /> Saving draft...
                </span>
              )}
              {saveDraftMutation.isSuccess && !saveDraftMutation.isPending && (
                <span className="font-ui text-xs text-[var(--color-success)]">Draft saved</span>
              )}
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              <Upload size={14} className="mr-1.5" />
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </div>

          {/* Home Section */}
          <div className="pt-4 border-t border-[var(--color-border)]/15">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-4">Home Content</h3>

            <FormField label="Home Title" hint="Overrides the couple names if set">
              <Input
                value={content.home_title || ""}
                onChange={(e) => updateField("home_title", e.target.value)}
                placeholder="Our Wedding"
              />
            </FormField>

            <FormField label="Subtitle">
              <Input
                value={content.home_subtitle || ""}
                onChange={(e) => updateField("home_subtitle", e.target.value)}
                placeholder="Together with their families"
              />
            </FormField>

            <FormField label="Body Text" hint="Main paragraph on the home page">
              <Textarea
                value={content.home_body || ""}
                onChange={(e) => updateField("home_body", e.target.value)}
                placeholder="We invite you to share in our joy as we celebrate our union..."
                className="min-h-[140px]"
              />
            </FormField>

            <FormField label="Home Image">
              <ImageUpload
                value={content.home_image_url || null}
                onChange={(v) => updateField("home_image_url", v || "")}
                label="Home Page Image"
              />
            </FormField>
          </div>

          {/* Invitation Section */}
          <div className="pt-4 border-t border-[var(--color-border)]/15">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-4">Invitation</h3>

            <FormField label="Invitation Intro" hint="Small heading above the invitation">
              <Input
                value={content.invitation_intro || ""}
                onChange={(e) => updateField("invitation_intro", e.target.value)}
                placeholder="With the blessing of our families"
              />
            </FormField>

            <FormField label="Quran Verse">
              <Textarea
                value={content.invitation_quran_verse || ""}
                onChange={(e) => updateField("invitation_quran_verse", e.target.value)}
                placeholder="And among His signs is that He created for you mates from yourselves..."
                className="min-h-[100px]"
              />
            </FormField>

            <FormField label="Verse Translation">
              <Textarea
                value={content.invitation_quran_translation || ""}
                onChange={(e) => updateField("invitation_quran_translation", e.target.value)}
                placeholder="Translation of the verse..."
                className="min-h-[80px]"
              />
            </FormField>

            <FormField label="Verse Reference">
              <Input
                value={content.invitation_quran_reference || ""}
                onChange={(e) => updateField("invitation_quran_reference", e.target.value)}
                placeholder="Surah Ar-Rum 30:21"
              />
            </FormField>

            <FormField label="Closing Text">
              <Textarea
                value={content.invitation_closing || ""}
                onChange={(e) => updateField("invitation_closing", e.target.value)}
                placeholder="We look forward to celebrating with you..."
                className="min-h-[80px]"
              />
            </FormField>
          </div>

          {/* Countdown Section */}
          <div className="pt-4 border-t border-[var(--color-border)]/15">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-4">Countdown</h3>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)]/15 mb-3">
              <div>
                <p className="font-ui text-sm text-[var(--color-text)]">Enable Countdown</p>
                <p className="font-ui text-xs text-[var(--color-text-muted)]">
                  Show a live countdown to the wedding date
                </p>
              </div>
              <Toggle
                checked={content.countdown_enabled ?? true}
                onChange={(v) => updateField("countdown_enabled", v)}
              />
            </div>

            <FormField label="Countdown Label">
              <Input
                value={content.countdown_label || ""}
                onChange={(e) => updateField("countdown_label", e.target.value)}
                placeholder="Counting down to our big day"
              />
            </FormField>
          </div>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
