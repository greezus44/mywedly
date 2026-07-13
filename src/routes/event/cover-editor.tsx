import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type CoverConfig, type LogoConfig } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { ColorInput, RangeInput, Toggle, FormField, Toast, Skeleton } from "../../components/ui";
import { Input, Textarea, Select } from "../../components/ui/Input";

export default function CoverEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();

  const [cover, setCover] = useState<CoverConfig>({});
  const [logo, setLogo] = useState<LogoConfig>({ enabled: false });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!event) return;
    setCover(event.draft_cover_config || event.cover_config || {});
    setLogo(event.draft_logo_config || event.logo_config || { enabled: false });
    initialized.current = true;
  }, [event]);

  const save = useCallback(async (coverData: CoverConfig, logoData: LogoConfig) => {
    if (!eventId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({ draft_cover_config: coverData, draft_logo_config: logoData })
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

  const updateCover = (patch: Partial<CoverConfig>) => {
    setCover((prev) => {
      const next = { ...prev, ...patch };
      if (initialized.current) debouncedSave(next, logo);
      return next;
    });
  };

  const updateLogo = (patch: Partial<LogoConfig>) => {
    setLogo((prev) => {
      const next = { ...prev, ...patch };
      if (initialized.current) debouncedSave(cover, next);
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

  const previewEvent: UserEvent = {
    ...event,
    draft_cover_config: cover,
    draft_logo_config: logo,
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Cover Editor</h1>
          <p className="text-sm text-slate-500">Customize your event cover page</p>
        </div>
        {saving && <span className="text-sm text-slate-500">Saving...</span>}
      </div>
      <SplitEditor
        preview={<CoverPreview event={previewEvent} />}
      >
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-slate-900">Cover Settings</h2>
          <FormField label="Background Image">
            <ImageUpload value={cover.bgImage || ""} onChange={(v) => updateCover({ bgImage: v })} eventId={eventId} aspectRatio="16/9" />
          </FormField>
          <ColorInput label="Background Color" value={cover.bgColor || "#0f172a"} onChange={(v) => updateCover({ bgColor: v })} />
          <ColorInput label="Overlay Color" value={cover.overlayColor || "#000000"} onChange={(v) => updateCover({ overlayColor: v })} />
          <RangeInput label="Overlay Opacity" value={cover.overlayOpacity ?? 0.4} min={0} max={1} step={0.05} onChange={(v) => updateCover({ overlayOpacity: v })} />
          <ColorInput label="Text Color" value={cover.textColor || "#ffffff"} onChange={(v) => updateCover({ textColor: v })} />
          <ColorInput label="Button Color" value={cover.buttonColor || "#ffffff"} onChange={(v) => updateCover({ buttonColor: v })} />
          <FormField label="Button Text">
            <Input value={cover.buttonText || ""} onChange={(e) => updateCover({ buttonText: e.target.value })} placeholder="Enter" />
          </FormField>
          <FormField label="Heading Font">
            <Select value={cover.font || "Inter"} onChange={(e) => updateCover({ font: e.target.value })}>
              <option value="Inter">Inter (Sans)</option>
              <option value="Cormorant Garamond">Cormorant Garamond (Serif)</option>
            </Select>
          </FormField>
          <FormField label="Script Font">
            <Select value={cover.scriptFont || "Cormorant Garamond"} onChange={(e) => updateCover({ scriptFont: e.target.value })}>
              <option value="Cormorant Garamond">Cormorant Garamond (Serif)</option>
              <option value="Inter">Inter (Sans)</option>
            </Select>
          </FormField>
          <FormField label="Custom Text">
            <Textarea value={cover.customText || ""} onChange={(e) => updateCover({ customText: e.target.value })} placeholder="Together with their families..." />
          </FormField>
          <Toggle checked={cover.showDate ?? true} onChange={(v) => updateCover({ showDate: v })} label="Show Date" />
          <Toggle checked={cover.showCountdown ?? false} onChange={(v) => updateCover({ showCountdown: v })} label="Show Countdown" />

          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Logo Settings</h2>
            <Toggle checked={logo.enabled} onChange={(v) => updateLogo({ enabled: v })} label="Show Logo" />
            {logo.enabled && (
              <>
                <div className="mt-4">
                  <FormField label="Logo Image">
                    <ImageUpload value={logo.image || ""} onChange={(v) => updateLogo({ image: v })} eventId={eventId} aspectRatio="4/1" />
                  </FormField>
                </div>
                <div className="mt-4">
                  <FormField label="Logo Text">
                    <Input value={logo.text || ""} onChange={(e) => updateLogo({ text: e.target.value })} placeholder="Brand name" />
                  </FormField>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <FormField label="Font Size">
                    <Input type="number" value={logo.fontSize ?? 18} onChange={(e) => updateLogo({ fontSize: Number(e.target.value) })} />
                  </FormField>
                  <ColorInput label="Color" value={logo.color || "#ffffff"} onChange={(v) => updateLogo({ color: v })} />
                </div>
              </>
            )}
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
