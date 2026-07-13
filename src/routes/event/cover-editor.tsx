import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, CoverConfig, LogoConfig } from "../../lib/supabase";
import { DEFAULT_COVER_CONFIG, DEFAULT_LOGO_CONFIG, FONT_OPTIONS } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { FormField, ColorInput, RangeInput, Toggle, Toast, Skeleton } from "../../components/ui/index";
import { debounce } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export default function CoverEditor() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [cover, setCover] = useState<CoverConfig>({ ...DEFAULT_COVER_CONFIG, ...(event?.draft_cover_config || {}) });
  const [logo, setLogo] = useState<LogoConfig>({ ...DEFAULT_LOGO_CONFIG, ...(event?.draft_logo_config || {}) });

  useEffect(() => {
    if (event) {
      setCover({ ...DEFAULT_COVER_CONFIG, ...(event.draft_cover_config || {}) });
      setLogo({ ...DEFAULT_LOGO_CONFIG, ...(event.draft_logo_config || {}) });
    }
  }, [event]);

  const previewKey = useMemo(() => JSON.stringify({ cover, logo }), [cover, logo]);

  const debouncedSave = useMemo(
    () =>
      debounce(async (coverConfig: CoverConfig, logoConfig: LogoConfig) => {
        if (!eventId) return;
        setSaving(true);
        const { error } = await supabase
          .from("user_events")
          .update({ draft_cover_config: coverConfig, draft_logo_config: logoConfig })
          .eq("id", eventId);
        setSaving(false);
        if (error) {
          setToast("Failed to save");
          setTimeout(() => setToast(null), 3000);
        }
        queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      }, 800),
    [eventId, queryClient]
  );

  useEffect(() => {
    if (!event) return;
    debouncedSave(cover, logo);
  }, [cover, logo, event, debouncedSave]);

  const saveMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({ draft_cover_config: cover, draft_logo_config: logo })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast("Saved");
      setTimeout(() => setToast(null), 3000);
    },
    onError: () => {
      setToast("Failed to save");
      setTimeout(() => setToast(null), 3000);
    },
  });

  if (!event) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Cover Page</h1>
          <p className="text-sm text-gray-500 mt-0.5">The landing page guests see first</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
            </span>
          )}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save
          </Button>
        </div>
      </div>

      <SplitEditor title="Cover Settings" preview={<CoverPreview event={event} coverConfig={cover} />} previewKey={previewKey}>
        <div className="space-y-5">
          <FormField label="Background Image">
            <ImageUpload value={cover.bgImage} onChange={(url) => setCover({ ...cover, bgImage: url })} eventId={eventId} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Background Color">
              <ColorInput value={cover.bgColor} onChange={(v) => setCover({ ...cover, bgColor: v })} />
            </FormField>
            <FormField label="Text Color">
              <ColorInput value={cover.textColor} onChange={(v) => setCover({ ...cover, textColor: v })} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Overlay Color">
              <ColorInput value={cover.overlayColor} onChange={(v) => setCover({ ...cover, overlayColor: v })} />
            </FormField>
            <FormField label="Overlay Opacity">
              <RangeInput value={cover.overlayOpacity} min={0} max={1} step={0.05} onChange={(v) => setCover({ ...cover, overlayOpacity: v })} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Button Color">
              <ColorInput value={cover.buttonColor} onChange={(v) => setCover({ ...cover, buttonColor: v })} />
            </FormField>
            <FormField label="Button Text">
              <Input value={cover.buttonText} onChange={(e) => setCover({ ...cover, buttonText: e.target.value })} />
            </FormField>
          </div>

          <FormField label="Custom Text (above title)">
            <Input value={cover.customText} onChange={(e) => setCover({ ...cover, customText: e.target.value })} placeholder="e.g. The Wedding Of" />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Title Font">
              <Select value={cover.font} onChange={(e) => setCover({ ...cover, font: e.target.value })}>
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Script Font">
              <Select value={cover.scriptFont} onChange={(e) => setCover({ ...cover, scriptFont: e.target.value })}>
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-100">
            <Toggle checked={cover.showDate} onChange={(v) => setCover({ ...cover, showDate: v })} label="Show event date" />
            <Toggle checked={cover.showCountdown} onChange={(v) => setCover({ ...cover, showCountdown: v })} label="Show countdown timer" />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Logo</h3>
            <div className="space-y-4">
              <Toggle checked={logo.enabled} onChange={(v) => setLogo({ ...logo, enabled: v })} label="Show logo on cover" />
              {logo.enabled && (
                <>
                  <FormField label="Logo Image">
                    <ImageUpload value={logo.image} onChange={(url) => setLogo({ ...logo, image: url })} eventId={eventId} aspectRatio="square" />
                  </FormField>
                  {!logo.image && (
                    <>
                      <FormField label="Logo Text">
                        <Input value={logo.text} onChange={(e) => setLogo({ ...logo, text: e.target.value })} />
                      </FormField>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Font Size">
                          <RangeInput value={logo.fontSize} min={12} max={64} onChange={(v) => setLogo({ ...logo, fontSize: v })} />
                        </FormField>
                        <FormField label="Color">
                          <ColorInput value={logo.color} onChange={(v) => setLogo({ ...logo, color: v })} />
                        </FormField>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
