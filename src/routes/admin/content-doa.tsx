import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { DoaPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Save } from "lucide-react";

export function ContentDoaPage() {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [content, setContent] = useState<WeddingContent>({});
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
        <h2 className="text-xl font-semibold text-gray-900">Doa Editor</h2>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="mr-2 h-4 w-4" /> {save.isPending ? "Saving..." : "Save Draft"}
        </Button>
      </div>

      <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <DoaPreview wedding={previewWedding} device={d} />}>
        <div className="space-y-4">
          <Card className="space-y-4">
            <h3 className="font-semibold text-gray-900">Doa Content</h3>
            <FormField label="Doa Title">
              <Input value={content.doa_title || ""} onChange={(e) => update({ doa_title: e.target.value })} placeholder="e.g. Doa & Prayers" />
            </FormField>
            <FormField label="Doa Body">
              <Textarea value={content.doa_body || ""} onChange={(e) => update({ doa_body: e.target.value })} placeholder="Prayer text or message" />
            </FormField>
            <FormField label="Doa Image">
              <ImageUpload
                value={content.doa_image_url ?? null}
                onChange={(url) => update({ doa_image_url: url ?? undefined })}
                label="Upload a doa image"
              />
            </FormField>
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
