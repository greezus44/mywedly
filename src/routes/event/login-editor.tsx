import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type LoginConfig } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Card, FormField, Toast } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { useState } from "react";

type Ctx = { event: UserEvent };
export default function LoginEditorPage() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const config: LoginConfig = event.draft_login_config || { bgColor: "#1a1a1a", textColor: "#ffffff", buttonText: "Continue", heading: "Welcome", subheading: "Please enter your name to continue", inputPlaceholder: "Your name" };

  const update = (patch: Partial<LoginConfig>) => { const next = { ...config, ...patch }; saveMutation.mutate({ draft_login_config: next }); };
  const saveMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => { const { error } = await supabase.from("user_events").update(patch).eq("id", eventId); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
    onError: (e: Error) => setToast(`Save failed: ${e.message}`),
  });

  return (
    <div className="p-6">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="font-heading text-2xl text-gray-900">Login Page</h2>
          <Card className="space-y-4">
            <FormField label="Heading"><Input value={config.heading || ""} onChange={(e) => update({ heading: e.target.value })} /></FormField>
            <FormField label="Subheading"><Input value={config.subheading || ""} onChange={(e) => update({ subheading: e.target.value })} /></FormField>
            <FormField label="Input Placeholder"><Input value={config.inputPlaceholder || ""} onChange={(e) => update({ inputPlaceholder: e.target.value })} /></FormField>
            <FormField label="Button Text"><Input value={config.buttonText || "Continue"} onChange={(e) => update({ buttonText: e.target.value })} /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Background Color"><input type="color" value={config.bgColor || "#1a1a1a"} onChange={(e) => update({ bgColor: e.target.value })} className="w-12 h-9 rounded border border-gray-200" /></FormField>
              <FormField label="Text Color"><input type="color" value={config.textColor || "#ffffff"} onChange={(e) => update({ textColor: e.target.value })} className="w-12 h-9 rounded border border-gray-200" /></FormField>
            </div>
            <FormField label="Button Color"><input type="color" value={config.buttonColor || "#1a1a1a"} onChange={(e) => update({ buttonColor: e.target.value })} className="w-12 h-9 rounded border border-gray-200" /></FormField>
          </Card>
          <Card><FormField label="Background Image"><ImageUpload value={config.bgImage || ""} onChange={(url) => update({ bgImage: url })} eventId={eventId} /></FormField></Card>
          <Card><FormField label="Logo"><ImageUpload value={config.logo || ""} onChange={(url) => update({ logo: url })} eventId={eventId} /></FormField></Card>
        </div>
        <div className="lg:sticky lg:top-32 self-start">
          <SplitEditor preview={<LoginPreview event={event} />}>
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">Login Preview</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden"><LoginPreview event={event} /></div>
            </div>
          </SplitEditor>
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
