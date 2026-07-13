import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { SendMessagePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label } from "../../components/ui/Input";
import { Save, Upload } from "lucide-react";

export function ContentMessagePage() {
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
      setToast("Message content published!");
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
          <div className="text-gray-500">Loading message editor...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Send Message Content</h1>
            <p className="mt-1 text-sm text-gray-500">Customize the message section where guests can write to you.</p>
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
          preview={(device: DeviceType) => <SendMessagePreview wedding={{ ...wedding, draft_content: content } as Wedding} device={device} />}
        >
          <div className="space-y-6">
            <div>
              <Label className="mb-3">Message Section</Label>
              <div className="space-y-3">
                <Input
                  label="Message Intro"
                  value={content.message_intro || ""}
                  onChange={(e) => update("message_intro", e.target.value)}
                  placeholder="Leave a message for the happy couple..."
                />
                <Textarea
                  label="RSVP Intro"
                  value={content.rsvp_intro || ""}
                  onChange={(e) => update("rsvp_intro", e.target.value)}
                  placeholder="Please let us know if you can attend..."
                  rows={3}
                />
                <Textarea
                  label="RSVP Closing"
                  value={content.rsvp_closing || ""}
                  onChange={(e) => update("rsvp_closing", e.target.value)}
                  placeholder="Thank you for your response!"
                  rows={3}
                />
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
