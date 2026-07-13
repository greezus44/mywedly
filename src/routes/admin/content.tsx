import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle } from "../../components/ui/Input";
import { Toast } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { getCoverContent } from "../../lib/theme";
import { Save, FileText } from "lucide-react";

export function ContentPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

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

  const existingContent = wedding ? getCoverContent(wedding) : ({} as WeddingContent);
  const [content, setContent] = useState<WeddingContent>(existingContent);

  useEffect(() => {
    if (wedding && JSON.stringify(existingContent) !== JSON.stringify(content)) {
      setContent(existingContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedding]);

  const saveDraft = useMutation({
    mutationFn: async (newContent: WeddingContent) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_content: newContent }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding"] }); setToast("Draft saved"); },
  });

  const publish = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ content: content, draft_content: content }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding"] }); setToast("Content published successfully"); },
  });

  const update = (patch: Partial<WeddingContent>) => {
    const newContent = { ...content, ...patch };
    setContent(newContent);
    saveDraft.mutate(newContent);
  };

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Loading...</div></div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="p-6 text-gray-500">Wedding not found</div></AdminLayout>;

  const previewWedding = { ...wedding, draft_content: content } as Wedding;

  return (
    <AdminLayout>
      <SplitEditor title="Home Content Editor" preview={<HomePreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" />
            <h2 className="font-ui text-base font-semibold text-gray-900">Home Content</h2>
          </div>

          <FormField label="Invitation Intro" hint="Short text above couple names">
            <Input value={content.invitation_intro || ""} onChange={(e) => update({ invitation_intro: e.target.value })} placeholder="e.g. Invitation" className="!bg-white !border-gray-200 !text-gray-700" />
          </FormField>

          <FormField label="Home Body" hint="Main invitation text">
            <Textarea value={content.home_body || ""} onChange={(e) => update({ home_body: e.target.value })} placeholder="Write your invitation message..." className="!bg-white !border-gray-200 !text-gray-700" />
          </FormField>

          <FormField label="Home Image">
            <ImageUpload value={content.home_image_url ?? null} onChange={(url) => update({ home_image_url: url ?? undefined })} label="Home image" />
          </FormField>

          <FormField label="Home Closing Text">
            <Textarea value={content.home_closing_text || ""} onChange={(e) => update({ home_closing_text: e.target.value })} placeholder="Closing message..." className="!bg-white !border-gray-200 !text-gray-700" />
          </FormField>

          <div className="pt-4 border-t border-gray-100">
            <Label>Quran Verse / Quote Section</Label>
          </div>

          <FormField label="Quran Verse">
            <Textarea value={content.invitation_quran_verse || ""} onChange={(e) => update({ invitation_quran_verse: e.target.value })} placeholder="Verse text..." className="!bg-white !border-gray-200 !text-gray-700" />
          </FormField>

          <FormField label="Quran Translation">
            <Textarea value={content.invitation_quran_translation || ""} onChange={(e) => update({ invitation_quran_translation: e.target.value })} placeholder="Translation..." className="!bg-white !border-gray-200 !text-gray-700" />
          </FormField>

          <FormField label="Quran Reference">
            <Input value={content.invitation_quran_reference || ""} onChange={(e) => update({ invitation_quran_reference: e.target.value })} placeholder="e.g. Surah Ar-Rum: 21" className="!bg-white !border-gray-200 !text-gray-700" />
          </FormField>

          <FormField label="Invitation Closing">
            <Textarea value={content.invitation_closing || ""} onChange={(e) => update({ invitation_closing: e.target.value })} placeholder="Closing text..." className="!bg-white !border-gray-200 !text-gray-700" />
          </FormField>

          <div className="pt-4 border-t border-gray-100">
            <Label>Countdown</Label>
          </div>

          <div className="flex items-center gap-3">
            <Toggle checked={content.countdown_enabled ?? true} onChange={(v) => update({ countdown_enabled: v })} />
            <span className="font-ui text-sm text-gray-700">Show countdown timer</span>
          </div>

          <FormField label="Countdown Label">
            <Input value={content.countdown_label || ""} onChange={(e) => update({ countdown_label: e.target.value })} placeholder="e.g. Counting down to our big day" className="!bg-white !border-gray-200 !text-gray-700" />
          </FormField>

          {/* Publish button */}
          <div className="pt-4 border-t border-gray-100">
            <Button variant="primary" size="md" className="w-full" onClick={() => publish.mutate()} disabled={publish.isPending}>
              <Save size={14} className="mr-2" /> Publish Content
            </Button>
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
