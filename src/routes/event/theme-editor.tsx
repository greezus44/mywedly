import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import { DEFAULT_THEME, THEME_PRESETS, FONT_OPTIONS, themeToEventCssVars } from "../../lib/theme";
import { EventThemeProvider, useEventTheme } from "../../lib/theme-context";
import { Card, FormField, ColorInput, RangeInput } from "../../components/ui";
import { Select } from "../../components/ui/Input";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Toast } from "../../components/ui";
import { cn } from "../../lib/utils";

interface OutletContext { event: UserEvent; }

/**
 * ThemedHomePreview — wraps HomePreview in EventThemeProvider so the preview
 * pane reflects the local theme. The editor form itself is NOT affected.
 */
function ThemedHomePreview({ event, theme }: { event: UserEvent; theme: ThemeConfig }) {
  const previewEvent: UserEvent = { ...event, draft_theme: theme };
  return (
    <EventThemeProvider initialTheme={theme}>
      <HomePreview event={previewEvent} />
    </EventThemeProvider>
  );
}

export default function ThemeEditorPage() {
  const { event } = useOutletContext<OutletContext>();
  const queryClient = useQueryClient();
  const [localTheme, setLocalTheme] = useState<ThemeConfig>(
    (event.draft_theme || event.theme || DEFAULT_THEME) as ThemeConfig
  );
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalTheme((event.draft_theme || event.theme || DEFAULT_THEME) as ThemeConfig);
  }, [event.draft_theme, event.theme]);

  const saveMutation = useMutation({
    mutationFn: async (theme: ThemeConfig) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: theme, updated_at: new Date().toISOString() })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ msg: "Theme saved", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Save failed: ${err.message}`, type: "error" });
    },
  });

  // Update local theme instantly for preview, debounce persist to DB
  const updateTheme = (partial: Partial<ThemeConfig>) => {
    const newTheme = { ...localTheme, ...partial };
    setLocalTheme(newTheme);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate(newTheme);
    }, 600);
  };

  const applyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) {
      const newTheme = { ...preset, preset: presetKey };
      setLocalTheme(newTheme);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveMutation.mutate(newTheme);
      }, 600);
    }
  };

  return (
    <>
      <SplitEditor
        preview={<ThemedHomePreview event={event} theme={localTheme} />}
      >
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-gray-900">Theme Customizer</h2>
            <p className="text-sm text-gray-500 mt-1">Customize the visual style of your event. Changes preview instantly.</p>
          </div>

          {/* Preset Selector — fixed gray dashboard styling */}
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Theme Presets</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className={cn(
                    "p-3 border-2 rounded-lg text-left transition-all",
                    localTheme.preset === key
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  )}
                >
                  <div className="flex gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: preset.primaryColor }} />
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: preset.secondaryColor }} />
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: preset.accentColor }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 capitalize">{key}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Colors — fixed gray dashboard styling */}
          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Colors</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Primary Color">
                <ColorInput
                  value={localTheme.primaryColor || DEFAULT_THEME.primaryColor!}
                  onChange={(v) => updateTheme({ primaryColor: v })}
                />
              </FormField>
              <FormField label="Secondary Color">
                <ColorInput
                  value={localTheme.secondaryColor || DEFAULT_THEME.secondaryColor!}
                  onChange={(v) => updateTheme({ secondaryColor: v })}
                />
              </FormField>
              <FormField label="Accent Color">
                <ColorInput
                  value={localTheme.accentColor || DEFAULT_THEME.accentColor!}
                  onChange={(v) => updateTheme({ accentColor: v })}
                />
              </FormField>
              <FormField label="Background Color">
                <ColorInput
                  value={localTheme.bgColor || DEFAULT_THEME.bgColor!}
                  onChange={(v) => updateTheme({ bgColor: v })}
                />
              </FormField>
              <FormField label="Surface Color">
                <ColorInput
                  value={localTheme.surfaceColor || DEFAULT_THEME.surfaceColor!}
                  onChange={(v) => updateTheme({ surfaceColor: v })}
                />
              </FormField>
              <FormField label="Border Color">
                <ColorInput
                  value={localTheme.borderColor || DEFAULT_THEME.borderColor!}
                  onChange={(v) => updateTheme({ borderColor: v })}
                />
              </FormField>
              <FormField label="Text Color">
                <ColorInput
                  value={localTheme.textColor || DEFAULT_THEME.textColor!}
                  onChange={(v) => updateTheme({ textColor: v })}
                />
              </FormField>
              <FormField label="Muted Text Color">
                <ColorInput
                  value={localTheme.textMutedColor || DEFAULT_THEME.textMutedColor!}
                  onChange={(v) => updateTheme({ textMutedColor: v })}
                />
              </FormField>
            </div>
          </Card>

          {/* Fonts — fixed gray dashboard styling */}
          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Fonts</h3>
            <FormField label="Heading Font">
              <Select
                value={localTheme.headingFont || DEFAULT_THEME.headingFont}
                onChange={(e) => updateTheme({ headingFont: e.target.value })}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Body Font">
              <Select
                value={localTheme.bodyFont || DEFAULT_THEME.bodyFont}
                onChange={(e) => updateTheme({ bodyFont: e.target.value })}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Script Font">
              <Select
                value={localTheme.scriptFont || DEFAULT_THEME.scriptFont}
                onChange={(e) => updateTheme({ scriptFont: e.target.value })}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
            </FormField>
          </Card>

          {/* Layout Controls — fixed gray dashboard styling */}
          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Layout</h3>
            <RangeInput
              label="Button Radius (px)"
              value={localTheme.buttonRadius ?? 2}
              min={0}
              max={24}
              step={1}
              onChange={(v) => updateTheme({ buttonRadius: v })}
            />
            <FormField label="Shadow Style">
              <Select
                value={localTheme.shadowStyle || "none"}
                onChange={(e) => updateTheme({ shadowStyle: e.target.value })}
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </Select>
            </FormField>
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
