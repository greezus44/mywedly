import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Upload, Phone, Mail, MapPin } from "lucide-react";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { ContactPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { FormField } from "../../components/ui/ImageUpload";
import { Toast } from "../../components/ui/index";
import { getCoverContent } from "../../lib/theme";

export function ContentContactPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [content, setContent] = useState<WeddingContent>({});
  const [initialized, setInitialized] = useState(false);

  const { data: wedding, isLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("created_by", user.user.id)
        .single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  useEffect(() => {
    if (wedding && !initialized) {
      setContent(getCoverContent(wedding));
      setInitialized(true);
    }
  }, [wedding, initialized]);

  const saveDraftMutation = useMutation({
    mutationFn: async (draft: WeddingContent) => {
      if (!wedding) throw new Error("No wedding");
      const { data, error } = await supabase
        .from("weddings")
        .update({ draft_content: draft, updated_at: new Date().toISOString() })
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const draft = (wedding.draft_content || {}) as WeddingContent;
      const published = (wedding.content || {}) as WeddingContent;
      const merged = { ...published, ...draft };
      const { data, error } = await supabase
        .from("weddings")
        .update({ content: merged, draft_content: merged, updated_at: new Date().toISOString() })
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
      setToast({ message: "Contact page published!", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish", type: "error" }),
  });

  const updateField = useCallback(
    (field: keyof WeddingContent, value: string | boolean) => {
      setContent((prev) => {
        const next = { ...prev, [field]: value };
        saveDraftMutation.mutate(next);
        return next;
      });
    },
    [saveDraftMutation]
  );

  const previewWedding: Wedding | undefined = wedding
    ? { ...wedding, draft_content: content }
    : undefined;

  if (isLoading || !wedding || !previewWedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading editor...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <SplitEditor title="Contact Page Content" preview={<ContactPreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Contact Page</h2>
            <p className="font-ui text-sm text-[var(--color-text-muted)]">
              How guests can reach you for questions.
            </p>
          </div>

          {/* Publish bar */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-light)] border border-[var(--color-border)]/15">
            <div className="flex items-center gap-2">
              {saveDraftMutation.isPending && (
                <span className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Save size={12} className="animate-pulse" /> Saving draft...
                </span>
              )}
              {saveDraftMutation.isSuccess && !saveDraftMutation.isPending && (
                <span className="font-ui text-xs text-[var(--color-success)]">Draft saved</span>
              )}
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              <Upload size={14} className="mr-1.5" />
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </div>

          <FormField label="Phone Number" hint="Contact phone for inquiries">
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
              />
              <Input
                value={content.contact_phone || ""}
                onChange={(e) => updateField("contact_phone", e.target.value)}
                placeholder="+60 12-345 6789"
                className="pl-10"
              />
            </div>
          </FormField>

          <FormField label="Email Address" hint="Contact email for inquiries">
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
              />
              <Input
                type="email"
                value={content.contact_email || ""}
                onChange={(e) => updateField("contact_email", e.target.value)}
                placeholder="hello@ourwedding.com"
                className="pl-10"
              />
            </div>
          </FormField>

          <FormField label="Address" hint="Venue or mailing address">
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3 top-4 text-[var(--color-text-muted)] pointer-events-none"
              />
              <Textarea
                value={content.contact_address || ""}
                onChange={(e) => updateField("contact_address", e.target.value)}
                placeholder="123 Wedding Venue Drive&#10;Kuala Lumpur, Malaysia"
                className="pl-10 min-h-[100px]"
              />
            </div>
          </FormField>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
