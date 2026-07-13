import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type LoginConfig } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { ColorInput, RangeInput, FormField, Toast } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { Loader2 } from "lucide-react";
import { debounce } from "../../lib/utils";

export default function LoginEditor() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const [config, setConfig] = useState<LoginConfig>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (event && !initialized.current) {
      setConfig(event.draft_login_config || event.login_config || {});
      initialized.current = true;
    }
  }, [event]);

  const saveMutation = useMutation<void, Error, LoginConfig>({
    mutationFn: async (cfg) => {
      setSaving(true);
      const { error } = await supabase
        .from("events")
        .update({ draft_login_config: cfg })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => setToast({ message: "Saved", type: "success" }),
    onError: () => setToast({ message: "Failed to save", type: "error" }),
    onSettled: () => setSaving(false),
  });

  const debouncedSave = useRef(
    debounce((cfg: LoginConfig) => {
      saveMutation.mutate(cfg);
    }, 800)
  ).current;

  const update = useCallback(
    (patch: Partial<LoginConfig>) => {
      const next = { ...config, ...patch };
      setConfig(next);
      debouncedSave(next);
    },
    [config, debouncedSave]
  );

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const previewEvent: UserEvent = { ...event, draft_login_config: config };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Login Editor</h1>
          <p className="text-sm text-slate-500">Customize the guest login screen.</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
          </div>
        )}
      </div>
      <SplitEditor preview={<LoginPreview event={previewEvent} />}>
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Background</h3>
            <FormField label="Background Image">
              <ImageUpload value={config.bgImage || ""} onChange={(v) => update({ bgImage: v })} eventId={eventId} />
            </FormField>
            <div className="mt-3">
              <ColorInput label="Background Color" value={config.bgColor || "#f8fafc"} onChange={(v) => update({ bgColor: v })} />
            </div>
            <div className="mt-3">
              <ColorInput label="Overlay Color" value={config.overlayColor || "#000000"} onChange={(v) => update({ overlayColor: v })} />
            </div>
            <div className="mt-3">
              <RangeInput label="Overlay Opacity" value={config.overlayOpacity ?? 0.4} min={0} max={1} step={0.05} onChange={(v) => update({ overlayOpacity: v })} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Content</h3>
            <FormField label="Heading">
              <Input value={config.heading || ""} onChange={(e) => update({ heading: e.target.value })} placeholder="Welcome" />
            </FormField>
            <div className="mt-3">
              <FormField label="Subheading">
                <Textarea value={config.subheading || ""} onChange={(e) => update({ subheading: e.target.value })} placeholder="Please enter your name to continue" />
              </FormField>
            </div>
            <div className="mt-3">
              <FormField label="Input Placeholder">
                <Input value={config.inputPlaceholder || ""} onChange={(e) => update({ inputPlaceholder: e.target.value })} placeholder="Your full name" />
              </FormField>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Button</h3>
            <ColorInput label="Button Color" value={config.buttonColor || "#0f172a"} onChange={(v) => update({ buttonColor: v })} />
            <div className="mt-3">
              <FormField label="Button Text">
                <Input value={config.buttonText || ""} onChange={(e) => update({ buttonText: e.target.value })} placeholder="Continue" />
              </FormField>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Text</h3>
            <ColorInput label="Text Color" value={config.textColor || "#1e293b"} onChange={(v) => update({ textColor: v })} />
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
