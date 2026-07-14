import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, ColorInput } from "../../components/ui";
import { Select } from "../../components/ui/Input";
import {
  THEME_PRESETS,
  DEFAULT_THEME,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
  type ThemeConfig,
  type SimplifiedThemeConfig,
  fullToSimplifiedTheme,
  simplifiedToFullTheme,
} from "../../lib/theme";

const COLOR_FIELDS: { key: keyof ThemeConfig["colors"]; label: string }[] = [
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "primary", label: "Primary" },
  { key: "primaryHover", label: "Primary Hover" },
  { key: "text", label: "Text" },
  { key: "accent", label: "Accent" },
];

export function ThemeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const draftThemeJson = event.draft_theme ?? event.theme;
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    if (!draftThemeJson) return { ...DEFAULT_THEME };
    const obj = draftThemeJson as Record<string, unknown>;
    const colorsSrc = (obj.colors as Record<string, unknown>) ?? {};
    const fontsSrc = (obj.fonts as Record<string, unknown>) ?? {};
    return {
      colors: {
        bg: (colorsSrc.bg as string) ?? DEFAULT_THEME.colors.bg,
        surface: (colorsSrc.surface as string) ?? DEFAULT_THEME.colors.surface,
        surfaceAlt: (colorsSrc.surfaceAlt as string) ?? DEFAULT_THEME.colors.surfaceAlt,
        border: (colorsSrc.border as string) ?? DEFAULT_THEME.colors.border,
        text: (colorsSrc.text as string) ?? DEFAULT_THEME.colors.text,
        heading: (colorsSrc.heading as string) ?? DEFAULT_THEME.colors.heading,
        muted: (colorsSrc.muted as string) ?? DEFAULT_THEME.colors.muted,
        primary: (colorsSrc.primary as string) ?? DEFAULT_THEME.colors.primary,
        primaryHover: (colorsSrc.primaryHover as string) ?? DEFAULT_THEME.colors.primaryHover,
        primaryFg: (colorsSrc.primaryFg as string) ?? DEFAULT_THEME.colors.primaryFg,
        accent: (colorsSrc.accent as string) ?? DEFAULT_THEME.colors.accent,
      },
      fonts: {
        heading: (fontsSrc.heading as string) ?? DEFAULT_THEME.fonts.heading,
        body: (fontsSrc.body as string) ?? DEFAULT_THEME.fonts.body,
        rich: (fontsSrc.rich as string) ?? DEFAULT_THEME.fonts.rich,
      },
      radius: (obj.radius as string) ?? DEFAULT_THEME.radius,
      fontScale: typeof obj.fontScale === "number" ? obj.fontScale : DEFAULT_THEME.fontScale,
    };
  });

  useEffect(() => {
    const json = event.draft_theme ?? event.theme;
    if (!json) {
      setTheme({ ...DEFAULT_THEME });
      return;
    }
    const obj = json as Record<string, unknown>;
    const colorsSrc = (obj.colors as Record<string, unknown>) ?? {};
    const fontsSrc = (obj.fonts as Record<string, unknown>) ?? {};
    setTheme({
      colors: {
        bg: (colorsSrc.bg as string) ?? DEFAULT_THEME.colors.bg,
        surface: (colorsSrc.surface as string) ?? DEFAULT_THEME.colors.surface,
        surfaceAlt: (colorsSrc.surfaceAlt as string) ?? DEFAULT_THEME.colors.surfaceAlt,
        border: (colorsSrc.border as string) ?? DEFAULT_THEME.colors.border,
        text: (colorsSrc.text as string) ?? DEFAULT_THEME.colors.text,
        heading: (colorsSrc.heading as string) ?? DEFAULT_THEME.colors.heading,
        muted: (colorsSrc.muted as string) ?? DEFAULT_THEME.colors.muted,
        primary: (colorsSrc.primary as string) ?? DEFAULT_THEME.colors.primary,
        primaryHover: (colorsSrc.primaryHover as string) ?? DEFAULT_THEME.colors.primaryHover,
        primaryFg: (colorsSrc.primaryFg as string) ?? DEFAULT_THEME.colors.primaryFg,
        accent: (colorsSrc.accent as string) ?? DEFAULT_THEME.colors.accent,
      },
      fonts: {
        heading: (fontsSrc.heading as string) ?? DEFAULT_THEME.fonts.heading,
        body: (fontsSrc.body as string) ?? DEFAULT_THEME.fonts.body,
        rich: (fontsSrc.rich as string) ?? DEFAULT_THEME.fonts.rich,
      },
      radius: (obj.radius as string) ?? DEFAULT_THEME.radius,
      fontScale: typeof obj.fontScale === "number" ? obj.fontScale : DEFAULT_THEME.fontScale,
    });
  }, [event]);

  const updateColor = (key: keyof ThemeConfig["colors"], value: string) => {
    setTheme((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };

  const updateFont = (key: keyof ThemeConfig["fonts"], value: string) => {
    setTheme((prev) => ({ ...prev, fonts: { ...prev.fonts, [key]: value } }));
  };

  const applyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) setTheme({ ...preset });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const simplified: SimplifiedThemeConfig = fullToSimplifiedTheme(theme);
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: simplified as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const previewStyle = {
    "--event-bg": theme.colors.bg,
    "--event-surface": theme.colors.surface,
    "--event-border": theme.colors.border,
    "--event-text": theme.colors.text,
    "--event-heading": theme.colors.heading,
    "--event-muted": theme.colors.muted,
    "--event-primary": theme.colors.primary,
    "--event-primary-hover": theme.colors.primaryHover,
    "--event-primary-fg": theme.colors.primaryFg,
    "--event-accent": theme.colors.accent,
    "--event-font-heading": theme.fonts.heading,
    "--event-font-body": theme.fonts.body,
    "--event-radius": theme.radius,
  } as React.CSSProperties;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dash-text">Theme Editor</h2>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully!</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Presets */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-dash-text mb-3">Presets</h3>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className="rounded-md border-2 border-dash-border hover:border-dash-primary transition-colors overflow-hidden"
                  title={key}
                >
                  <div className="h-12 flex items-center justify-center" style={{ background: preset.colors.bg }}>
                    <div className="w-6 h-6 rounded-full" style={{ background: preset.colors.primary }} />
                  </div>
                  <div className="text-xs text-dash-muted py-1 capitalize">{key}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Colors */}
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-dash-text">Colours</h3>
            {COLOR_FIELDS.map((field) => (
              <ColorInput
                key={field.key}
                label={field.label}
                value={theme.colors[field.key]}
                onChange={(v) => updateColor(field.key, v)}
              />
            ))}
          </Card>

          {/* Fonts */}
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-dash-text">Fonts</h3>
            <Select
              label="Heading font"
              value={theme.fonts.heading}
              onChange={(e) => updateFont("heading", e.target.value)}
            >
              {HEADING_FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Select
              label="Body font"
              value={theme.fonts.body}
              onChange={(e) => updateFont("body", e.target.value)}
            >
              {RICH_FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </Card>
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-dash-border bg-dash-surface p-6" style={previewStyle}>
          <div
            className="rounded-lg p-6"
            style={{ background: "var(--event-bg)", color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}
          >
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}
            >
              Your Heading
            </h2>
            <p className="mb-4" style={{ color: "var(--event-text)" }}>
              This is how your body text will look. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
            <button
              className="px-4 py-2 rounded font-medium"
              style={{
                background: "var(--event-primary)",
                color: "var(--event-primary-fg)",
                borderRadius: "var(--event-radius)",
              }}
            >
              Primary Button
            </button>
            <div className="mt-6 p-4 rounded" style={{ background: "var(--event-surface)", border: "1px solid var(--event-border)" }}>
              <p className="text-sm" style={{ color: "var(--event-muted)" }}>
                Surface card with muted text
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
