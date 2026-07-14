import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { UserEvent, Json } from "../../lib/supabase";
import {
  THEME_PRESETS,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
  type SimplifiedThemeConfig,
  type ThemeConfig,
} from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { ColorInput, FormField } from "../../components/ui";
import { themeToEventCssVars } from "../../lib/theme";
import { cn } from "../../lib/utils";

const COLOR_FIELDS: { key: keyof SimplifiedThemeConfig; label: string }[] = [
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "border", label: "Border" },
  { key: "text", label: "Text" },
  { key: "primary", label: "Primary" },
  { key: "accent", label: "Accent" },
];

function jsonToSimplified(json: Json | null | undefined): SimplifiedThemeConfig {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  return json as SimplifiedThemeConfig;
}

export function ThemeEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<SimplifiedThemeConfig>(jsonToSimplified(event.draft_theme));

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
      queryClient.invalidateQueries({ queryKey: ["user-event", eventId] });
    },
  });

  const applyPreset = (presetTheme: ThemeConfig) => {
    setTheme({
      bg: presetTheme.colors.bg,
      surface: presetTheme.colors.surface,
      border: presetTheme.colors.border,
      text: presetTheme.colors.text,
      heading: presetTheme.colors.heading,
      muted: presetTheme.colors.muted,
      primary: presetTheme.colors.primary,
      primaryHover: presetTheme.colors.primaryHover,
      accent: presetTheme.colors.accent,
      fontHeading: presetTheme.fonts.heading,
      fontBody: presetTheme.fonts.body,
      fontRich: presetTheme.fonts.rich,
      radius: presetTheme.radius,
      fontScale: presetTheme.fontScale,
    });
  };

  const updateColor = (key: keyof SimplifiedThemeConfig, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  // Build a preview ThemeConfig from the current simplified state
  const previewTheme: ThemeConfig = {
    colors: {
      bg: theme.bg ?? "#fffbeb",
      surface: theme.surface ?? "#ffffff",
      surfaceAlt: "rgba(255,255,255,0.08)",
      border: theme.border ?? "#fde68a",
      text: theme.text ?? "#78350f",
      heading: theme.heading ?? theme.text ?? "#78350f",
      muted: theme.muted ?? "#92400e",
      primary: theme.primary ?? "#b45309",
      primaryHover: theme.primaryHover ?? "#92400e",
      primaryFg: "#ffffff",
      accent: theme.accent ?? "#d97706",
    },
    fonts: {
      heading: theme.fontHeading ?? "Georgia, serif",
      body: theme.fontBody ?? "Georgia, serif",
      rich: theme.fontRich ?? "Georgia, serif",
    },
    radius: theme.radius ?? "0.5rem",
    fontScale: theme.fontScale ?? 1,
  };

  const cssVars = themeToEventCssVars(previewTheme);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-dash-text">Theme</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Choose a preset or customize colors and fonts for your website.
        </p>
      </div>

      {/* Presets */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-dash-text mb-3">Presets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset.theme)}
              className="rounded-lg border border-dash-border overflow-hidden hover:shadow-md transition-shadow text-left"
            >
              <div
                className="h-16 flex items-center justify-center text-xs font-medium"
                style={{
                  backgroundColor: preset.theme.colors.bg,
                  color: preset.theme.colors.heading,
                  fontFamily: preset.theme.fonts.heading,
                }}
              >
                {preset.label}
              </div>
              <div className="flex h-4">
                <div className="flex-1" style={{ backgroundColor: preset.theme.colors.primary }} />
                <div className="flex-1" style={{ backgroundColor: preset.theme.colors.accent }} />
                <div className="flex-1" style={{ backgroundColor: preset.theme.colors.border }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Color customization */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-dash-text mb-3">Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-dash-text mb-3">Fonts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Heading Font">
            <Select
              value={theme.fontHeading ?? ""}
              onChange={(e) => setTheme((prev) => ({ ...prev, fontHeading: e.target.value }))}
            >
              <option value="">Default</option>
              {HEADING_FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Body / Rich Text Font">
            <Select
              value={theme.fontRich ?? ""}
              onChange={(e) => setTheme((prev) => ({ ...prev, fontRich: e.target.value, fontBody: e.target.value }))}
            >
              <option value="">Default</option>
              {RICH_FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </div>

      {/* Preview */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-dash-text mb-3">Live Preview</h3>
        <div className="rounded-xl border border-dash-border overflow-hidden" style={cssVars}>
          <div className="event-themed p-8">
            <div className="guest-eyebrow">Save the date</div>
            <h1 className="guest-title mb-2">
              {event.draft_name || event.name || "Our Wedding"}
            </h1>
            <p className="guest-subtitle">
              A beautiful celebration of love and togetherness.
            </p>
            <div className="mt-6 flex gap-3">
              <button className="event-btn-primary">RSVP Now</button>
              <button className="event-btn-secondary">View Details</button>
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Theme
        </Button>
        {saveMutation.isError && (
          <span className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
          </span>
        )}
        {saveMutation.isSuccess && (
          <span className="text-sm text-green-600">Saved!</span>
        )}
      </div>
    </div>
  );
}
