import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { ContactPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { FormField } from "../../components/ui/ImageUpload";
import { Toast, EmptyState } from "../../components/ui/index";
import { Save, Send, RefreshCw } from "lucide-react";

export function ContentContactPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [content, setContent] = useState<WeddingContent>({});

  const weddingQuery = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const wedding = weddingQuery.data;

  useEffect(() => {
    if (wedding) {
      const draft = (wedding.draft_content || {}) as WeddingContent;
      const pub = (wedding.content || {}) as WeddingContent;
      const merged: WeddingContent = {
        contact_phone: draft.contact_phone ?? pub.contact_phone ?? "",
        contact_email: draft.contact_email ?? pub.contact_email ?? "",
        contact_address: draft.contact_address ?? pub.contact_address ?? "",
      };
      setContent(merged);
    }
  }, [wedding]);

  const saveDraftMutation = useMutation({
    mutationFn: async (values: WeddingContent) => {
      if (!wedding) throw new Error("No wedding");
      const existingDraft = (wedding.draft_content || {}) as WeddingContent;
      const merged = { ...existingDraft, ...values };
      const { data, error } = await supabase
        .from("weddings")
        .update({ draft_content: merged, updated_at: new Date().toISOString() })
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
      setToast({ message: "Draft saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save draft", type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const existingDraft = (wedding.draft_content || {}) as WeddingContent;
      const mergedDraft = { ...existingDraft, ...content };
      const existingPub = (wedding.content || {}) as WeddingContent;
      const mergedPub = { ...existingPub, ...content };
      const { data, error } = await supabase
        .from("weddings")
        .update({ draft_content: mergedDraft, content: mergedPub, updated_at: new Date().toISOString() })
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
      setToast({ message: "Contact published", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish", type: "error" }),
  });

  const handleSaveDraft = () => saveDraftMutation.mutate(content);
  const handlePublish = () => {
    saveDraftMutation.mutate(content, {
      onSuccess: () => publishMutation.mutate(),
    });
  };

  const update = (key: keyof WeddingContent, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  if (weddingQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-20">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary)]" />
        </div>
      </AdminLayout>
    );
  }

  if (weddingQuery.isError || !wedding) {
    return (
      <AdminLayout>
        <div className="p-8">
          <EmptyState title="Unable to load editor" description="Please try again later." />
        </div>
      </AdminLayout>
    );
  }

  const previewWedding: Wedding = {
    ...wedding,
    draft_content: { ...(wedding.draft_content || {}), ...content },
  };

  return (
    <AdminLayout>
      <SplitEditor title="Contact Content Editor" preview={<ContactPreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-xl text-[var(--color-text)] mb-1">Contact</h2>
            <p className="font-ui text-xs text-[var(--color-text-muted)]">Contact details for guests</p>
          </div>

          <FormField label="Phone Number">
            <Input
              value={content.contact_phone || ""}
              onChange={(e) => update("contact_phone", e.target.value)}
              placeholder="+60 12-345 6789"
            />
          </FormField>

          <FormField label="Email Address">
            <Input
              type="email"
              value={content.contact_email || ""}
              onChange={(e) => update("contact_email", e.target.value)}
              placeholder="contact@ourwedding.com"
            />
          </FormField>

          <FormField label="Address" hint="Venue or contact address">
            <Textarea
              value={content.contact_address || ""}
              onChange={(e) => update("contact_address", e.target.value)}
              placeholder="123 Wedding Venue Drive, City, Country"
              className="min-h-[100px]"
            />
          </FormField>

          <div className="pt-4 space-y-3 border-t border-[var(--color-border)]/15">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSaveDraft}
              disabled={saveDraftMutation.isPending}
            >
              <Save size={14} className="mr-2" />
              {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              variant="primary"
              className="w-full"
              onClick={handlePublish}
              disabled={publishMutation.isPending || saveDraftMutation.isPending}
            >
              <Send size={14} className="mr-2" />
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
