import { useState, useEffect, useRef } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CoverConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, FormField, Toggle, ColorInput, RangeInput, Toast } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { RotateCcw } from "lucide-react";

const DEFAULT_COVER_CONFIG: CoverConfig = {
  bgImage: "",
  bgColor: "#1a1a1a",
  overlayColor: "#000000",
  overlayOpacity: 0.4,
  textColor: "#ffffff",
  buttonColor: "#ffffff",
  buttonText: "Enter",
  customText: "",
  showDate: true,
  showCountdown: false,
};

function CoverEditorPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<CoverConfig>(
    () => (event.draft_cover_config || event.cover_config || DEFAULT_COVER_CONFIG) as CoverConfig
  );
  const [toast, setToast] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    const stored = (event.draft_cover_config || event.cover_config || DEFAULT_COVER_CONFIG) as CoverConfig;
    setConfig(stored);
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async (data: CoverConfig) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_cover_config: data, updated_at: new Date().toISOString() })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaveState("saved");
      setToast("Cover saved");
      setTimeout(() => setSaveState("idle"), 2000);
    },
    onError: (err: Error) => {
      setToast(`Failed to save: ${err.message}`);
      setSaveState("idle");
    },
  });

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate(config);
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const update = (partial: Partial<CoverConfig>) => setConfig((prev) => ({ ...prev, ...partial }));
  const reset = () => setConfig(DEFAULT_COVER_CONFIG);

  return (
    <>
      <SplitEditor preview={<CoverPreview event={event} />}>
        <div className="space-y-6 max-w-xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl text-[var(--color-text)]">Cover Page</h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Edit your cover page"}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          </div>

          <Card className="p-5 space-y-5">
            <FormField label="Background Image" hint="Upload a full-screen background image">
              <ImageUpload
                value={config.bgImage || ""}
                onChange={(url) => update({ bgImage: url })}
                eventId={eventId}
                aspectRatio="16/9"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Background Color">
                <ColorInput
                  value={config.bgColor || "#1a1a1a"}
                  onChange={(v) => update({ bgColor: v })}
                />
              </FormField>
              <FormField label="Text Color">
                <ColorInput
                  value={config.textColor || "#ffffff"}
                  onChange={(v) => update({ textColor: v })}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Overlay Color" hint="Shown when bg image is set">
                <ColorInput
                  value={config.overlayColor || "#000000"}
                  onChange={(v) => update({ overlayColor: v })}
                />
              </FormField>
              <FormField label="Button Color">
                <ColorInput
                  value={config.buttonColor || "#ffffff"}
                  onChange={(v) => update({ buttonColor: v })}
                />
              </FormField>
            </div>

            <FormField label="Overlay Opacity">
              <RangeInput
                value={config.overlayOpacity ?? 0.4}
                onChange={(v) => update({ overlayOpacity: v })}
                min={0}
                max={1}
                step={0.1}
              />
            </FormField>
          </Card>

          <Card className="p-5 space-y-5">
            <FormField label="Custom Text" hint="Displayed above the event name">
              <Textarea
                value={config.customText || ""}
                onChange={(e) => update({ customText: e.target.value })}
                placeholder="Together with their families..."
                rows={2}
              />
            </FormField>

            <FormField label="Button Text">
              <Input
                value={config.buttonText || ""}
                onChange={(e) => update({ buttonText: e.target.value })}
                placeholder="Enter"
              />
            </FormField>

            <div className="flex items-center gap-6 pt-2">
              <Toggle
                checked={config.showDate ?? true}
                onChange={(v) => update({ showDate: v })}
                label="Show Date"
              />
              <Toggle
                checked={config.showCountdown ?? false}
                onChange={(v) => update({ showCountdown: v })}
                label="Show Countdown"
              />
            </div>
          </Card>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

export default CoverEditorPage;
