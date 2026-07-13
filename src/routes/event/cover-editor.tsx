import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type CoverConfig, type LogoConfig } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { ColorInput, RangeInput, Toggle, FormField, Toast, Skeleton } from "../../components/ui";
import { FONT_OPTIONS } from "../../lib/theme";

export default function CoverEditor() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const [cover, setCover] = useState<CoverConfig>({});
  const [logo, setLogo] = useState<LogoConfig>({ enabled: false });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (event && !initialized.current) {
      setCover(event.draft_cover_config || event.cover_config || {});
      setLogo(event.draft_logo_config || event.logo_config || { enabled: false });
      initialized.current = true;
    }
  }, [event]);

  const saveMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { error } = await supabase
        .from("events")
        .update({ draft_cover_config: cover, draft_logo_config: logo })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => setToast({ message: "Saved", type: "success" }),
    onError: () => setToast({ message: "Failed to save", type: "error" }),
  });

  const debouncedSave = useRef(
    debounce(() => saveMutation.mutate(), 600)
  ).current;

  const triggerSave = useCallback(() => {
    if (!initialized.current) return;
    debouncedSave();
  }, [debouncedSave]);

  const updateCover = (patch: Partial<CoverConfig>) => {
    setCover((prev) => {
      const next = { ...prev, ...patch };
      return next;
    });
    triggerSave();
  };

  const updateLogo = (patch: Partial<LogoConfig>) => {
    setLogo((prev) => {
      const next = { ...prev, ...patch };
      return next;
    });
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

  const previewEvent: UserEvent = {
    ...event,
    draft_cover_config: cover,
    draft_logo_config: logo,
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Cover Page Editor</h1>
      <SplitEditor preview={<CoverPreview event={previewEvent} />}>
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Cover Config</h2>
          <FormField label="Background Image">
            <ImageUpload value={cover.bgImage || ""} onChange={(v) => updateCover({ bgImage: v })} eventId={eventId} aspectRatio="16/9" />
          </FormField>
          <FormField label="Background Color">
            <ColorInput value={cover.bgColor || "#0f172a"} onChange={(v) => updateCover({ bgColor: v })} />
          </FormField>
          <FormField label="Overlay Color">
            <ColorInput value={cover.overlayColor || "#000000"} onChange={(v) => updateCover({ overlayColor: v })} />
          </FormField>
          <FormField label={`Overlay Opacity: ${cover.overlayOpacity ?? 0.4}`}>
            <RangeInput value={cover.overlayOpacity ?? 0.4} onChange={(v) => updateCover({ overlayOpacity: v })} min={0} max={1} step={0.05} />
          </FormField>
          <FormField label="Text Color">
            <ColorInput value={cover.textColor || "#ffffff"} onChange={(v) => updateCover({ textColor: v })} />
          </FormField>
          <FormField label="Button Color">
            <ColorInput value={cover.buttonColor || "#ffffff"} onChange={(v) => updateCover({ buttonColor: v })} />
          </FormField>
          <FormField label="Button Text">
            <Input value={cover.buttonText || ""} onChange={(e) => updateCover({ buttonText: e.target.value })} placeholder="Enter" />
          </FormField>
          <FormField label="Heading Font">
            <Select value={cover.font || "Inter"} onChange={(e) => updateCover({ font: e.target.value })}>
              {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Script Font">
            <Select value={cover.scriptFont || "Cormorant Garamond"} onChange={(e) => updateCover({ scriptFont: e.target.value })}>
              {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Custom Text">
            <Textarea value={cover.customText || ""} onChange={(e) => updateCover({ customText: e.target.value })} placeholder="Together with their families" />
          </FormField>
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <Toggle checked={cover.showDate ?? true} onChange={(v) => updateCover({ showDate: v })} label="Show Date" />
            <Toggle checked={cover.showCountdown ?? false} onChange={(v) => updateCover({ showCountdown: v })} label="Show Countdown" />
          </div>

          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide pt-4 border-t border-slate-100">Logo Config</h2>
          <Toggle checked={logo.enabled} onChange={(v) => updateLogo({ enabled: v })} label="Show Logo" />
          {logo.enabled && (
            <>
              <FormField label="Logo Image">
                <ImageUpload value={logo.image || ""} onChange={(v) => updateLogo({ image: v })} eventId={eventId} aspectRatio="4/1" />
              </FormField>
              <FormField label="Logo Text">
                <Input value={logo.text || ""} onChange={(e) => updateLogo({ text: e.target.value })} placeholder="Our Wedding" />
              </FormField>
              <FormField label={`Font Size: ${logo.fontSize ?? 16}px`}>
                <RangeInput value={logo.fontSize ?? 16} onChange={(v) => updateLogo({ fontSize: v })} min={10} max={48} step={1} />
              </FormField>
              <FormField label="Logo Color">
                <ColorInput value={logo.color || "#ffffff"} onChange={(v) => updateLogo({ color: v })} />
              </FormField>
            </>
          )}
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
