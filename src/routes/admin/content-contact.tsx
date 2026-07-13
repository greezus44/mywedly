import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { ContactPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { Save, Send } from "lucide-react";

export function ContentContactPage() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState<WeddingContent>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading, error } = useQuery<Wedding>({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  useEffect(() => {
    if (wedding) {
      const pub = (wedding.content || {}) as WeddingContent;
      const draft = (wedding.draft_content || {}) as WeddingContent;
      setContent({ ...pub, ...draft });
    }
  }, [wedding]);

  const update = (key: keyof WeddingContent, value: unknown) => setContent((p) => ({ ...p, [key]: value }));

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_content: content }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Draft saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save draft", type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_content: content, content: content }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Contact content published!", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish", type: "error" }),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-gray-500">Loading contact editor...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data.</p>
        </div>
      </AdminLayout>
    );
  }

  const previewWedding = { ...wedding, draft_content: content } as Wedding;

  return (
    <AdminLayout>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <h1 className="font-ui text-base font-semibold text-gray-900">Contact Content</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => saveDraftMutation.mutate()} disabled={saveDraftMutation.isPending}>
              <Save size={14} className="mr-1.5" /> Save Draft
            </Button>
            <button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white font-ui text-xs font-medium uppercase tracking-wider rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Send size={14} /> Publish
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <SplitEditor title="Contact Content" preview={<ContactPreview wedding={previewWedding} />}>
            <Card className="p-5 mb-4">
              <h3 className="font-ui text-sm font-semibold text-gray-900 mb-4">Contact Details</h3>
              <div className="space-y-4">
                <FormField label="Phone Number">
                  <Input value={content.contact_phone || ""} onChange={(e) => update("contact_phone", e.target.value)} placeholder="+60 12 345 6789" />
                </FormField>
                <FormField label="Email Address">
                  <Input value={content.contact_email || ""} onChange={(e) => update("contact_email", e.target.value)} placeholder="contact@example.com" />
                </FormField>
                <FormField label="Address">
                  <Textarea value={content.contact_address || ""} onChange={(e) => update("contact_address", e.target.value)} placeholder="123 Wedding Lane, City, Country" />
                </FormField>
              </div>
            </Card>
          </SplitEditor>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </AdminLayout>
  );
}
