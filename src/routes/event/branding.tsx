import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { supabase, type UserEvent, type LogoConfig } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { ColorInput, Toggle, FormField, Toast, Skeleton, Card } from "../../components/ui";
import { Input } from "../../components/ui/Input";

export default function BrandingPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();

  const [logo, setLogo] = useState<LogoConfig>({ enabled: false });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!event) return;
    setLogo(event.draft_logo_config || event.logo_config || { enabled: false });
    initialized.current = true;
  }, [event]);

  const save = useCallback(async (data: LogoConfig) => {
    if (!eventId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({ draft_logo_config: data })
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

  const update = (patch: Partial<LogoConfig>) => {
    setLogo((prev) => {
      const next = { ...prev, ...patch };
      if (initialized.current) debouncedSave(next);
      return next;
    });
  };

  if (!event) {
    return (
      <div className="p-6 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Branding</h1>
          <p className="text-sm text-slate-500">Configure your event logo and branding</p>
        </div>
        {saving && <span className="text-sm text-slate-500">Saving...</span>}
      </div>

      <Card className="p-6">
        <div className="space-y-5">
          <Toggle checked={logo.enabled} onChange={(v) => update({ enabled: v })} label="Enable Logo" />

          {logo.enabled && (
            <>
              <FormField label="Logo Image">
                <ImageUpload value={logo.image || ""} onChange={(v) => update({ image: v })} eventId={eventId} aspectRatio="4/1" />
              </FormField>

              <FormField label="Logo Text">
                <Input value={logo.text || ""} onChange={(e) => update({ text: e.target.value })} placeholder="Brand or event name" />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Font Size (px)">
                  <Input type="number" min={8} max={48} value={logo.fontSize ?? 18} onChange={(e) => update({ fontSize: Number(e.target.value) })} />
                </FormField>
                <ColorInput label="Color" value={logo.color || "#1e293b"} onChange={(v) => update({ color: v })} />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Preview</h3>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  {logo.image && <img src={logo.image} alt="Logo" className="h-12 object-contain" />}
                  {logo.text && (
                    <span style={{ fontSize: `${logo.fontSize ?? 18}px`, color: logo.color || "#1e293b" }} className="font-medium">
                      {logo.text}
                    </span>
                  )}
                  {!logo.image && !logo.text && <span className="text-sm text-slate-400">No logo configured</span>}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
