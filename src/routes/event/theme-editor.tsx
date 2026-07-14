import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { ColorInput } from "../../components/ui";
import { FontSelect } from "../../components/ui/FontSelect";
import {
  THEME_PRESETS,
  HEADING_FONT_OPTIONS,
  jsonToTheme,
  fullToSimplifiedTheme,
  simplifiedToFullTheme,
  type SimplifiedThemeConfig,
  type ThemeConfig,
} from "../../lib/theme";
import { cn } from "../../lib/utils";

const FONT_SIZE_OPTIONS = [
  { label: "Small (0.75rem)", value: "0.75rem" },
  { label: "Medium (0.875rem)", value: "0.875rem" },
  { label: "Large (1rem)", value: "1rem" },
  { label: "Extra Large (1.125rem)", value: "1.125rem" },
];

const WEIGHT_OPTIONS = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Bold", value: 700 },
];

export function ThemeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const currentTheme = jsonToTheme(event.draft_theme);
  const [theme, setTheme] = useState<SimplifiedThemeConfig>(fullToSimplifiedTheme(currentTheme));

  function update<K extends keyof SimplifiedThemeConfig>(key: K, val: SimplifiedThemeConfig[K]) {
    setTheme((prev) => ({ ...prev, [key]: val }));
  }

  function applyPreset(presetTheme: ThemeConfig) {
    setTheme(fullToSimplifiedTheme(presetTheme));
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fullTheme = simplifiedToFullTheme(theme);
      const { error } = await supabase
        .from("events")
        .update({ draft_theme: fullTheme as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Presets */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-dash-text">Theme Presets</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEME_PRESETS.map((preset) => {
            const isSelected =
              theme.bg === preset.theme.colors.bg &&
              theme.primary === preset.theme.colors.primary;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset.theme)}
                className={cn(
                  "rounded-lg border-2 p-3 text-left transition-colors",
                  isSelected
                    ? "border-dash-primary"
                    : "border-dash-border hover:border-dash-primary/50"
                )}
              >
                <div
                  className="mb-2 flex gap-1"
                >
                  <span className="h-6 w-6 rounded" style={{ background: preset.theme.colors.bg }} />
                  <span className="h-6 w-6 rounded" style={{ background: preset.theme.colors.primary }} />
                  <span className="h-6 w-6 rounded" style={{ background: preset.theme.colors.accent }} />
                </div>
                <span className="text-sm font-medium text-dash-text">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colours */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-dash-text">Colours</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <ColorInput label="Background" value={theme.bg} onChange={(v) => update("bg", v)} />
          <ColorInput label="Surface" value={theme.surface} onChange={(v) => update("surface", v)} />
          <ColorInput label="Surface Alt" value={theme.surfaceAlt} onChange={(v) => update("surfaceAlt", v)} />
          <ColorInput label="Border" value={theme.border} onChange={(v) => update("border", v)} />
          <ColorInput label="Text" value={theme.text} onChange={(v) => update("text", v)} />
          <ColorInput label="Heading" value={theme.heading} onChange={(v) => update("heading", v)} />
          <ColorInput label="Muted" value={theme.muted} onChange={(v) => update("muted", v)} />
          <ColorInput label="Primary" value={theme.primary} onChange={(v) => update("primary", v)} />
          <ColorInput label="Primary Hover" value={theme.primaryHover} onChange={(v) => update("primaryHover", v)} />
          <ColorInput label="Primary Foreground" value={theme.primaryFg} onChange={(v) => update("primaryFg", v)} />
          <ColorInput label="Accent" value={theme.accent} onChange={(v) => update("accent", v)} />
        </div>
      </div>

      {/* Fonts */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-dash-text">Fonts</h2>
        <div className="space-y-4">
          <FontSelect
            label="Heading font"
            value={theme.headingFont}
            onChange={(v) => update("headingFont", v)}
            options={HEADING_FONT_OPTIONS}
          />
          <FontSelect
            label="Body font"
            value={theme.bodyFont}
            onChange={(v) => update("bodyFont", v)}
            options={HEADING_FONT_OPTIONS}
          />
          <FontSelect
            label="Rich text font"
            value={theme.richFont}
            onChange={(v) => update("richFont", v)}
            options={HEADING_FONT_OPTIONS}
          />
        </div>
      </div>

      {/* Layout */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-dash-text">Layout</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Border radius"
            type="text"
            value={theme.radius}
            onChange={(e) => update("radius", e.target.value)}
            placeholder="0.5rem"
          />
          <Input
            label="Font scale"
            type="number"
            step="0.1"
            min="0.5"
            max="2"
            value={theme.fontScale}
            onChange={(e) => update("fontScale", Number(e.target.value))}
          />
        </div>
      </div>

      {/* Button Styling */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-dash-text">Button Styling</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ColorInput
              label="Button Text Colour"
              value={theme.buttonColor ?? ""}
              onChange={(v) => update("buttonColor", v)}
            />
            <ColorInput
              label="Button Background Colour"
              value={theme.buttonBgColor ?? ""}
              onChange={(v) => update("buttonBgColor", v)}
            />
            <ColorInput
              label="Button Background Hover Colour"
              value={theme.buttonBgColorHover ?? ""}
              onChange={(v) => update("buttonBgColorHover", v)}
            />
          </div>
          <FontSelect
            label="Button Label Font Family"
            value={theme.buttonFontFamily ?? ""}
            onChange={(v) => update("buttonFontFamily", v)}
            options={HEADING_FONT_OPTIONS}
          />
          <Select
            label="Button Label Font Size"
            value={theme.buttonFontSize ?? "0.875rem"}
            onChange={(e) => update("buttonFontSize", e.target.value)}
          >
            {FONT_SIZE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-dash-text">Button Font Weight</span>
            <div className="flex gap-1">
              {WEIGHT_OPTIONS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => update("buttonFontWeight", w.value)}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors",
                    (theme.buttonFontWeight ?? 600) === w.value
                      ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                      : "border-dash-border text-dash-text hover:bg-dash-bg"
                  )}
                  style={{ fontWeight: w.value }}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <Button
        onClick={() => saveMutation.mutate()}
        loading={saveMutation.isPending}
        disabled={saveMutation.isPending}
        className="w-full"
      >
        Save Theme
      </Button>
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Theme saved successfully!</p>
      )}
      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed."}
        </p>
      )}
    </div>
  );
}
