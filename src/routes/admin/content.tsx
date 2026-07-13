import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Toggle } from "../../components/ui/Input";
import { Card } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Save } from "lucide-react";

export function ContentPage() {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [content, setContent] = useState<WeddingContent>({});
  const [showCountdown, setShowCountdown] = useState(true);
  const qc = useQueryClient();

  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      if (data) {
        const c = (data as Wedding).draft_content || (data as Wedding).content || {};
        setContent(c);
      }
      return data as Wedding | null;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_content: content }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wedding"] }),
  });

  const update = (patch: Partial<WeddingContent>) => setContent({ ...content, ...patch });
  const previewWedding = wedding ? { ...wedding, draft_content: content } : null;

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Home Content</h2>
        <Button onClick={() => save.mutate()} disabled={save.isPending}><Save className="mr-2 h-4 w-4" /> {save.isPending ? "Saving..." : "Save Draft"}</Button>
      </div>

      <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <HomePreview wedding={previewWedding} device={d} />}>
        <Card className="space-y-4">
          <FormField label="Home Title"><Input value={content.home_title || ""} onChange={(e) => update({ home_title: e.target.value })} placeholder="Couple names" /></FormField>
          <FormField label="Home Subtitle"><Input value={content.home_subtitle || ""} onChange={(e) => update({ home_subtitle: e.target.value })} placeholder="Subtitle" /></FormField>
          <FormField label="Invitation Intro"><Textarea value={content.home_body || ""} onChange={(e) => update({ home_body: e.target.value })} placeholder="Invitation body text" /></FormField>
          <FormField label="Home Image"><ImageUpload value={content.home_image_url ?? null} onChange={(url) => update({ home_image_url: url ?? undefined })} label="Home Image" /></FormField>
          <FormField label="Closing Text"><Input value={content.home_closing_text || ""} onChange={(e) => update({ home_closing_text: e.target.value })} placeholder="Closing text" /></FormField>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Quran Verse</h3>
            <FormField label="Verse"><Textarea value={content.quran_verse || ""} onChange={(e) => update({ quran_verse: e.target.value })} placeholder="Quran verse" /></FormField>
            <FormField label="Translation"><Textarea value={content.quran_translation || ""} onChange={(e) => update({ quran_translation: e.target.value })} placeholder="Translation" /></FormField>
            <FormField label="Reference"><Input value={content.quran_reference || ""} onChange={(e) => update({ quran_reference: e.target.value })} placeholder="e.g. Surah Ar-Rum: 21" /></FormField>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <Toggle checked={showCountdown} onChange={setShowCountdown} label="Show countdown" />
          </div>
        </Card>
      </SplitEditor>
    </AdminLayout>
  );
}
