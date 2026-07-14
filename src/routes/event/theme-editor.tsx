import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { EventThemeProvider } from "../../lib/theme-context";
import {
  THEME_PRESETS,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
  type ThemeConfig,
  type SimplifiedThemeConfig,
  fullToSimplifiedTheme,
  simplifiedToFullTheme,
} from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { ColorInput, RangeInput } from "../../components/ui";
import { cn } from "../../lib/utils";

const PRESET_NAMES = Object.keys(THEME_PRESETS);

const COLOR_FIELDS: { key: keyof ThemeConfig["colors"]; label: string }[] = [
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "primary", label: "Primary" },
  { key: "primaryHover", label: "Primary Hover" },
  { key: "accent", label: "Accent" },
  { key: "heading", label: "Heading Text" },
];

export function ThemeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const draftTheme = event.draft_theme ?? event.theme;
  const initialFull = simplifiedToFullTheme(
    fullToSimplifiedTheme(draftTheme as ThemeConfig | null)
  );

  const [theme, setTheme] = useState<ThemeConfig>(initialFull);

  useEffect(() => {
    setTheme(
      simplifiedToFullTheme(
        fullToSimplifiedTheme(draftTheme as ThemeConfig | null)
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.updated_at]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const simplified: SimplifiedThemeConfig = fullToSimplifiedTheme(theme);
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_theme: simplified as unknown as Json,
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
    setTheme(THEME_PRESETS[presetName]);
  };

  const updateColor = (key: keyof ThemeConfig["colors"], value: string) => {
    setTheme((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  };

  const updateFont = (key: keyof ThemeConfig["fonts"], value: string) => {
    setTheme((prev) => ({
      ...prev,
      fonts: { ...prev.fonts, [key]: value },
    }));
  };

  return (
    <SplitEditor
      editor={
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-dash-text">Theme Editor</h2>

          {/* Presets */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-dash-text">Theme Presets</p>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => applyPreset(name)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm capitalize transition-colors",
                    theme.colors.bg === THEME_PRESETS[name].colors.bg
                      ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                      : "border-dash-border text-dash-text hover:bg-dash-bg"
                  )}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-dash-border"
                    style={{ backgroundColor: THEME_PRESETS[name].colors.primary }}
                  />
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-dash-text">Colors</p>
            <div className="grid grid-cols-2 gap-3">
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
          <div className="space-y-3">
            <p className="text-sm font-medium text-dash-text">Fonts</p>
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

          {/* Radius */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-dash-text">Corner Radius</p>
            <RangeInput
              label="Radius"
              min={0}
              max={20}
              value={parseFloat(theme.radius) || 0}
              onChange={(v) => setTheme((p) => ({ ...p, radius: `${v}px` }))}
            />
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            className="w-full"
          >
            Save Theme
          </Button>
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </p>
          )}
          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Theme saved!</p>
          )}
        </div>
      }
      preview={
        <EventThemeProvider theme={theme as unknown as Json}>
          <div className="space-y-6 p-4">
            <h1 className="guest-title">Preview</h1>
            <p className="guest-subtitle">
              This is how your invitation website will look with the selected theme.
            </p>
            <button type="button" className="event-btn-primary">
              Primary Button
            </button>
            <button type="button" className="event-btn-secondary">
              Secondary Button
            </button>
            <div className="event-card">
              <h2>Sample Card</h2>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore.
              </p>
            </div>
            <div className="event-input">Input field preview</div>
          </div>
        </EventThemeProvider>
      }
    />
  );
}
