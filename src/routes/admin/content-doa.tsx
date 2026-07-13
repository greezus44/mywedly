import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { DoaPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label } from "../../components/ui/Input";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Save, Upload } from "lucide-react";

export function ContentDoaPage() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState<WeddingContent>({});
  const [toast, setToast] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: wedding } = useQuery({
    queryKey: ["wedding", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.id).maybeSingle();
      return data as Wedding | null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (wedding) {
      setContent(wedding.draft_content || wedding.content || {});
    }
  }, [wedding]);

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("weddings").update({ draft_content: content }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] });
      setToast("Draft saved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("weddings").update({ draft_content: content, content }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] });
      setToast("Doa content published!");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const update = <K extends keyof WeddingContent>(key: K, value: WeddingContent[K]) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading doa editor...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doa Content</h1>
            <p className="mt-1 text-sm text-gray-500">Customize the prayer (doa) section of your invitation.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => saveDraftMutation.mutate()} disabled={saveDraftMutation.isPending}>
              <Save className="mr-1.5 h-4 w-4" /> Save Draft
            </Button>
            <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              <Upload className="mr-1.5 h-4 w-4" /> Publish
            </Button>
          </div>
        </div>

        <SplitEditor
          preview={(device: DeviceType) => <DoaPreview wedding={{ ...wedding, draft_content: content } as Wedding} device={device} />}
        >
          <div className="space-y-6">
            <div>
              <Label className="mb-3">Doa Section</Label>
              <div className="space-y-3">
                <Input
                  label="Doa Title"
                  value={content.doa_title || ""}
                  onChange={(e) => update("doa_title", e.target.value)}
                  placeholder="Doa Restu"
                />
                <Textarea
                  label="Doa Body"
                  value={content.doa_body || ""}
                  onChange={(e) => update("doa_body", e.target.value)}
                  placeholder="Kami memohon restu dan doa daripada anda..."
                  rows={6}
                />
                <FormField label="Doa Image">
                  <ImageUpload
                    value={content.doa_image_url ?? null}
                    onChange={(url) => update("doa_image_url", url ?? undefined)}
                  />
                </FormField>
              </div>
            </div>
          </div>
        </SplitEditor>

        {toast && (
          <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
