import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Toggle, Label } from "../../components/ui/Input";
import { Card } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Save } from "lucide-react";

export function ContentPage() {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [content, setContent] = useState<WeddingContent>({});
  const [showCountdown, setShowCountdown] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wedding"] });
      setToast("Draft saved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const update = (patch: Partial<WeddingContent>) => setContent({ ...content, ...patch });

  const previewWedding: Wedding | null = wedding ? { ...wedding, draft_content: content } : null;

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Home Content</h2>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="mr-2 h-4 w-4" /> {save.isPending ? "Saving..." : "Save Draft"}
        </Button>
      </div>

      <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <HomePreview wedding={previewWedding} device={d} />}>
        <div className="space-y-4">
          <Card className="space-y-4">
            <h3 className="font-semibold text-gray-900">Invitation</h3>
            <FormField label="Home Title">
              <Input value={content.home_title || ""} onChange={(e) => update({ home_title: e.target.value })} placeholder="Couple names or custom title" />
            </FormField>
            <FormField label="Home Subtitle">
              <Input value={content.home_subtitle || ""} onChange={(e) => update({ home_subtitle: e.target.value })} placeholder="Subtitle text" />
            </FormField>
            <FormField label="Invitation Intro">
              <Textarea value={content.home_body || ""} onChange={(e) => update({ home_body: e.target.value })} placeholder="Introduction text for your invitation" />
            </FormField>
            <FormField label="Closing Text">
              <Input value={content.home_closing_text || ""} onChange={(e) => update({ home_closing_text: e.target.value })} placeholder="Closing message" />
            </FormField>
            <FormField label="Home Image">
              <ImageUpload
                value={content.home_image_url ?? null}
                onChange={(url) => update({ home_image_url: url ?? undefined })}
                label="Upload a home image"
              />
            </FormField>
          </Card>

          <Card className="space-y-4">
            <h3 className="font-semibold text-gray-900">Quran Verse</h3>
            <FormField label="Verse (Arabic)">
              <Textarea value={content.quran_verse || ""} onChange={(e) => update({ quran_verse: e.target.value })} placeholder="Quran verse" />
            </FormField>
            <FormField label="Translation">
              <Textarea value={content.quran_translation || ""} onChange={(e) => update({ quran_translation: e.target.value })} placeholder="English translation" />
            </FormField>
            <FormField label="Reference">
              <Input value={content.quran_reference || ""} onChange={(e) => update({ quran_reference: e.target.value })} placeholder="e.g. Surah Ar-Rum 30:21" />
            </FormField>
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold text-gray-900">Countdown</h3>
            <div className="flex items-center justify-between">
              <Label>Show countdown timer</Label>
              <Toggle checked={showCountdown} onChange={setShowCountdown} label={showCountdown ? "Enabled" : "Disabled"} />
            </div>
            <p className="mt-2 text-xs text-gray-500">The countdown uses your wedding date. Set it in Settings.</p>
          </Card>
        </div>
      </SplitEditor>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
