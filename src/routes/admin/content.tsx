import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle } from "../../components/ui/Input";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Save, Upload, FileText } from "lucide-react";

export function ContentPage() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState<WeddingContent>({});
  const [showCountdown, setShowCountdown] = useState(true);
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
      const c = wedding.draft_content || wedding.content || {};
      setContent(c);
      setShowCountdown(c.home_closing_text !== undefined ? true : true);
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
      setToast("Content published!");
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
          <div className="text-gray-500">Loading content editor...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content</h1>
            <p className="mt-1 text-sm text-gray-500">Edit your home page content, Quran verse, and countdown.</p>
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
          preview={(device: DeviceType) => <HomePreview wedding={{ ...wedding, draft_content: content } as Wedding} device={device} />}
        >
          <div className="space-y-6">
            {/* Home Content */}
            <div>
              <Label className="mb-3">Home Page Content</Label>
              <div className="space-y-3">
                <Input
                  label="Home Title"
                  value={content.home_title || ""}
                  onChange={(e) => update("home_title", e.target.value)}
                  placeholder="Mr & Mrs Smith"
                />
                <Input
                  label="Home Subtitle"
                  value={content.home_subtitle || ""}
                  onChange={(e) => update("home_subtitle", e.target.value)}
                  placeholder="We invite you to celebrate..."
                />
                <Textarea
                  label="Home Body"
                  value={content.home_body || ""}
                  onChange={(e) => update("home_body", e.target.value)}
                  placeholder="Together with their families..."
                  rows={5}
                />
                <FormField label="Home Image">
                  <ImageUpload
                    value={content.home_image_url ?? null}
                    onChange={(url) => update("home_image_url", url ?? undefined)}
                  />
                </FormField>
                <Input
                  label="Home Closing Text"
                  value={content.home_closing_text || ""}
                  onChange={(e) => update("home_closing_text", e.target.value)}
                  placeholder="We look forward to seeing you..."
                />
              </div>
            </div>

            {/* Quran Verse */}
            <div>
              <Label className="mb-3">Quran Verse</Label>
              <div className="space-y-3">
                <Textarea
                  label="Verse (Arabic)"
                  value={content.quran_verse || ""}
                  onChange={(e) => update("quran_verse", e.target.value)}
                  placeholder="وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا..."
                  rows={3}
                />
                <Textarea
                  label="Translation"
                  value={content.quran_translation || ""}
                  onChange={(e) => update("quran_translation", e.target.value)}
                  placeholder="And of His signs is that He created for you from yourselves mates..."
                  rows={3}
                />
                <Input
                  label="Reference"
                  value={content.quran_reference || ""}
                  onChange={(e) => update("quran_reference", e.target.value)}
                  placeholder="Surah Ar-Rum, 30:21"
                />
              </div>
            </div>

            {/* Countdown */}
            <div>
              <Label className="mb-3">Countdown</Label>
              <div className="rounded-lg border border-gray-200 p-4">
                <Toggle
                  checked={showCountdown}
                  onChange={setShowCountdown}
                  label="Show countdown on home page"
                />
                <p className="mt-2 text-xs text-gray-500">
                  The countdown automatically uses your wedding date from Settings.
                </p>
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
