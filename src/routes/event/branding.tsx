import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type LogoConfig } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Input } from "../../components/ui/Input";
import { ColorInput, RangeInput, Toggle, FormField, Toast, Skeleton, Card } from "../../components/ui";
import { LogoRenderer } from "../../components/preview/PreviewRenderers";

export default function BrandingEditor() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const [logo, setLogo] = useState<LogoConfig>({ enabled: false });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (event && !initialized.current) {
      setLogo(event.draft_logo_config || event.logo_config || { enabled: false });
      initialized.current = true;
    }
  }, [event]);

  const saveMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { error } = await supabase
        .from("events")
        .update({ draft_logo_config: logo })
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

  const update = (patch: Partial<LogoConfig>) => {
    setLogo((prev) => ({ ...prev, ...patch }));
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

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Branding & Logo</h1>
      <Card className="p-6">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Logo Display</h2>
              <p className="text-xs text-slate-500 mt-0.5">Show your logo on the cover and pages</p>
            </div>
            <Toggle checked={logo.enabled} onChange={(v) => update({ enabled: v })} />
          </div>

          {logo.enabled && (
            <>
              <FormField label="Logo Image">
                <ImageUpload value={logo.image || ""} onChange={(v) => update({ image: v })} eventId={eventId} aspectRatio="4/1" />
              </FormField>
              <FormField label="Logo Text">
                <Input value={logo.text || ""} onChange={(e) => update({ text: e.target.value })} placeholder="Our Wedding" />
              </FormField>
              <FormField label={`Font Size: ${logo.fontSize ?? 16}px`}>
                <RangeInput value={logo.fontSize ?? 16} onChange={(v) => update({ fontSize: v })} min={10} max={48} step={1} />
              </FormField>
              <FormField label="Logo Color">
                <ColorInput value={logo.color || "#1e293b"} onChange={(v) => update({ color: v })} />
              </FormField>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Preview</h3>
                <div className="flex items-center justify-center p-6 bg-slate-50 rounded-lg border border-slate-200">
                  <LogoRenderer logo={logo} />
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
