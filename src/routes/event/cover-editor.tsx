import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CoverConfig } from "../../lib/supabase";
import { Card, FormField, Toggle, ColorInput, RangeInput } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { Toast } from "../../components/ui";

interface OutletContext { event: UserEvent; }

export default function CoverEditorPage() {
  const { event } = useOutletContext<OutletContext>();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<CoverConfig>(
    (event.draft_cover_config || event.cover_config || {}) as CoverConfig
  );
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync when event changes from server
  useEffect(() => {
    setConfig((event.draft_cover_config || event.cover_config || {}) as CoverConfig);
  }, [event.draft_cover_config, event.cover_config]);

  const saveMutation = useMutation({
    mutationFn: async (newConfig: CoverConfig) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_cover_config: newConfig, updated_at: new Date().toISOString() })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ msg: "Cover saved", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Save failed: ${err.message}`, type: "error" });
    },
  });

  // Debounced auto-save
  const updateConfig = (partial: Partial<CoverConfig>) => {
    const newConfig = { ...config, ...partial };
    setConfig(newConfig);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate(newConfig);
    }, 600);
  };

  // Build a preview event object with the latest config
  const previewEvent: UserEvent = { ...event, draft_cover_config: config };

  return (
    <>
      <SplitEditor preview={<CoverPreview event={previewEvent} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-gray-900">Cover Page</h2>
            <p className="text-sm text-gray-500 mt-1">Customize the landing page guests see first.</p>
          </div>

          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Background</h3>
            <FormField label="Background Image">
              <ImageUpload
                value={config.bgImage || ""}
                onChange={(url) => updateConfig({ bgImage: url })}
                eventId={event.id}
                label="Background Image (optional)"
              />
            </FormField>
            <FormField label="Background Color" hint="Used when no image is set">
              <ColorInput
                value={config.bgColor || "#1a1a1a"}
                onChange={(v) => updateConfig({ bgColor: v })}
              />
            </FormField>
            <FormField label="Overlay Color" hint="Darkens the background image for readability">
              <ColorInput
                value={config.overlayColor || "#000000"}
                onChange={(v) => updateConfig({ overlayColor: v })}
              />
            </FormField>
            <RangeInput
              label="Overlay Opacity"
              value={config.overlayOpacity ?? 0.4}
              min={0}
              max={1}
              step={0.1}
              onChange={(v) => updateConfig({ overlayOpacity: v })}
            />
          </Card>

          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Logo</h3>
            <ImageUpload
              value={config.logo || ""}
              onChange={(url) => updateConfig({ logo: url })}
              eventId={event.id}
              label="Cover Logo (optional)"
              aspectRatio="4/3"
            />
            <RangeInput
              label="Logo Width (px)"
              value={config.logoWidth ?? 120}
              min={40}
              max={300}
              step={1}
              onChange={(v) => updateConfig({ logoWidth: v })}
            />
          </Card>

          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Text</h3>
            <FormField label="Text Color">
              <ColorInput
                value={config.textColor || "#ffffff"}
                onChange={(v) => updateConfig({ textColor: v })}
              />
            </FormField>
            <FormField label="Custom Intro Text" hint="Script text shown above the event name">
              <input
                type="text"
                value={config.customText || ""}
                onChange={(e) => updateConfig({ customText: e.target.value })}
                placeholder="Together with their families"
                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors rounded-md"
              />
            </FormField>
          </Card>

          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Button</h3>
            <FormField label="Button Color">
              <ColorInput
                value={config.buttonColor || "#1a1a1a"}
                onChange={(v) => updateConfig({ buttonColor: v })}
              />
            </FormField>
            <FormField label="Button Text">
              <input
                type="text"
                value={config.buttonText || ""}
                onChange={(e) => updateConfig({ buttonText: e.target.value })}
                placeholder="Enter"
                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors rounded-md"
              />
            </FormField>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Display Options</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-900">Show Event Date</span>
              <Toggle
                checked={config.showDate ?? true}
                onChange={(v) => updateConfig({ showDate: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-900">Show Countdown</span>
              <Toggle
                checked={config.showCountdown ?? false}
                onChange={(v) => updateConfig({ showCountdown: v })}
              />
            </div>
          </Card>
        </div>
      </SplitEditor>
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
