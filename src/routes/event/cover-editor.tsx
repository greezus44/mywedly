import { useState, useEffect, useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CoverConfig } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, FormField, Toggle, ColorInput, RangeInput, Toast } from "../../components/ui";
import { Input } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { Save } from "lucide-react";

export default function CoverEditorPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  const initialConfig: CoverConfig =
    (event.draft_cover_config || event.cover_config || {}) as CoverConfig;

  const [config, setConfig] = useState<CoverConfig>({
    bgImage: initialConfig.bgImage || "",
    bgColor: initialConfig.bgColor || "#1a1a1a",
    overlayColor: initialConfig.overlayColor || "#000000",
    overlayOpacity: initialConfig.overlayOpacity ?? 0.4,
    textColor: initialConfig.textColor || "#ffffff",
    buttonColor: initialConfig.buttonColor || "#ffffff",
    buttonText: initialConfig.buttonText || "Enter",
    customText: initialConfig.customText || "",
    showDate: initialConfig.showDate ?? true,
    showCountdown: initialConfig.showCountdown ?? false,
  });

  const updateMutation = useMutation({
    mutationFn: async (newConfig: CoverConfig) => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({ draft_cover_config: newConfig, updated_at: new Date().toISOString() })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast("Cover saved");
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce((newConfig: CoverConfig) => updateMutation.mutate(newConfig), 600),
    [updateMutation]
  );

  useEffect(() => {
    debouncedSave(config);
  }, [config, debouncedSave]);

  const update = <K extends keyof CoverConfig>(key: K, value: CoverConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Build a live event object for preview
  const previewEvent: UserEvent = {
    ...event,
    draft_cover_config: config,
  };

  return (
    <>
      <SplitEditor preview={<CoverPreview event={previewEvent} />}>
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Cover Page</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Customize the first page guests see when they open your invitation.
            </p>
          </div>

          <Card className="p-5 space-y-5">
            <FormField label="Background Image">
              <ImageUpload
                value={config.bgImage || ""}
                onChange={(url) => update("bgImage", url)}
                eventId={eventId}
                label="Cover background"
              />
            </FormField>

            <FormField label="Background Color" hint="Used when no image is set">
              <ColorInput
                value={config.bgColor || "#1a1a1a"}
                onChange={(v) => update("bgColor", v)}
              />
            </FormField>

            <FormField label="Overlay Color" hint="Darkens the background image for text readability">
              <ColorInput
                value={config.overlayColor || "#000000"}
                onChange={(v) => update("overlayColor", v)}
              />
            </FormField>

            <FormField label="Overlay Opacity">
              <RangeInput
                value={config.overlayOpacity ?? 0.4}
                onChange={(v) => update("overlayOpacity", v)}
                min={0}
                max={1}
                step={0.1}
              />
            </FormField>

            <FormField label="Text Color">
              <ColorInput
                value={config.textColor || "#ffffff"}
                onChange={(v) => update("textColor", v)}
              />
            </FormField>

            <FormField label="Button Color">
              <ColorInput
                value={config.buttonColor || "#ffffff"}
                onChange={(v) => update("buttonColor", v)}
              />
            </FormField>

            <FormField label="Button Text">
              <Input
                value={config.buttonText || ""}
                onChange={(e) => update("buttonText", e.target.value)}
                placeholder="Enter"
              />
            </FormField>

            <FormField label="Custom Intro Text" hint="Displayed above the event name in script font">
              <Input
                value={config.customText || ""}
                onChange={(e) => update("customText", e.target.value)}
                placeholder="Together with their families…"
              />
            </FormField>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-[var(--color-text)] font-medium">Show Date</p>
                <p className="text-xs text-[var(--color-text-muted)]">Display the event date on the cover</p>
              </div>
              <Toggle
                checked={config.showDate ?? true}
                onChange={(v) => update("showDate", v)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-[var(--color-text)] font-medium">Show Countdown</p>
                <p className="text-xs text-[var(--color-text-muted)]">Live countdown timer to the event</p>
              </div>
              <Toggle
                checked={config.showCountdown ?? false}
                onChange={(v) => update("showCountdown", v)}
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => updateMutation.mutate(config)}
              loading={updateMutation.isPending}
            >
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </div>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
