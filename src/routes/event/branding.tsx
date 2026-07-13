import { useState, useEffect, useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type LogoConfig } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, FormField, Toggle, ColorInput, RangeInput, Toast } from "../../components/ui";
import { Input } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { Save } from "lucide-react";

export default function BrandingPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  const initialConfig: LogoConfig =
    (event.draft_logo_config || event.logo_config || {}) as LogoConfig;

  const [config, setConfig] = useState<LogoConfig>({
    enabled: initialConfig.enabled ?? false,
    image: initialConfig.image || "",
    text: initialConfig.text || "",
    fontSize: initialConfig.fontSize ?? 24,
    color: initialConfig.color || "#1a1a1a",
  });

  const updateMutation = useMutation({
    mutationFn: async (newConfig: LogoConfig) => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({ draft_logo_config: newConfig, updated_at: new Date().toISOString() })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast("Branding saved");
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce((newConfig: LogoConfig) => updateMutation.mutate(newConfig), 600),
    [updateMutation]
  );

  useEffect(() => {
    debouncedSave(config);
  }, [config, debouncedSave]);

  const update = <K extends keyof LogoConfig>(key: K, value: LogoConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const previewEvent: UserEvent = {
    ...event,
    draft_logo_config: config,
  };

  return (
    <>
      <SplitEditor preview={<CoverPreview event={previewEvent} />}>
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Branding</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Add a logo or brand text to your event invitation.
            </p>
          </div>

          <Card className="p-5 space-y-5">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-[var(--color-text)] font-medium">Enable Logo</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Display a logo or brand text on your event pages
                </p>
              </div>
              <Toggle
                checked={config.enabled}
                onChange={(v) => update("enabled", v)}
              />
            </div>

            {config.enabled && (
              <>
                <div className="border-t border-[var(--color-border)] pt-5 space-y-5">
                  <FormField label="Logo Image" hint="Upload a logo image (PNG with transparency recommended)">
                    <ImageUpload
                      value={config.image || ""}
                      onChange={(url) => update("image", url)}
                      eventId={eventId}
                      label="Logo image"
                      aspectRatio="4/1"
                    />
                  </FormField>

                  <FormField label="Logo Text" hint="Displayed alongside or instead of an image">
                    <Input
                      value={config.text || ""}
                      onChange={(e) => update("text", e.target.value)}
                      placeholder="Brand Name"
                    />
                  </FormField>

                  <FormField label="Font Size (px)">
                    <RangeInput
                      value={config.fontSize ?? 24}
                      onChange={(v) => update("fontSize", v)}
                      min={12}
                      max={48}
                      step={1}
                      label="Font Size"
                    />
                  </FormField>

                  <FormField label="Text Color">
                    <ColorInput
                      value={config.color || "#1a1a1a"}
                      onChange={(v) => update("color", v)}
                    />
                  </FormField>
                </div>
              </>
            )}
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
