import { useState, useEffect, useRef } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Card, FormField, ColorInput, RangeInput, Toast } from "../../components/ui";
import { Select } from "../../components/ui/Input";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  FONT_OPTIONS,
} from "../../lib/theme";
import { useTheme } from "../../lib/theme-context";

function ThemeEditorPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const { theme, setTheme, updateTheme } = useTheme();
  const [toast, setToast] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  // Initialize theme from event
  useEffect(() => {
    const stored = (event.draft_theme || event.theme || DEFAULT_THEME) as ThemeConfig;
    setTheme(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async (data: ThemeConfig) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: data, updated_at: new Date().toISOString() })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaveState("saved");
      setToast("Theme saved");
      setTimeout(() => setSaveState("idle"), 2000);
    },
    onError: (err: Error) => {
      setToast(`Failed to save: ${err.message}`);
      setSaveState("idle");
    },
  });

  // Debounced auto-save whenever theme changes
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate(theme);
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  const applyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) setTheme(preset);
  };

  const previewEvent: UserEvent = {
    ...event,
    draft_theme: theme,
  };

  return (
    <>
      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="space-y-6 max-w-xl mx-auto">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Theme Customizer</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Changes preview instantly"}
            </p>
          </div>

          {/* Preset Selector */}
          <Card className="p-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
              Presets
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={cn(
                    "p-3 border-2 transition-all text-left",
                    theme.preset === key
                      ? "border-[var(--color-primary)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
                  )}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <div
                    className="w-full h-12 mb-2 flex items-center justify-center"
                    style={{
                      backgroundColor: preset.bgColor,
                      borderRadius: "var(--radius)",
                    }}
                  >
                    <div className="flex gap-1">
                      <div className="w-3 h-3" style={{ backgroundColor: preset.primaryColor }} />
                      <div className="w-3 h-3" style={{ backgroundColor: preset.accentColor }} />
                      <div className="w-3 h-3" style={{ backgroundColor: preset.secondaryColor }} />
                    </div>
                  </div>
                  <span className="text-xs font-medium capitalize text-[var(--color-text)]">{key}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Colors */}
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Colors</h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Primary">
                <ColorInput
                  value={theme.primaryColor || DEFAULT_THEME.primaryColor!}
                  onChange={(v) => updateTheme({ primaryColor: v })}
                />
              </FormField>
              <FormField label="Secondary">
                <ColorInput
                  value={theme.secondaryColor || DEFAULT_THEME.secondaryColor!}
                  onChange={(v) => updateTheme({ secondaryColor: v })}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Accent">
                <ColorInput
                  value={theme.accentColor || DEFAULT_THEME.accentColor!}
                  onChange={(v) => updateTheme({ accentColor: v })}
                />
              </FormField>
              <FormField label="Background">
                <ColorInput
                  value={theme.bgColor || DEFAULT_THEME.bgColor!}
                  onChange={(v) => updateTheme({ bgColor: v })}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Background Subtle">
                <ColorInput
                  value={theme.bgSubtleColor || DEFAULT_THEME.bgSubtleColor!}
                  onChange={(v) => updateTheme({ bgSubtleColor: v })}
                />
              </FormField>
              <FormField label="Border">
                <ColorInput
                  value={theme.borderColor || DEFAULT_THEME.borderColor!}
                  onChange={(v) => updateTheme({ borderColor: v })}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Text">
                <ColorInput
                  value={theme.textColor || DEFAULT_THEME.textColor!}
                  onChange={(v) => updateTheme({ textColor: v })}
                />
              </FormField>
              <FormField label="Text Muted">
                <ColorInput
                  value={theme.textMutedColor || DEFAULT_THEME.textMutedColor!}
                  onChange={(v) => updateTheme({ textMutedColor: v })}
                />
              </FormField>
            </div>
          </Card>

          {/* Typography */}
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Typography</h3>

            <div className="grid grid-cols-1 gap-4">
              <FormField label="Heading Font">
                <Select
                  value={theme.headingFont || "Cormorant Garamond"}
                  onChange={(e) => updateTheme({ headingFont: e.target.value })}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Body Font">
                <Select
                  value={theme.bodyFont || "Inter"}
                  onChange={(e) => updateTheme({ bodyFont: e.target.value })}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Script Font">
                <Select
                  value={theme.scriptFont || "Cormorant Garamond"}
                  onChange={(e) => updateTheme({ scriptFont: e.target.value })}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </Select>
              </FormField>
            </div>
          </Card>

          {/* Layout */}
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Layout</h3>

            <FormField label="Button Radius (px)">
              <RangeInput
                value={theme.buttonRadius ?? 2}
                onChange={(v) => updateTheme({ buttonRadius: v })}
                min={0}
                max={24}
                step={1}
              />
            </FormField>

            <FormField label="Section Padding (px)">
              <RangeInput
                value={theme.sectionPadding ?? 80}
                onChange={(v) => updateTheme({ sectionPadding: v })}
                min={20}
                max={160}
                step={10}
              />
            </FormField>

            <FormField label="Max Width (px)">
              <RangeInput
                value={theme.maxWidth ?? 1200}
                onChange={(v) => updateTheme({ maxWidth: v })}
                min={600}
                max={1600}
                step={50}
              />
            </FormField>
          </Card>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

export default ThemeEditorPage;
