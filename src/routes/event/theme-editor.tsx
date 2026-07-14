import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { ColorInput, Select, RangeInput } from "../../components/ui";
import { EventThemeProvider } from "../../lib/theme-context";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import {
  THEME_PRESETS,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
  type ThemeConfig,
} from "../../lib/theme";
import { cn } from "../../lib/utils";

export default function ThemeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const currentTheme = (event.theme ?? {}) as Partial<ThemeConfig>;
  const [theme, setTheme] = useState<ThemeConfig>({
    bg: currentTheme.bg ?? "#fffbeb",
    surface: currentTheme.surface ?? "#ffffff",
    surfaceAlt: currentTheme.surfaceAlt ?? "rgba(255,255,255,0.08)",
    border: currentTheme.border ?? "#fde68a",
    text: currentTheme.text ?? "#78350f",
    heading: currentTheme.heading ?? "#78350f",
    muted: currentTheme.muted ?? "#92400e",
    primary: currentTheme.primary ?? "#b45309",
    primaryHover: currentTheme.primaryHover ?? "#92400e",
    primaryFg: currentTheme.primaryFg ?? "#ffffff",
    accent: currentTheme.accent ?? "#d97706",
    fontHeading: currentTheme.fontHeading ?? "Georgia, serif",
    fontBody: currentTheme.fontBody ?? "Georgia, serif",
    fontRich: currentTheme.fontRich ?? "Georgia, serif",
    radius: currentTheme.radius ?? "0.5rem",
    fontScale: currentTheme.fontScale ?? 1,
  });

  function updateTheme<K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) {
    setTheme((prev) => ({ ...prev, [key]: value }));
  }

  function applyPreset(presetTheme: ThemeConfig) {
    setTheme({ ...presetTheme });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: theme as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dash-text">Theme Editor</h2>
          <p className="text-sm text-dash-muted">Customize the look and feel of your website.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Error saving: {saveMutation.error?.message}
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          Theme saved successfully!
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Editor panel */}
        <div className="lg:w-1/2 space-y-6">
          {/* Presets */}
          <div>
            <label className="block text-sm font-medium text-dash-text mb-2">Presets</label>
            <div className="grid grid-cols-5 gap-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset.theme)}
                  className={cn(
                    "rounded-md border-2 p-2 text-center transition-all",
                    theme.primary === preset.theme.primary
                      ? "border-dash-primary ring-1 ring-dash-primary"
                      : "border-dash-border hover:border-dash-primary/50"
                  )}
                  title={preset.label}
                >
                  <div
                    className="mx-auto mb-1 h-6 w-6 rounded-full"
                    style={{ backgroundColor: preset.theme.primary }}
                  />
                  <span className="text-[10px] text-dash-muted">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-dash-text mb-2">Colors</label>
            <div className="grid grid-cols-2 gap-3">
              <ColorInput
                label="Primary"
                value={theme.primary}
                onChange={(v) => updateTheme("primary", v)}
              />
              <ColorInput
                label="Accent"
                value={theme.accent}
                onChange={(v) => updateTheme("accent", v)}
              />
              <ColorInput
                label="Background"
                value={theme.bg}
                onChange={(v) => updateTheme("bg", v)}
              />
              <ColorInput
                label="Surface"
                value={theme.surface}
                onChange={(v) => updateTheme("surface", v)}
              />
              <ColorInput
                label="Text"
                value={theme.text}
                onChange={(v) => updateTheme("text", v)}
              />
              <ColorInput
                label="Border"
                value={theme.border}
                onChange={(v) => updateTheme("border", v)}
              />
            </div>
          </div>

          {/* Fonts */}
          <div>
            <label className="block text-sm font-medium text-dash-text mb-2">Fonts</label>
            <div className="space-y-3">
              <Select
                label="Heading Font"
                value={theme.fontHeading}
                onChange={(e) => updateTheme("fontHeading", e.target.value)}
              >
                {HEADING_FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Body Font"
                value={theme.fontBody}
                onChange={(e) => updateTheme("fontBody", e.target.value)}
              >
                {RICH_FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Scale & Radius */}
          <div>
            <label className="block text-sm font-medium text-dash-text mb-2">Layout</label>
            <div className="space-y-3">
              <RangeInput
                label="Font Scale"
                min={0.8}
                max={1.4}
                step={0.05}
                value={theme.fontScale}
                onChange={(v) => updateTheme("fontScale", v)}
              />
              <RangeInput
                label="Corner Radius"
                min={0}
                max={1.5}
                step={0.05}
                value={parseFloat(theme.radius) || 0.5}
                onChange={(v) => updateTheme("radius", `${v}rem`)}
              />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:w-1/2">
          <label className="block text-sm font-medium text-dash-text mb-2">Live Preview</label>
          <div className="rounded-lg border border-dash-border overflow-hidden">
            <EventThemeProvider theme={theme as unknown as Json}>
              <CoverPreview event={{ ...event, theme: theme as unknown as Json }} />
            </EventThemeProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
