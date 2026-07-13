import { useState, useEffect, useRef } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type LogoConfig } from "../../lib/supabase";
import { Card, FormField, Toggle, ColorInput, RangeInput, Toast } from "../../components/ui";
import { Input } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { Layers } from "lucide-react";

const DEFAULT_LOGO_CONFIG: LogoConfig = {
  enabled: false,
  image: "",
  text: "",
  fontSize: 24,
  color: "#1a1a1a",
};

function BrandingPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<LogoConfig>(
    () => (event.draft_logo_config || event.logo_config || DEFAULT_LOGO_CONFIG) as LogoConfig
  );
  const [toast, setToast] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    const stored = (event.draft_logo_config || event.logo_config || DEFAULT_LOGO_CONFIG) as LogoConfig;
    setConfig(stored);
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async (data: LogoConfig) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_logo_config: data, updated_at: new Date().toISOString() })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaveState("saved");
      setToast("Branding saved");
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

  const update = (partial: Partial<LogoConfig>) => setConfig((prev) => ({ ...prev, ...partial }));

  const previewEvent: UserEvent = {
    ...event,
    draft_logo_config: config,
  };

  return (
    <>
      <SplitEditor preview={<CoverPreview event={previewEvent} />}>
        <div className="space-y-6 max-w-xl mx-auto">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] flex items-center gap-2">
              <Layers className="w-5 h-5" /> Branding
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Add a logo or brand text to your event"}
            </p>
          </div>

          <Card className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-[var(--color-text)]">Enable Branding</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Show a logo or brand text on your pages</p>
              </div>
              <Toggle
                checked={config.enabled}
                onChange={(v) => update({ enabled: v })}
              />
            </div>
          </Card>

          {config.enabled && (
            <>
              <Card className="p-5 space-y-5">
                <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Logo Image</h3>

                <FormField label="Upload Logo" hint="PNG or SVG with transparent background recommended">
                  <ImageUpload
                    value={config.image || ""}
                    onChange={(url) => update({ image: url })}
                    eventId={eventId}
                    aspectRatio="4/1"
                  />
                </FormField>

                <FormField label="Brand Text" hint="Shown alongside or instead of logo image">
                  <Input
                    value={config.text || ""}
                    onChange={(e) => update({ text: e.target.value })}
                    placeholder="Brand Name"
                  />
                </FormField>
              </Card>

              <Card className="p-5 space-y-5">
                <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Style</h3>

                <FormField label="Font Size (px)">
                  <RangeInput
                    value={config.fontSize ?? 24}
                    onChange={(v) => update({ fontSize: v })}
                    min={12}
                    max={64}
                    step={2}
                  />
                </FormField>

                <FormField label="Color">
                  <ColorInput
                    value={config.color || "#1a1a1a"}
                    onChange={(v) => update({ color: v })}
                  />
                </FormField>
              </Card>

              {/* Live preview of branding */}
              <Card className="p-5">
                <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Preview</h3>
                <div className="flex items-center justify-center py-8 bg-[var(--color-bg-subtle)]" style={{ borderRadius: "var(--radius)" }}>
                  {config.image && (
                    <img src={config.image} alt="Logo" className="max-h-16 object-contain" style={{ marginRight: config.text ? "12px" : 0 }} />
                  )}
                  {config.text && (
                    <span
                      className="font-heading"
                      style={{
                        fontSize: `${config.fontSize ?? 24}px`,
                        color: config.color || "#1a1a1a",
                      }}
                    >
                      {config.text}
                    </span>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </SplitEditor>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

export default BrandingPage;
