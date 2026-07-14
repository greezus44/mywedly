import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { ColorInput, FormField, LoadingSpinner } from "../../components/ui";
import { Select } from "../../components/ui";
import {
  THEME_PRESETS,
  DEFAULT_THEME,
  type ThemeConfig,
  type SimplifiedThemeConfig,
  simplifiedToFullTheme,
  fullToSimplifiedTheme,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
} from "../../lib/theme";
import { cn } from "../../lib/utils";

const COLOR_FIELDS: { key: keyof SimplifiedThemeConfig; label: string }[] = [
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "border", label: "Border" },
  { key: "text", label: "Text" },
  { key: "heading", label: "Heading" },
  { key: "primary", label: "Primary" },
];

const PRESET_NAMES = Object.keys(THEME_PRESETS);

export function ThemeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const currentTheme = (event.draft_theme as SimplifiedThemeConfig) ?? {};
  const [theme, setTheme] = useState<SimplifiedThemeConfig>(currentTheme);

  useEffect(() => {
    setTheme((event.draft_theme as SimplifiedThemeConfig) ?? {});
  }, [event]);

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
    },
  });

  const applyPreset = (presetName: string) => {
    const preset = THEME_PRESETS[presetName];
    if (preset) {
      setTheme(fullToSimplifiedTheme(preset));
    }
  };

  const updateColor = (key: keyof SimplifiedThemeConfig, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const updateFont = (key: "headingFont" | "bodyFont", value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const fullTheme: ThemeConfig = simplifiedToFullTheme(theme);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Theme Editor</h2>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-red-600">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully!</p>
      )}

      {/* Presets */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">
          Theme Presets
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {PRESET_NAMES.map((name) => {
            const preset = THEME_PRESETS[name];
            return (
              <button
                key={name}
                onClick={() => applyPreset(name)}
                className={cn(
                  "rounded-md border-2 p-3 text-left transition-all hover:shadow-md",
                  "border-dash-border"
                )}
                style={{
                  backgroundColor: preset.colors.bg,
                  borderColor: preset.colors.border,
                }}
              >
                <div
                  className="mb-1 text-sm font-semibold"
                  style={{ color: preset.colors.heading }}
                >
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </div>
                <div className="flex gap-1">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: preset.colors.primary }}
                  />
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: preset.colors.accent }}
                  />
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: preset.colors.surface }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Color Pickers */}
        <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-dash-text">Colors</h3>
          <div className="space-y-3">
            {COLOR_FIELDS.map((field) => (
              <ColorInput
                key={field.key}
                label={field.label}
                value={(theme[field.key] as string) ?? ""}
                onChange={(v) => updateColor(field.key, v)}
              />
            ))}
          </div>
        </div>

        {/* Fonts */}
        <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-dash-text">Fonts</h3>
          <div className="space-y-4">
            <Select
              label="Heading Font"
              value={theme.headingFont ?? DEFAULT_THEME.fonts.heading}
              onChange={(e) => updateFont("headingFont", e.target.value)}
            >
              {HEADING_FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Select
              label="Body Font"
              value={theme.bodyFont ?? DEFAULT_THEME.fonts.body}
              onChange={(e) => updateFont("bodyFont", e.target.value)}
            >
              {RICH_FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: fullTheme.colors.bg,
          borderColor: fullTheme.colors.border,
          fontFamily: fullTheme.fonts.body,
        }}
      >
        <h3
          className="text-2xl font-bold"
          style={{
            color: fullTheme.colors.heading,
            fontFamily: fullTheme.fonts.heading,
          }}
        >
          Theme Preview
        </h3>
        <p className="mt-2" style={{ color: fullTheme.colors.text }}>
          This is how your event will look with the selected theme.
        </p>
        <div
          className="mt-4 inline-block rounded-md px-4 py-2"
          style={{
            backgroundColor: fullTheme.colors.primary,
            color: fullTheme.colors.primaryFg,
          }}
        >
          Primary Button
        </div>
        <div
          className="mt-4 rounded-md border p-4"
          style={{
            backgroundColor: fullTheme.colors.surface,
            borderColor: fullTheme.colors.border,
          }}
        >
          <p style={{ color: fullTheme.colors.text }}>
            Surface card with text content.
          </p>
          <p className="mt-1" style={{ color: fullTheme.colors.muted }}>
            Muted text example.
          </p>
        </div>
      </div>
    </div>
  );
}
