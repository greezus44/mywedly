import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type LoginConfig } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Input, Textarea } from "../../components/ui/Input";
import { ColorInput, RangeInput, FormField, Toast, Skeleton } from "../../components/ui";

export default function LoginEditor() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const [config, setConfig] = useState<LoginConfig>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (event && !initialized.current) {
      setConfig(event.draft_login_config || event.login_config || {});
      initialized.current = true;
    }
  }, [event]);

  const saveMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { error } = await supabase
        .from("events")
        .update({ draft_login_config: config })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => setToast({ message: "Saved", type: "success" }),
    onError: () => setToast({ message: "Failed to save", type: "error" }),
  });

  const debouncedSave = useRef(debounce(() => saveMutation.mutate(), 600)).current;

  const triggerSave = useCallback(() => {
    if (!initialized.current) return;
    debouncedSave();
  }, [debouncedSave]);

  const update = (patch: Partial<LoginConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    triggerSave();
  };

  if (!event) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const previewEvent: UserEvent = { ...event, draft_login_config: config };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Login Page Editor</h1>
      <SplitEditor preview={<LoginPreview event={previewEvent} />}>
        <div className="space-y-5">
          <FormField label="Background Image">
            <ImageUpload value={config.bgImage || ""} onChange={(v) => update({ bgImage: v })} eventId={eventId} aspectRatio="16/9" />
          </FormField>
          <FormField label="Background Color">
            <ColorInput value={config.bgColor || "#f8fafc"} onChange={(v) => update({ bgColor: v })} />
          </FormField>
          <FormField label="Overlay Color">
            <ColorInput value={config.overlayColor || "#000000"} onChange={(v) => update({ overlayColor: v })} />
          </FormField>
          <FormField label={`Overlay Opacity: ${config.overlayOpacity ?? 0.4}`}>
            <RangeInput value={config.overlayOpacity ?? 0.4} onChange={(v) => update({ overlayOpacity: v })} min={0} max={1} step={0.05} />
          </FormField>
          <FormField label="Text Color">
            <ColorInput value={config.textColor || "#1e293b"} onChange={(v) => update({ textColor: v })} />
          </FormField>
          <FormField label="Button Color">
            <ColorInput value={config.buttonColor || "#0f172a"} onChange={(v) => update({ buttonColor: v })} />
          </FormField>
          <FormField label="Button Text">
            <Input value={config.buttonText || ""} onChange={(e) => update({ buttonText: e.target.value })} placeholder="Continue" />
          </FormField>
          <FormField label="Heading">
            <Input value={config.heading || ""} onChange={(e) => update({ heading: e.target.value })} placeholder="Welcome" />
          </FormField>
          <FormField label="Subheading">
            <Textarea value={config.subheading || ""} onChange={(e) => update({ subheading: e.target.value })} placeholder="Please enter your name to continue" />
          </FormField>
          <FormField label="Input Placeholder">
            <Input value={config.inputPlaceholder || ""} onChange={(e) => update({ inputPlaceholder: e.target.value })} placeholder="Your full name" />
          </FormField>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
