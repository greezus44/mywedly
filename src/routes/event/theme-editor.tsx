import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { ColorInput, RangeInput, FormField } from "../../components/ui";
import { Select } from "../../components/ui/Input";
import { cn } from "../../lib/utils";
import {
  THEME_PRESETS,
  DEFAULT_THEME,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
  type SimplifiedThemeConfig,
  type ThemeConfig,
} from "../../lib/theme";

const PRESET_NAMES = Object.keys(THEME_PRESETS);

const COLOR_FIELDS: { key: keyof ThemeConfig["colors"]; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "primaryHover", label: "Primary Hover" },
  { key: "accent", label: "Accent" },
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
];

export const ThemeEditor: React.FC = () => {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<SimplifiedThemeConfig>(() => {
    if (!event.draft_theme || typeof event.draft_theme !== "object") return {};
    return event.draft_theme as unknown as SimplifiedThemeConfig;
  });
  const [saved, setSaved] = useState(false);

  const currentTheme: ThemeConfig = {
    colors: { ...DEFAULT_THEME.colors, ...theme.colors },
    fonts: { ...DEFAULT_THEME.fonts, ...theme.fonts },
    radius: theme.radius ?? DEFAULT_THEME.radius,
    fontScale: theme.fontScale ?? DEFAULT_THEME.fontScale,
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_theme: theme as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const applyPreset = (presetName: string) => {
    const preset = THEME_PRESETS[presetName];
    if (!preset) return;
    setTheme({
      colors: { ...preset.colors },
      fonts: { ...preset.fonts },
      radius: preset.radius,
      fontScale: preset.fontScale,
    });
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Theme Editor</h2>
          <p className="text-sm text-dash-muted">Customize colors, fonts, and styling.</p>
        </div>
        <Button onClick={handleSave} loading={saveMutation.isPending} disabled={saveMutation.isPending}>
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          Error: {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Controls */}
        <div className="space-y-6">
          {/* Presets */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Presets</h3>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_NAMES.map((name) => {
                const preset = THEME_PRESETS[name];
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => applyPreset(name)}
                    className={cn(
                      "rounded-lg border-2 p-2 transition-all hover:scale-105",
                      "border-dash-border hover:border-dash-primary",
                    )}
                    title={name}
                  >
                    <div
                      className="mb-1 h-8 w-full rounded"
                      style={{ backgroundColor: preset.colors.primary }}
                    />
                    <span className="block truncate text-xs capitalize text-dash-muted">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-dash-border" />

          {/* Colors */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Colors</h3>
            <div className="grid grid-cols-2 gap-3">
              {COLOR_FIELDS.map((field) => (
                <ColorInput
                  key={field.key}
                  label={field.label}
                  value={currentTheme.colors[field.key]}
                  onChange={(value) => updateColor(field.key, value)}
                />
              ))}
            </div>
          </div>

          <hr className="border-dash-border" />

          {/* Fonts */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Fonts</h3>
            <div className="space-y-3">
              <FormField label="Heading font">
                <Select
                  value={currentTheme.fonts.heading}
                  onChange={(e) => updateFont("heading", e.target.value)}
                >
                  {HEADING_FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>{font.split(",")[0]}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Body font">
                <Select
                  value={currentTheme.fonts.body}
                  onChange={(e) => updateFont("body", e.target.value)}
                >
                  {RICH_FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>{font.split(",")[0]}</option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>

          <hr className="border-dash-border" />

          {/* Radius & Scale */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Layout</h3>
            <div className="space-y-4">
              <FormField label="Border radius">
                <Select
                  value={currentTheme.radius}
                  onChange={(e) => setTheme((prev) => ({ ...prev, radius: e.target.value }))}
                >
                  <option value="0rem">None</option>
                  <option value="0.25rem">Small</option>
                  <option value="0.375rem">Medium</option>
                  <option value="0.5rem">Default</option>
                  <option value="0.625rem">Large</option>
                  <option value="0.75rem">Extra Large</option>
                  <option value="0.875rem">2XL</option>
                  <option value="1rem">3XL</option>
                </Select>
              </FormField>
              <RangeInput
                label="Font scale"
                value={currentTheme.fontScale}
                min={0.8}
                max={1.5}
                step={0.05}
                onChange={(value) => setTheme((prev) => ({ ...prev, fontScale: value }))}
                format={(v) => `${(v * 100).toFixed(0)}%`}
              />
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="rounded-lg border border-dash-border bg-dash-bg p-4">
          <h3 className="mb-3 text-sm font-semibold text-dash-text">Preview</h3>
          <div
            className="overflow-hidden rounded-lg border"
            style={{
              backgroundColor: currentTheme.colors.bg,
              borderColor: currentTheme.colors.border,
              fontFamily: currentTheme.fonts.body,
              color: currentTheme.colors.text,
              borderRadius: currentTheme.radius,
            }}
          >
            <div className="p-6">
              <p
                style={{
                  color: currentTheme.colors.muted,
                  fontSize: `${currentTheme.fontScale * 0.875}rem`,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Our Wedding
              </p>
              <h1
                style={{
                  color: currentTheme.colors.heading,
                  fontFamily: currentTheme.fonts.heading,
                  fontSize: `${currentTheme.fontScale * 2}rem`,
                  fontWeight: 700,
                  marginTop: "0.5rem",
                }}
              >
                Jane &amp; John
              </h1>
              <p style={{ color: currentTheme.colors.muted, marginTop: "0.5rem" }}>
                Saturday, June 15, 2025 at 4:00 PM
              </p>
              <div
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  border: `1px solid ${currentTheme.colors.border}`,
                  borderRadius: currentTheme.radius,
                  padding: "1rem",
                  marginTop: "1.5rem",
                }}
              >
                <p style={{ color: currentTheme.colors.heading, fontWeight: 600 }}>
                  Grand Ballroom Hotel
                </p>
                <p style={{ color: currentTheme.colors.muted, fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  123 Main Street, New York
                </p>
              </div>
              <button
                style={{
                  backgroundColor: currentTheme.colors.primary,
                  color: currentTheme.colors.primaryFg,
                  borderRadius: currentTheme.radius,
                  padding: "0.625rem 1.5rem",
                  fontWeight: 600,
                  marginTop: "1.5rem",
                  width: "100%",
                }}
              >
                RSVP Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
