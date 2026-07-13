import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { ContactPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label } from "../../components/ui/Input";
import { Save, Upload } from "lucide-react";

export function ContentContactPage() {
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
      setToast("Contact content published!");
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
          <div className="text-gray-500">Loading contact editor...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Content</h1>
            <p className="mt-1 text-sm text-gray-500">Edit your contact information shown to guests.</p>
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
          preview={(device: DeviceType) => <ContactPreview wedding={{ ...wedding, draft_content: content } as Wedding} device={device} />}
        >
          <div className="space-y-6">
            <div>
              <Label className="mb-3">Contact Information</Label>
              <div className="space-y-3">
                <Input
                  label="Phone Number"
                  value={content.contact_phone || ""}
                  onChange={(e) => update("contact_phone", e.target.value)}
                  placeholder="+60 12 345 6789"
                />
                <Input
                  label="Email Address"
                  value={content.contact_email || ""}
                  onChange={(e) => update("contact_email", e.target.value)}
                  placeholder="hello@example.com"
                />
                <Textarea
                  label="Address"
                  value={content.contact_address || ""}
                  onChange={(e) => update("contact_address", e.target.value)}
                  placeholder="123 Wedding Venue, Kuala Lumpur, Malaysia"
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
