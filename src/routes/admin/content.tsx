import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle } from "../../components/ui/Input";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Toast } from "../../components/ui/index";
import { Save, Upload } from "lucide-react";

export function ContentPage() {
  const queryClient = useQueryClient();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [content, setContent] = useState<WeddingContent>({});
  const [showCountdown, setShowCountdown] = useState(true);
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
      const c = wed.draft_content || wed.content || {};
      setContent(c);
      setShowCountdown(!!c.home_closing_text || true);
    }
  }, [wed]);

  const saveDraftMutation = useMutation({
    mutationFn: async (newContent: WeddingContent) => {
      const { error } = await supabase.from("weddings").update({ draft_content: newContent }).eq("id", wedding!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] });
      setToast({ message: "Draft content saved", type: "success" });
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
      setToast({ message: "Content published!", type: "success" });
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
            <h2 className="text-xl font-semibold text-gray-900">Content Editor</h2>
            <p className="text-sm text-gray-500">Edit your home page invitation content.</p>
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

        <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <HomePreview wedding={previewWedding} device={d} />}>
          <div className="space-y-4">
            <FormField label="Home Title">
              <Input value={content.home_title || ""} onChange={(e) => update({ home_title: e.target.value })} placeholder="Our Wedding" />
            </FormField>
            <FormField label="Home Subtitle">
              <Input value={content.home_subtitle || ""} onChange={(e) => update({ home_subtitle: e.target.value })} placeholder="We invite you to celebrate with us" />
            </FormField>
            <FormField label="Invitation Body" hint="Main invitation message">
              <Textarea value={content.home_body || ""} onChange={(e) => update({ home_body: e.target.value })} placeholder="Write your invitation message…" />
            </FormField>
            <FormField label="Home Image">
              <ImageUpload value={content.home_image_url ?? null} onChange={(url) => update({ home_image_url: url ?? undefined })} />
            </FormField>
            <FormField label="Quran Verse">
              <Textarea value={content.quran_verse || ""} onChange={(e) => update({ quran_verse: e.target.value })} placeholder="Enter Quran verse…" />
            </FormField>
            <FormField label="Quran Translation">
              <Textarea value={content.quran_translation || ""} onChange={(e) => update({ quran_translation: e.target.value })} placeholder="Translation…" />
            </FormField>
            <FormField label="Quran Reference">
              <Input value={content.quran_reference || ""} onChange={(e) => update({ quran_reference: e.target.value })} placeholder="e.g. Surah Ar-Rum: 21" />
            </FormField>
            <FormField label="Closing Text">
              <Textarea value={content.home_closing_text || ""} onChange={(e) => update({ home_closing_text: e.target.value })} placeholder="Closing message…" />
            </FormField>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <Label>Show Countdown</Label>
                <Toggle checked={showCountdown} onChange={setShowCountdown} />
              </div>
              <p className="mt-1 text-xs text-gray-500">Display a countdown timer to the wedding date.</p>
            </div>
          </div>
        </SplitEditor>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </AdminLayout>
  );
}
