import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, ColorInput, Select, RangeInput } from "../../components/ui";
import {
  THEME_PRESETS,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
  type ThemeConfig,
} from "../../lib/theme";
import { cn } from "../../lib/utils";

const presetNames = Object.keys(THEME_PRESETS);

const colorFields: { key: keyof ThemeConfig["colors"]; label: string }[] = [
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "border", label: "Border" },
  { key: "text", label: "Text" },
  { key: "primary", label: "Primary" },
  { key: "accent", label: "Accent" },
];

export function ThemeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<ThemeConfig>(
    (event.draft_theme as unknown as ThemeConfig) ?? THEME_PRESETS.default,
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_theme: theme as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const applyPreset = (presetName: string) => {
    const preset = THEME_PRESETS[presetName];
    if (preset) setTheme(preset);
  };

  const updateColor = (key: keyof ThemeConfig["colors"], value: string) => {
    setTheme((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  };

  const updateFont = (key: "heading" | "body" | "rich", value: string) => {
    setTheme((prev) => ({
      ...prev,
      fonts: { ...prev.fonts, [key]: value },
    }));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Theme Editor</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Choose a preset or customise colors and fonts for your invitation website.
        </p>
      </div>

      {/* Presets */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Theme Presets</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {presetNames.map((name) => {
            const preset = THEME_PRESETS[name];
            return (
              <button
                key={name}
                type="button"
                onClick={() => applyPreset(name)}
                className={cn(
                  "rounded-lg border-2 p-3 text-left transition-colors",
                  JSON.stringify(theme.colors) === JSON.stringify(preset.colors) &&
                    theme.fonts.heading === preset.fonts.heading
                    ? "border-dash-primary"
                    : "border-dash-border hover:border-dash-primary/50",
                )}
              >
                <div className="flex gap-1">
                  <div
                    className="h-6 w-6 rounded-full border border-dash-border"
                    style={{ backgroundColor: preset.colors.bg }}
                  />
                  <div
                    className="h-6 w-6 rounded-full border border-dash-border"
                    style={{ backgroundColor: preset.colors.primary }}
                  />
                  <div
                    className="h-6 w-6 rounded-full border border-dash-border"
                    style={{ backgroundColor: preset.colors.accent }}
                  />
                </div>
                <p className="mt-2 text-xs font-medium capitalize text-dash-text">{name}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Colors */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Colors</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {colorFields.map((field) => (
            <ColorInput
              key={field.key}
              label={field.label}
              value={theme.colors[field.key]}
              onChange={(v) => updateColor(field.key, v)}
            />
          ))}
        </div>
      </Card>

      {/* Fonts */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Fonts</h3>
        <div className="space-y-4">
          <Select
            label="Heading Font"
            value={theme.fonts.heading}
            onChange={(e) => updateFont("heading", e.target.value)}
          >
            {HEADING_FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Select
            label="Body Font"
            value={theme.fonts.body}
            onChange={(e) => updateFont("body", e.target.value)}
          >
            {RICH_FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Font Scale */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Font Scale</h3>
        <RangeInput
          label="Font Scale"
          value={theme.fontScale ?? 1}
          onChange={(v) => setTheme((prev) => ({ ...prev, fontScale: v }))}
          min={0.8}
          max={1.4}
          step={0.05}
        />
      </Card>

      {/* Save */}
      <div className="space-y-2">
        {saveMutation.isError && (
          <p className="text-sm text-dash-danger">
            Error: {(saveMutation.error as Error)?.message}
          </p>
        )}
        {saveMutation.isSuccess && (
          <p className="text-sm text-green-600">Theme saved successfully!</p>
        )}
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Theme
        </Button>
      </div>
    </div>
  );
}
