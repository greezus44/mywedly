import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { supabase, type UserEvent, type LoginConfig } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { ColorInput, RangeInput, FormField, Toast, Skeleton } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";

export default function LoginEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();

  const [config, setConfig] = useState<LoginConfig>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!event) return;
    setConfig(event.draft_login_config || event.login_config || {});
    initialized.current = true;
  }, [event]);

  const save = useCallback(async (data: LoginConfig) => {
    if (!eventId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({ draft_login_config: data })
        .eq("id", eventId);
      if (error) throw error;
      setToast({ message: "Saved", type: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Save failed", type: "error" });
    } finally {
      setSaving(false);
    }
  }, [eventId]);

  const debouncedSave = useRef(debounce(save, 800)).current;

  const update = (patch: Partial<LoginConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      if (initialized.current) debouncedSave(next);
      return next;
    });
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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Login Editor</h1>
          <p className="text-sm text-slate-500">Customize the guest login page</p>
        </div>
        {saving && <span className="text-sm text-slate-500">Saving...</span>}
      </div>
      <SplitEditor preview={<LoginPreview event={previewEvent} />}>
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-slate-900">Login Page Settings</h2>
          <FormField label="Background Image">
            <ImageUpload value={config.bgImage || ""} onChange={(v) => update({ bgImage: v })} eventId={eventId} aspectRatio="16/9" />
          </FormField>
          <ColorInput label="Background Color" value={config.bgColor || "#f8fafc"} onChange={(v) => update({ bgColor: v })} />
          <ColorInput label="Overlay Color" value={config.overlayColor || "#000000"} onChange={(v) => update({ overlayColor: v })} />
          <RangeInput label="Overlay Opacity" value={config.overlayOpacity ?? 0.4} min={0} max={1} step={0.05} onChange={(v) => update({ overlayOpacity: v })} />
          <ColorInput label="Text Color" value={config.textColor || "#1e293b"} onChange={(v) => update({ textColor: v })} />
          <ColorInput label="Button Color" value={config.buttonColor || "#0f172a"} onChange={(v) => update({ buttonColor: v })} />
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
