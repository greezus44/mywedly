import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { DoaPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Toast } from "../../components/ui/index";
import { Save, Upload } from "lucide-react";

export function ContentDoaPage() {
  const queryClient = useQueryClient();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [content, setContent] = useState<WeddingContent>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [device, setDevice] = useState<DeviceType>("desktop");

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });

  const { data: wed, isLoading, error } = useQuery({
    queryKey: ["wedding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user!.id).maybeSingle();
      if (error) throw error;
      return data as Wedding | null;
    },
  });

  useEffect(() => {
    if (wed) {
      setWedding(wed);
      setContent(wed.draft_content || wed.content || {});
    }
  }, [wed]);

  const saveDraftMutation = useMutation({
    mutationFn: async (newContent: WeddingContent) => {
      const { error } = await supabase.from("weddings").update({ draft_content: newContent }).eq("id", wedding!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] });
      setToast({ message: "Draft saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save draft", type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weddings").update({ draft_content: content, content: content, is_published: true }).eq("id", wedding!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] });
      setToast({ message: "Doa content published!", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish", type: "error" }),
  });

  if (isLoading) return <AdminLayout><div className="py-20 text-center text-gray-500">Loading…</div></AdminLayout>;
  if (error) return <AdminLayout><div className="py-20 text-center text-red-600">{error.message}</div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="py-20 text-center text-gray-500">No wedding found.</div></AdminLayout>;

  const update = (patch: Partial<WeddingContent>) => setContent((prev) => ({ ...prev, ...patch }));
  const previewWedding = { ...wedding, draft_content: content } as Wedding;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Doa Content</h2>
            <p className="text-sm text-gray-500">Edit the prayer (doa) section of your invitation.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => saveDraftMutation.mutate(content)} disabled={saveDraftMutation.isPending}>
              <Save className="mr-1.5 h-4 w-4" /> Save Draft
            </Button>
            <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              <Upload className="mr-1.5 h-4 w-4" /> Publish
            </Button>
          </div>
        </div>

        <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <DoaPreview wedding={previewWedding} device={d} />}>
          <div className="space-y-4">
            <FormField label="Doa Title">
              <Input value={content.doa_title || ""} onChange={(e) => update({ doa_title: e.target.value })} placeholder="Doa & Prayers" />
            </FormField>
            <FormField label="Doa Body" hint="Prayer text or blessing message">
              <Textarea value={content.doa_body || ""} onChange={(e) => update({ doa_body: e.target.value })} placeholder="Write your doa or prayer…" />
            </FormField>
            <FormField label="Doa Image">
              <ImageUpload value={content.doa_image_url ?? null} onChange={(url) => update({ doa_image_url: url ?? undefined })} />
            </FormField>
          </div>
        </SplitEditor>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </AdminLayout>
  );
}
