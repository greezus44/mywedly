import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  type ThemeConfig,
  type SimplifiedThemeConfig,
  type FontOption,
  THEME_PRESETS,
  HEADING_FONT_OPTIONS,
  simplifiedToFullTheme,
  fullToSimplifiedTheme,
  jsonToTheme,
} from "../../lib/theme";
import { ColorInput, RangeInput, FontSelect, FormField, LoadingSpinner } from "../../components/ui";
import { cn } from "../../lib/utils";

const WEIGHTS = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Bold", value: 700 },
];

export function ThemeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<ThemeConfig>(() => jsonToTheme(event.draft_theme ?? event.theme));
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    setTheme(jsonToTheme(event.draft_theme ?? event.theme));
  }, [event.draft_theme, event.theme]);

  function update<K extends keyof SimplifiedThemeConfig>(key: K, val: SimplifiedThemeConfig[K]) {
    const simplified = fullToSimplifiedTheme(theme);
    const updated = { ...simplified, [key]: val };
    setTheme(simplifiedToFullTheme(updated));
  }

  function updateButton<K extends keyof NonNullable<ThemeConfig["button"]>>(key: K, val: NonNullable<ThemeConfig["button"]>[K]) {
    setTheme((prev) => ({
      ...prev,
      button: { ...prev.button, [key]: val },
    }));
  }

  const applyPreset = (preset: ThemeConfig) => {
    setTheme({ ...preset, button: theme.button });
  };

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
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Theme Editor</h2>
          <p className="text-sm text-dash-muted">Customise colours, fonts, and button styling.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          {savedMsg ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
        </p>
      )}

      {/* Theme Presets */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Theme Presets</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset.theme)}
              className={cn(
                "rounded-lg border-2 p-3 text-left transition-all hover:shadow-md",
                theme.colors.bg === preset.theme.colors.bg ? "border-dash-primary" : "border-dash-border"
              )}
            >
              <div className="mb-2 flex gap-1">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.theme.colors.primary }} />
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.theme.colors.accent }} />
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.theme.colors.bg }} />
              </div>
              <span className="text-xs font-medium text-dash-text">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Colours */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Colours</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ColorInput label="Background" value={theme.colors.bg} onChange={(v) => update("bg", v)} />
          <ColorInput label="Surface" value={theme.colors.surface} onChange={(v) => update("surface", v)} />
          <ColorInput label="Border" value={theme.colors.border} onChange={(v) => update("border", v)} />
          <ColorInput label="Text" value={theme.colors.text} onChange={(v) => update("text", v)} />
          <ColorInput label="Heading" value={theme.colors.heading} onChange={(v) => update("heading", v)} />
          <ColorInput label="Muted Text" value={theme.colors.muted} onChange={(v) => update("muted", v)} />
          <ColorInput label="Primary" value={theme.colors.primary} onChange={(v) => update("primary", v)} />
          <ColorInput label="Primary Hover" value={theme.colors.primaryHover} onChange={(v) => update("primaryHover", v)} />
          <ColorInput label="Primary Foreground" value={theme.colors.primaryFg} onChange={(v) => update("primaryFg", v)} />
          <ColorInput label="Accent" value={theme.colors.accent} onChange={(v) => update("accent", v)} />
        </div>
      </div>

      {/* Fonts */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Fonts</h3>
        <div className="space-y-4">
          <FontSelect
            label="Heading Font"
            options={HEADING_FONT_OPTIONS}
            value={theme.fonts.heading}
            onChange={(v) => update("headingFont", v)}
          />
          <FontSelect
            label="Body Font"
            options={HEADING_FONT_OPTIONS}
            value={theme.fonts.body}
            onChange={(v) => update("bodyFont", v)}
          />
          <FontSelect
            label="Rich Text Font"
            options={HEADING_FONT_OPTIONS}
            value={theme.fonts.rich}
            onChange={(v) => update("richFont", v)}
          />
          <RangeInput
            label="Font Scale"
            min={0.8}
            max={1.5}
            step={0.05}
            value={theme.fontScale}
            onChange={(e) => update("fontScale", parseFloat(e.target.value))}
          />
          <FormField label="Border Radius">
            <input
              type="text"
              value={theme.radius}
              onChange={(e) => update("radius", e.target.value)}
              className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text"
              placeholder="0.5rem"
            />
          </FormField>
        </div>
      </div>

      {/* Button Styling */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Button Styling</h3>
        <div className="space-y-4">
          <ColorInput
            label="Button Text Colour"
            value={theme.button?.color ?? theme.colors.primaryFg}
            onChange={(v) => updateButton("color", v)}
          />
          <ColorInput
            label="Button BG Colour"
            value={theme.button?.bgColor ?? theme.colors.primary}
            onChange={(v) => updateButton("bgColor", v)}
          />
          <ColorInput
            label="Button BG Hover Colour"
            value={theme.button?.bgColorHover ?? theme.colors.primaryHover}
            onChange={(v) => updateButton("bgColorHover", v)}
          />
          <FontSelect
            label="Button Label Font Family"
            options={HEADING_FONT_OPTIONS}
            value={theme.button?.fontFamily ?? theme.fonts.heading}
            onChange={(v) => updateButton("fontFamily", v)}
          />
          <FormField label="Button Label Font Size">
            <input
              type="text"
              value={theme.button?.fontSize ?? "0.875rem"}
              onChange={(e) => updateButton("fontSize", e.target.value)}
              className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text"
              placeholder="0.875rem"
            />
          </FormField>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-dash-text">Button Font Weight</span>
            <div className="flex gap-2">
              {WEIGHTS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => updateButton("fontWeight", w.value)}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                    (theme.button?.fontWeight ?? 600) === w.value
                      ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                      : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg"
                  )}
                  style={{ fontWeight: w.value }}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
          {/* Live button preview */}
          <div className="rounded-md border border-dash-border bg-dash-bg p-4 text-center">
            <button
              type="button"
              className="rounded-md px-6 py-3 text-sm font-medium uppercase tracking-wider transition-all"
              style={{
                backgroundColor: theme.button?.bgColor ?? theme.colors.primary,
                color: theme.button?.color ?? theme.colors.primaryFg,
                fontFamily: theme.button?.fontFamily ?? theme.fonts.heading,
                fontSize: theme.button?.fontSize ?? "0.875rem",
                fontWeight: theme.button?.fontWeight ?? 600,
              }}
            >
              Enter Site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
