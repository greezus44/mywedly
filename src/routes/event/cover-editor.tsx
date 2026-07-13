import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CoverConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, FormField, Toggle, Toast } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";
import { useState } from "react";
import { Loader2 } from "lucide-react";

type Ctx = { event: UserEvent };
export default function CoverEditorPage() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const config: CoverConfig = event.draft_cover_config || { bgColor: "#1a1a1a", textColor: "#ffffff", buttonText: "Enter", showDate: true };

  const update = (patch: Partial<CoverConfig>) => {
    const next = { ...config, ...patch };
    saveMutation.mutate({ draft_cover_config: next });
  };

  const saveMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => { const { error } = await supabase.from("user_events").update(patch).eq("id", eventId); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
    onError: (e: Error) => setToast(`Save failed: ${e.message}`),
  });

  const imageMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      const oldUrl = config.bgImage;
      if (oldUrl) { const oldPath = extractPathFromUrl(oldUrl); if (oldPath) await removeImage(oldPath).catch(() => {}); }
      const { url } = await uploadImage(file, eventId!);
      const next = { ...config, bgImage: url };
      const { error } = await supabase.from("user_events").update({ draft_cover_config: next }).eq("id", eventId);
      if (error) throw error;
      return url;
    },
    onSuccess: () => { setUploading(false); queryClient.invalidateQueries({ queryKey: ["event", eventId] }); },
    onError: (e: Error) => { setUploading(false); setToast(`Upload failed: ${e.message}`); },
  });

  const logoMutation = useMutation({
    mutationFn: async (file: File) => {
      const { url } = await uploadImage(file, eventId!);
      const next = { ...config, logo: url };
      const { error } = await supabase.from("user_events").update({ draft_cover_config: next }).eq("id", eventId);
      if (error) throw error;
      return url;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
    onError: (e: Error) => setToast(`Upload failed: ${e.message}`),
  });

  return (
    <div className="p-6">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="font-heading text-2xl text-gray-900">Cover Page</h2>
          <Card className="space-y-4">
            <FormField label="Custom Text"><Input value={config.customText || ""} onChange={(e) => update({ customText: e.target.value })} placeholder="Together with their families" /></FormField>
            <FormField label="Button Text"><Input value={config.buttonText || ""} onChange={(e) => update({ buttonText: e.target.value })} /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Background Color"><input type="color" value={config.bgColor || "#1a1a1a"} onChange={(e) => update({ bgColor: e.target.value })} className="w-12 h-9 rounded border border-gray-200" /></FormField>
              <FormField label="Text Color"><input type="color" value={config.textColor || "#ffffff"} onChange={(e) => update({ textColor: e.target.value })} className="w-12 h-9 rounded border border-gray-200" /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Button Color"><input type="color" value={config.buttonColor || "#1a1a1a"} onChange={(e) => update({ buttonColor: e.target.value })} className="w-12 h-9 rounded border border-gray-200" /></FormField>
              <FormField label="Overlay Color"><input type="color" value={config.overlayColor || "#000000"} onChange={(e) => update({ overlayColor: e.target.value })} className="w-12 h-9 rounded border border-gray-200" /></FormField>
            </div>
            <div className="flex gap-6"><Toggle checked={config.showDate ?? true} onChange={(v) => update({ showDate: v })} label="Show Date" /><Toggle checked={config.showCountdown ?? false} onChange={(v) => update({ showCountdown: v })} label="Show Countdown" /></div>
          </Card>
          <Card className="space-y-3">
            <FormField label="Background Image"><ImageUpload value={config.bgImage || ""} onChange={(url) => update({ bgImage: url })} eventId={eventId} /></FormField>
            {uploading && <p className="text-xs text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</p>}
          </Card>
          <Card className="space-y-3">
            <FormField label="Logo"><ImageUpload value={config.logo || ""} onChange={(url) => update({ logo: url })} eventId={eventId} /></FormField>
          </Card>
          <Card className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Event Details</h3>
            <FormField label="Event Name"><Input defaultValue={event.draft_name || event.name || ""} onBlur={(e) => saveMutation.mutate({ draft_name: e.target.value })} /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date"><Input type="date" defaultValue={event.draft_event_date || event.event_date || ""} onBlur={(e) => saveMutation.mutate({ draft_event_date: e.target.value })} /></FormField>
              <FormField label="Time"><Input type="time" defaultValue={event.draft_event_time || event.event_time || ""} onBlur={(e) => saveMutation.mutate({ draft_event_time: e.target.value })} /></FormField>
            </div>
            <FormField label="Venue"><Input defaultValue={event.draft_venue || event.venue || ""} onBlur={(e) => saveMutation.mutate({ draft_venue: e.target.value })} /></FormField>
            <FormField label="Address"><Textarea defaultValue={event.draft_address || event.address || ""} onBlur={(e) => saveMutation.mutate({ draft_address: e.target.value })} rows={2} /></FormField>
          </Card>
        </div>
        <div className="lg:sticky lg:top-32 self-start">
          <SplitEditor preview={<CoverPreview event={event} />}>
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">Cover Preview</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden"><CoverPreview event={event} /></div>
            </div>
          </SplitEditor>
        </div>
      </div>
      {saveMutation.isPending && <div className="fixed bottom-4 right-4 bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-2 text-sm text-gray-600 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</div>}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
