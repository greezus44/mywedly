import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Globe, Phone, Mail, MapPin } from "lucide-react";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { ContactPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";

export function ContentContactPage() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState<WeddingContent>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading } = useQuery({
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
      const draft = (wedding.draft_content || {}) as WeddingContent;
      const pub = (wedding.content || {}) as WeddingContent;
      setContent({ ...pub, ...draft });
    }
  }, [wedding]);

  const saveDraftMutation = useMutation({
    mutationFn: async (newContent: WeddingContent) => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("weddings").update({ draft_content: newContent }).eq("id", wedding.id);
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
      if (!wedding) throw new Error("No wedding");
      const draftContent = { ...(wedding.content || {}), ...content } as WeddingContent;
      const { error } = await supabase.from("weddings").update({ content: draftContent, draft_content: draftContent }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Contact published", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish", type: "error" }),
  });

  const update = (key: keyof WeddingContent, value: string | boolean | null) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Wedding not found</p>
        </div>
      </AdminLayout>
    );
  }

  const previewWedding = { ...wedding, draft_content: content } as Wedding;

  return (
    <AdminLayout>
      <SplitEditor title="Contact Content Editor" preview={<ContactPreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Contact</h2>
            <p className="font-ui text-xs text-[var(--color-text-muted)] mb-6">Contact details shown to your guests</p>
          </div>

          <FormField label="Phone Number" hint="Contact phone number">
            <Input value={content.contact_phone || ""} onChange={(e) => update("contact_phone", e.target.value)} placeholder="+60 12 345 6789" />
          </FormField>

          <FormField label="Email Address" hint="Contact email">
            <Input value={content.contact_email || ""} onChange={(e) => update("contact_email", e.target.value)} placeholder="hello@ourwedding.com" />
          </FormField>

          <FormField label="Address" hint="Venue or contact address">
            <Textarea value={content.contact_address || ""} onChange={(e) => update("contact_address", e.target.value)} placeholder="123 Wedding Lane, Kuala Lumpur, Malaysia" />
          </FormField>

          <div className="pt-4 border-t border-[var(--color-border)]/15 space-y-3">
            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => saveDraftMutation.mutate(content)}
              disabled={saveDraftMutation.isPending}
            >
              <Save size={14} className="mr-2" />
              {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              <Globe size={14} className="mr-2" />
              {publishMutation.isPending ? "Publishing..." : "Publish Contact"}
            </Button>
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
