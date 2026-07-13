import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { SendMessagePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { FormField } from "../../components/ui/ImageUpload";
import { Toast } from "../../components/ui/index";
import { Save, Upload } from "lucide-react";

export function ContentMessagePage() {
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
      setToast({ message: "Message content published!", type: "success" });
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
            <h2 className="text-xl font-semibold text-gray-900">Message Content</h2>
            <p className="text-sm text-gray-500">Edit the guest message section of your invitation.</p>
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

        <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <SendMessagePreview wedding={previewWedding} device={d} />}>
          <div className="space-y-4">
            <FormField label="Message Intro" hint="Introductory text shown above the message form">
              <Textarea value={content.message_intro || ""} onChange={(e) => update({ message_intro: e.target.value })} placeholder="Leave a message for the couple…" />
            </FormField>
            <FormField label="RSVP Intro" hint="Introductory text for the RSVP section">
              <Textarea value={content.rsvp_intro || ""} onChange={(e) => update({ rsvp_intro: e.target.value })} placeholder="Please let us know if you can attend…" />
            </FormField>
            <FormField label="RSVP Closing" hint="Closing text after the RSVP form">
              <Input value={content.rsvp_closing || ""} onChange={(e) => update({ rsvp_closing: e.target.value })} placeholder="Thank you for your response!" />
            </FormField>
          </div>
        </SplitEditor>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </AdminLayout>
  );
}
