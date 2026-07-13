import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { ContactPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label } from "../../components/ui/Input";
import { Card, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { Save, Eye, Phone, Mail, MapPin } from "lucide-react";

export function ContentContactPage() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState<WeddingContent>({});
  const [previewWedding, setPreviewWedding] = useState<Wedding | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading, error } = useQuery({
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

  useEffect(() => {
    if (wedding) {
      setPreviewWedding({
        ...wedding,
        draft_content: content,
        theme_config: wedding.draft_theme_config || wedding.theme_config,
      } as Wedding);
    }
  }, [wedding, content]);

  const saveMutation = useMutation({
    mutationFn: async (data: WeddingContent) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("weddings")
        .update({ draft_content: data, updated_at: new Date().toISOString() })
        .eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Contact info saved to draft", type: "success" });
    },
    onError: (err) => setToast({ message: err.message || "Failed to save", type: "error" }),
  });

  const handleSave = () => saveMutation.mutate(content);
  const update = (key: keyof WeddingContent, value: unknown) => setContent((prev) => ({ ...prev, [key]: value }));

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="font-ui text-sm text-gray-400">Loading contact editor...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl text-[var(--color-text)]">Contact Information</h1>
            <p className="font-ui text-xs text-[var(--color-text-muted)]">How guests can reach you</p>
          </div>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save size={14} className="mr-1.5" />
            {saveMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SplitEditor
            title="Contact Content"
            preview={previewWedding ? <ContactPreview wedding={previewWedding} /> : <div />}
          >
            <div className="space-y-6">
              <FormField label="Phone Number" hint="Primary contact phone">
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <Input
                    value={content.contact_phone || ""}
                    onChange={(e) => update("contact_phone", e.target.value)}
                    placeholder="+60 12 345 6789"
                    className="pl-10"
                  />
                </div>
              </FormField>

              <FormField label="Email Address" hint="Contact email for inquiries">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <Input
                    type="email"
                    value={content.contact_email || ""}
                    onChange={(e) => update("contact_email", e.target.value)}
                    placeholder="contact@ourwedding.com"
                    className="pl-10"
                  />
                </div>
              </FormField>

              <FormField label="Address" hint="Venue or mailing address">
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-4 text-[var(--color-text-muted)]" />
                  <Textarea
                    value={content.contact_address || ""}
                    onChange={(e) => update("contact_address", e.target.value)}
                    placeholder="123 Wedding Venue Drive&#10;City, State 12345"
                    rows={4}
                    className="pl-10"
                  />
                </div>
              </FormField>

              <Card className="p-4 bg-[var(--color-bg-light)] border-[var(--color-primary)]/20">
                <div className="flex items-start gap-3">
                  <Eye size={16} className="text-[var(--color-primary)] mt-0.5" />
                  <div>
                    <p className="font-ui text-xs text-[var(--color-text)] font-medium mb-1">Contact Section</p>
                    <p className="font-ui text-xs text-[var(--color-text-muted)]">
                      Only fields you fill in will appear on the guest-facing contact page. Leave blank to hide.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </SplitEditor>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
