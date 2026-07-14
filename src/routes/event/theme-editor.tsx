import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import {
  THEME_PRESETS,
  RICH_FONT_OPTIONS,
  HEADING_FONT_OPTIONS,
  type ThemeConfig,
  type SimplifiedThemeConfig,
  fullToSimplifiedTheme,
  simplifiedToFullTheme,
} from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { ColorInput, FormField } from "../../components/ui";
import { cn } from "../../lib/utils";

const PRESET_NAMES = Object.keys(THEME_PRESETS);

// 6 main color pickers
const COLOR_FIELDS: { key: keyof ThemeConfig["colors"]; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "primaryHover", label: "Primary Hover" },
  { key: "accent", label: "Accent" },
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
];

export function ThemeEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const initialTheme: ThemeConfig = event.draft_theme
    ? simplifiedToFullTheme(event.draft_theme as unknown as SimplifiedThemeConfig)
    : THEME_PRESETS.default;

  const [theme, setTheme] = useState<ThemeConfig>(initialTheme);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const t: ThemeConfig = event.draft_theme
      ? simplifiedToFullTheme(event.draft_theme as unknown as SimplifiedThemeConfig)
      : THEME_PRESETS.default;
    setTheme(t);
  }, [event.draft_theme]);

  function applyPreset(name: string) {
    const preset = THEME_PRESETS[name];
    if (preset) {
      setTheme(preset);
      setActivePreset(name);
    }
  }

  function updateColor(key: keyof ThemeConfig["colors"], value: string) {
    setTheme((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
    setActivePreset(null);
  }

  function updateFont(key: keyof ThemeConfig["fonts"], value: string) {
    setTheme((prev) => ({ ...prev, fonts: { ...prev.fonts, [key]: value } }));
    setActivePreset(null);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const simplified = fullToSimplifiedTheme(theme);
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: simplified as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  // Build a preview style
  const previewStyle: React.CSSProperties = {
    backgroundColor: theme.colors.bg,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    borderRadius: theme.radius,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Theme Editor</h2>
          <p className="text-sm text-dash-muted mt-1">
            Choose a preset or customize your colors and fonts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveMutation.isError && (
            <span className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </span>
          )}
          {savedMsg && <span className="text-sm text-green-600">Saved!</span>}
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Theme
          </Button>
        </div>
      </div>

      {/* Presets */}
      <div>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Presets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PRESET_NAMES.map((name) => {
            const preset = THEME_PRESETS[name];
            return (
              <button
                key={name}
                type="button"
                onClick={() => applyPreset(name)}
                className={cn(
                  "rounded-lg border-2 p-3 text-left transition-all hover:shadow-md",
                  activePreset === name
                    ? "border-dash-primary ring-2 ring-dash-primary"
                    : "border-dash-border",
                )}
              >
                <div
                  className="h-16 rounded mb-2 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${preset.colors.bg}, ${preset.colors.surface})`,
                    border: `1px solid ${preset.colors.border}`,
                  }}
                >
                  <span
                    style={{
                      color: preset.colors.heading,
                      fontFamily: preset.fonts.heading,
                      fontSize: "14px",
                      fontWeight: 700,
                    }}
                  >
                    {name}
                  </span>
                </div>
                <div className="flex gap-1">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: preset.colors.primary }}
                  />
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: preset.colors.accent }}
                  />
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: preset.colors.text }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Colors</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COLOR_FIELDS.map((field) => (
            <ColorInput
              key={field.key}
              label={field.label}
              value={theme.colors[field.key]}
              onChange={(v) => updateColor(field.key, v)}
            />
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Fonts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Heading Font">
            <select
              value={theme.fonts.heading}
              onChange={(e) => updateFont("heading", e.target.value)}
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
            >
              {HEADING_FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Body Font">
            <select
              value={theme.fonts.body}
              onChange={(e) => updateFont("body", e.target.value)}
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
            >
              {RICH_FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {/* Preview */}
      <div>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Preview</h3>
        <div className="rounded-lg border border-dash-border p-6" style={previewStyle}>
          <h4
            style={{
              color: theme.colors.heading,
              fontFamily: theme.fonts.heading,
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            Your Heading
          </h4>
          <p
            className="mt-2"
            style={{
              color: theme.colors.muted,
              fontFamily: theme.fonts.body,
            }}
          >
            This is how your body text will look. Beautiful and elegant.
          </p>
          <button
            type="button"
            className="mt-4 px-4 py-2 rounded font-medium"
            style={{
              background: theme.colors.primary,
              color: theme.colors.primaryFg,
              borderRadius: theme.radius,
            }}
          >
            Primary Button
          </button>
        </div>
      </div>
    </div>
  );
}
