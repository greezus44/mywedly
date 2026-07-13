import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type CoverConfig, type LogoConfig } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { ColorInput, RangeInput, FormField, Toggle, Toast } from "../../components/ui";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { FONT_OPTIONS } from "../../lib/theme";
import { debounce } from "../../lib/utils";
import { Save, Loader2 } from "lucide-react";

export default function CoverEditor() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const [cover, setCover] = useState<CoverConfig>({});
  const [logo, setLogo] = useState<LogoConfig>({ enabled: false });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (event && !initialized.current) {
      setCover(event.draft_cover_config || event.cover_config || {});
      setLogo(event.draft_logo_config || event.logo_config || { enabled: false });
      initialized.current = true;
    }
  }, [event]);

  const saveMutation = useMutation<void, Error, { cover: CoverConfig; logo: LogoConfig }>({
    mutationFn: async ({ cover, logo }) => {
      setSaving(true);
      const { error } = await supabase
        .from("events")
        .update({ draft_cover_config: cover, draft_logo_config: logo })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => setToast({ message: "Saved", type: "success" }),
    onError: () => setToast({ message: "Failed to save", type: "error" }),
    onSettled: () => setSaving(false),
  });

  const debouncedSave = useRef(
    debounce((cover: CoverConfig, logo: LogoConfig) => {
      saveMutation.mutate({ cover, logo });
    }, 800)
  ).current;

  const triggerSave = useCallback(
    (nextCover: CoverConfig, nextLogo: LogoConfig) => {
      setCover(nextCover);
      setLogo(nextLogo);
      debouncedSave(nextCover, nextLogo);
    },
    [debouncedSave]
  );

  const updateCover = (patch: Partial<CoverConfig>) => triggerSave({ ...cover, ...patch }, logo);
  const updateLogo = (patch: Partial<LogoConfig>) => triggerSave(cover, { ...logo, ...patch });

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const previewEvent: UserEvent = {
    ...event,
    draft_cover_config: cover,
    draft_logo_config: logo,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Cover Editor</h1>
          <p className="text-sm text-slate-500">Customize the landing page cover for your event.</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
          </div>
        )}
      </div>
      <SplitEditor
        preview={<CoverPreview event={previewEvent} />}
      >
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Background</h3>
            <FormField label="Background Image">
              <ImageUpload value={cover.bgImage || ""} onChange={(v) => updateCover({ bgImage: v })} eventId={eventId} />
            </FormField>
            <div className="mt-3">
              <ColorInput label="Background Color" value={cover.bgColor || "#0f172a"} onChange={(v) => updateCover({ bgColor: v })} />
            </div>
            <div className="mt-3">
              <ColorInput label="Overlay Color" value={cover.overlayColor || "#000000"} onChange={(v) => updateCover({ overlayColor: v })} />
            </div>
            <div className="mt-3">
              <RangeInput label="Overlay Opacity" value={cover.overlayOpacity ?? 0.4} min={0} max={1} step={0.05} onChange={(v) => updateCover({ overlayOpacity: v })} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Text</h3>
            <ColorInput label="Text Color" value={cover.textColor || "#ffffff"} onChange={(v) => updateCover({ textColor: v })} />
            <div className="mt-3">
              <FormField label="Custom Text">
                <Textarea value={cover.customText || ""} onChange={(e) => updateCover({ customText: e.target.value })} placeholder="e.g. Together with their families" />
              </FormField>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <FormField label="Font">
                <Select value={cover.font || "Inter"} onChange={(e) => updateCover({ font: e.target.value })}>
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Select>
              </FormField>
              <FormField label="Script Font">
                <Select value={cover.scriptFont || "Cormorant Garamond"} onChange={(e) => updateCover({ scriptFont: e.target.value })}>
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Select>
              </FormField>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Button</h3>
            <ColorInput label="Button Color" value={cover.buttonColor || "#ffffff"} onChange={(v) => updateCover({ buttonColor: v })} />
            <div className="mt-3">
              <FormField label="Button Text">
                <Input value={cover.buttonText || ""} onChange={(e) => updateCover({ buttonText: e.target.value })} placeholder="Enter" />
              </FormField>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Display Options</h3>
            <div className="space-y-2">
              <Toggle checked={cover.showDate ?? false} onChange={(v) => updateCover({ showDate: v })} label="Show event date" />
              <Toggle checked={cover.showCountdown ?? false} onChange={(v) => updateCover({ showCountdown: v })} label="Show countdown" />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Logo</h3>
            <Toggle checked={logo.enabled} onChange={(v) => updateLogo({ enabled: v })} label="Show logo" />
            {logo.enabled && (
              <div className="mt-3 space-y-3">
                <FormField label="Logo Image">
                  <ImageUpload value={logo.image || ""} onChange={(v) => updateLogo({ image: v })} eventId={eventId} aspectRatio="3/1" />
                </FormField>
                <FormField label="Logo Text">
                  <Input value={logo.text || ""} onChange={(e) => updateLogo({ text: e.target.value })} placeholder="Optional text" />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Font Size">
                    <RangeInput value={logo.fontSize ?? 18} min={10} max={48} step={1} onChange={(v) => updateLogo({ fontSize: v })} />
                  </FormField>
                  <ColorInput label="Color" value={logo.color || "#ffffff"} onChange={(v) => updateLogo({ color: v })} />
                </div>
              </div>
            )}
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
