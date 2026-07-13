import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { ContactPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { FormField } from "../../components/ui/ImageUpload";
import { Toast } from "../../components/ui/index";
import { Save, Upload, Phone, Mail, MapPin } from "lucide-react";

export function ContentContactPage() {
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
      setToast({ message: "Contact content published!", type: "success" });
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
            <h2 className="text-xl font-semibold text-gray-900">Contact Content</h2>
            <p className="text-sm text-gray-500">Edit the contact information for your invitation.</p>
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

        <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <ContactPreview wedding={previewWedding} device={d} />}>
          <div className="space-y-4">
            <FormField label="Phone Number">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-10" value={content.contact_phone || ""} onChange={(e) => update({ contact_phone: e.target.value })} placeholder="+60 12 345 6789" />
              </div>
            </FormField>
            <FormField label="Email Address">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-10" value={content.contact_email || ""} onChange={(e) => update({ contact_email: e.target.value })} placeholder="contact@example.com" />
              </div>
            </FormField>
            <FormField label="Address">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea className="pl-10" value={content.contact_address || ""} onChange={(e) => update({ contact_address: e.target.value })} placeholder="Venue address…" />
              </div>
            </FormField>
          </div>
        </SplitEditor>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </AdminLayout>
  );
}
