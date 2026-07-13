import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
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
import { Save, Check } from "lucide-react";

export default function ThemeEditorPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const { theme, setTheme, updateTheme } = useTheme();
  const [toast, setToast] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  const persistMutation = useMutation({
    mutationFn: async (newTheme: ThemeConfig) => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: newTheme, updated_at: new Date().toISOString() })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedPersist = useCallback(
    debounce((newTheme: ThemeConfig) => persistMutation.mutate(newTheme), 800),
    [persistMutation]
  );

  // Initialize theme from event data on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      const eventTheme = event.draft_theme || event.theme || DEFAULT_THEME;
      setTheme(eventTheme);
      hasInitialized.current = true;
    }
  }, [event, setTheme]);

  // Persist whenever theme changes (after initial load)
  useEffect(() => {
    if (!hasInitialized.current) return;
    debouncedPersist(theme);
  }, [theme, debouncedPersist]);

  const handleUpdate = (partial: Partial<ThemeConfig>) => {
    updateTheme(partial);
  };

  const handlePresetSelect = (presetName: string) => {
    const preset = THEME_PRESETS[presetName];
    if (preset) {
      setTheme({ ...preset });
      setToast(`Applied "${presetName}" theme`);
    }
  };

  const previewEvent: UserEvent = {
    ...event,
    draft_theme: theme,
  };

  const colorFields: { key: keyof ThemeConfig; label: string }[] = [
    { key: "primaryColor", label: "Primary Color" },
    { key: "secondaryColor", label: "Secondary Color" },
    { key: "accentColor", label: "Accent Color" },
    { key: "bgColor", label: "Background Color" },
    { key: "bgSubtleColor", label: "Subtle Background" },
    { key: "textColor", label: "Text Color" },
    { key: "textMutedColor", label: "Muted Text Color" },
    { key: "borderColor", label: "Border Color" },
  ];

  return (
    <>
      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Theme Customizer</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Changes apply live to the preview and all components instantly.
            </p>
          </div>

          {/* Preset Selector */}
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Theme Presets
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.keys(THEME_PRESETS).map((presetName) => {
                const preset = THEME_PRESETS[presetName];
                const isActive = theme.preset === presetName;
                return (
                  <button
                    key={presetName}
                    onClick={() => handlePresetSelect(presetName)}
                    className="relative p-3 border-2 transition-all text-left hover:opacity-80"
                    style={{
                      borderColor: isActive
                        ? preset.primaryColor
                        : "var(--color-border)",
                      borderRadius: "var(--radius)",
                      backgroundColor: preset.bgColor,
                    }}
                  >
                    {isActive && (
                      <span
                        className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center text-white"
                        style={{
                          backgroundColor: preset.primaryColor,
                          borderRadius: "50%",
                        }}
                      >
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <div
                      className="w-full h-8 mb-2"
                      style={{
                        backgroundColor: preset.primaryColor,
                        borderRadius: "2px",
                      }}
                    />
                    <p
                      className="text-xs font-medium capitalize"
                      style={{ color: preset.textColor }}
                    >
                      {presetName}
                    </p>
                    <div className="flex gap-1 mt-1.5">
                      <div
                        className="w-4 h-4"
                        style={{ backgroundColor: preset.primaryColor, borderRadius: "2px" }}
                      />
                      <div
                        className="w-4 h-4"
                        style={{ backgroundColor: preset.secondaryColor, borderRadius: "2px" }}
                      />
                      <div
                        className="w-4 h-4"
                        style={{ backgroundColor: preset.accentColor, borderRadius: "2px" }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Color Pickers */}
          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Colors
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {colorFields.map(({ key, label }) => (
                <FormField key={key} label={label}>
                  <ColorInput
                    value={(theme[key] as string) || ""}
                    onChange={(v) => handleUpdate({ [key]: v } as Partial<ThemeConfig>)}
                  />
                </FormField>
              ))}
            </div>
          </Card>

          {/* Font Selectors */}
          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Typography
            </h3>
            <FormField label="Heading Font">
              <Select
                value={theme.headingFont || "Cormorant Garamond"}
                onChange={(e) => handleUpdate({ headingFont: e.target.value })}
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Body Font">
              <Select
                value={theme.bodyFont || "Inter"}
                onChange={(e) => handleUpdate({ bodyFont: e.target.value })}
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </Card>

          {/* Layout Controls */}
          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Layout
            </h3>
            <FormField label="Button Radius (px)">
              <RangeInput
                value={theme.buttonRadius ?? 2}
                onChange={(v) => handleUpdate({ buttonRadius: v })}
                min={0}
                max={20}
                step={1}
              />
            </FormField>
            <FormField label="Section Padding (px)">
              <RangeInput
                value={theme.sectionPadding ?? 80}
                onChange={(v) => handleUpdate({ sectionPadding: v })}
                min={40}
                max={160}
                step={4}
              />
            </FormField>
            <FormField label="Max Content Width (px)">
              <RangeInput
                value={theme.maxWidth ?? 1200}
                onChange={(v) => handleUpdate({ maxWidth: v })}
                min={800}
                max={1600}
                step={20}
              />
            </FormField>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                persistMutation.mutate(theme);
                setToast("Theme saved");
              }}
              loading={persistMutation.isPending}
            >
              <Save className="w-4 h-4" /> Save Theme
            </Button>
          </div>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
