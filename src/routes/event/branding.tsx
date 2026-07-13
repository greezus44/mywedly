import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type LogoConfig } from "../../lib/supabase";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { ColorInput, RangeInput, FormField, Toggle, Card, Toast } from "../../components/ui";
import { Input } from "../../components/ui/Input";
import { Loader2 } from "lucide-react";
import { debounce } from "../../lib/utils";

export default function Branding() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const [logo, setLogo] = useState<LogoConfig>({ enabled: false });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (event && !initialized.current) {
      setLogo(event.draft_logo_config || event.logo_config || { enabled: false });
      initialized.current = true;
    }
  }, [event]);

  const saveMutation = useMutation<void, Error, LogoConfig>({
    mutationFn: async (cfg) => {
      setSaving(true);
      const { error } = await supabase
        .from("events")
        .update({ draft_logo_config: cfg })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => setToast({ message: "Saved", type: "success" }),
    onError: () => setToast({ message: "Failed to save", type: "error" }),
    onSettled: () => setSaving(false),
  });

  const debouncedSave = useRef(
    debounce((cfg: LogoConfig) => {
      saveMutation.mutate(cfg);
    }, 800)
  ).current;

  const update = useCallback(
    (patch: Partial<LogoConfig>) => {
      const next = { ...logo, ...patch };
      setLogo(next);
      debouncedSave(next);
    },
    [logo, debouncedSave]
  );

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Branding</h1>
          <p className="text-sm text-slate-500">Configure your event logo and branding.</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
          </div>
        )}
      </div>

      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Logo</h3>
            <p className="text-xs text-slate-500">Display a logo on your event pages.</p>
          </div>
          <Toggle checked={logo.enabled} onChange={(v) => update({ enabled: v })} />
        </div>

        {logo.enabled && (
          <div className="space-y-4 border-t border-slate-100 pt-4">
            <FormField label="Logo Image">
              <ImageUpload value={logo.image || ""} onChange={(v) => update({ image: v })} eventId={eventId} aspectRatio="3/1" />
            </FormField>
            <FormField label="Logo Text">
              <Input value={logo.text || ""} onChange={(e) => update({ text: e.target.value })} placeholder="Optional text beside logo" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Font Size">
                <RangeInput value={logo.fontSize ?? 18} min={10} max={48} step={1} onChange={(v) => update({ fontSize: v })} />
              </FormField>
              <ColorInput label="Color" value={logo.color || "#ffffff"} onChange={(v) => update({ color: v })} />
            </div>
          </div>
        )}

        {!logo.enabled && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500 text-center py-6">Enable the logo toggle to configure branding.</p>
          </div>
        )}
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
