import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { ContactPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { getCoverContent } from "../../lib/theme";
import { Save, Phone } from "lucide-react";

export function ContentContactPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

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

  const existingContent = wedding ? getCoverContent(wedding) : ({} as WeddingContent);
  const [content, setContent] = useState<WeddingContent>(existingContent);

  useEffect(() => {
    if (wedding && JSON.stringify(existingContent) !== JSON.stringify(content)) {
      setContent(existingContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedding]);

  const saveDraft = useMutation({
    mutationFn: async (newContent: WeddingContent) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_content: newContent }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding"] }); setToast("Draft saved"); },
  });

  const publish = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ content: content, draft_content: content }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding"] }); setToast("Contact content published successfully"); },
  });

  const update = (patch: Partial<WeddingContent>) => {
    const newContent = { ...content, ...patch };
    setContent(newContent);
    saveDraft.mutate(newContent);
  };

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Loading...</div></div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="p-6 text-gray-500">Wedding not found</div></AdminLayout>;

  const previewWedding = { ...wedding, draft_content: content } as Wedding;

  return (
    <AdminLayout>
      <SplitEditor title="Contact Editor" preview={<ContactPreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Phone size={18} className="text-indigo-600" />
            <h2 className="font-ui text-base font-semibold text-gray-900">Contact Information</h2>
          </div>

          <FormField label="Phone Number" hint="Contact phone for guests">
            <Input value={content.contact_phone || ""} onChange={(e) => update({ contact_phone: e.target.value })} placeholder="e.g. +60 12 345 6789" className="!bg-white !border-gray-200 !text-gray-700" />
          </FormField>

          <FormField label="Email Address">
            <Input value={content.contact_email || ""} onChange={(e) => update({ contact_email: e.target.value })} placeholder="e.g. contact@example.com" className="!bg-white !border-gray-200 !text-gray-700" />
          </FormField>

          <FormField label="Address" hint="Wedding venue or contact address">
            <Textarea value={content.contact_address || ""} onChange={(e) => update({ contact_address: e.target.value })} placeholder="Full address..." className="!bg-white !border-gray-200 !text-gray-700" />
          </FormField>

          {/* Publish button */}
          <div className="pt-4 border-t border-gray-100">
            <Button variant="primary" size="md" className="w-full" onClick={() => publish.mutate()} disabled={publish.isPending}>
              <Save size={14} className="mr-2" /> Publish Contact
            </Button>
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
