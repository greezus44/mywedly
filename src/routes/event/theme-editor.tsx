import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { ColorInput, FormField, Select } from "../../components/ui";
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
  { key: "primary", label: "Primary" },
  { key: "accent", label: "Accent" },
  { key: "text", label: "Text" },
  { key: "heading", label: "Heading" },
];

export function ThemeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const draftTheme = (event.draft_theme as ThemeConfig | null) ?? null;
  const initial: ThemeConfig = draftTheme ?? THEME_PRESETS.default;

  const [theme, setTheme] = useState<ThemeConfig>(initial);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const dt = (event.draft_theme as ThemeConfig | null) ?? null;
    setTheme(dt ?? THEME_PRESETS.default);
  }, [event]);

  const updateColor = (key: keyof ThemeConfig["colors"], value: string) => {
    setTheme((t) => ({ ...t, colors: { ...t.colors, [key]: value } }));
  };

  const updateFont = (key: keyof ThemeConfig["fonts"], value: string) => {
    setTheme((t) => ({ ...t, fonts: { ...t.fonts, [key]: value } }));
  };

  const applyPreset = (presetName: string) => {
    const preset = THEME_PRESETS[presetName];
    if (preset) setTheme(preset);
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
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Theme Editor</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Choose a preset or customize colors and fonts for your invitation website.
        </p>
      </div>

      {/* Presets */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Theme Presets</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {presetNames.map((name) => {
            const preset = THEME_PRESETS[name];
            const isActive =
              theme.colors.bg === preset.colors.bg &&
              theme.colors.primary === preset.colors.primary &&
              theme.colors.surface === preset.colors.surface;
            return (
              <button
                key={name}
                type="button"
                onClick={() => applyPreset(name)}
                className={cn(
                  "rounded-lg border-2 p-3 text-left transition-all",
                  isActive
                    ? "border-dash-primary ring-2 ring-dash-primary/30"
                    : "border-dash-border hover:border-dash-primary/50",
                )}
              >
                <div
                  className="mb-2 flex h-12 items-center justify-center rounded"
                  style={{ backgroundColor: preset.colors.bg }}
                >
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: preset.colors.primary }}
                  />
                </div>
                <span className="text-xs font-medium capitalize text-dash-text">{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div className="border-t border-dash-border pt-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Colors</h3>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {colorFields.map((field) => (
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
      <div className="border-t border-dash-border pt-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Fonts</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Heading Font">
            <Select
              value={theme.fonts.heading}
              onChange={(e) => updateFont("heading", e.target.value)}
            >
              {HEADING_FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Body / Rich Text Font">
            <Select
              value={theme.fonts.rich}
              onChange={(e) => updateFont("rich", e.target.value)}
            >
              {RICH_FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </div>

      {/* Preview swatch */}
      <div className="border-t border-dash-border pt-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Preview</h3>
        <div
          className="rounded-lg border p-6"
          style={{
            backgroundColor: theme.colors.bg,
            borderColor: theme.colors.border,
            color: theme.colors.text,
            fontFamily: theme.fonts.body,
          }}
        >
          <h4
            style={{
              color: theme.colors.heading,
              fontFamily: theme.fonts.heading,
              fontSize: "1.5rem",
              fontWeight: 700,
            }}
          >
            Sample Heading
          </h4>
          <p className="mt-2" style={{ color: theme.colors.muted }}>
            This is how your body text will look on the invitation website.
          </p>
          <button
            type="button"
            className="mt-3 rounded-md px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.primaryFg,
            }}
          >
            Sample Button
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 border-t border-dash-border pt-4">
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Theme
        </Button>
        {savedMsg && <span className="text-sm text-green-600">Saved!</span>}
        {saveMutation.isError && (
          <span className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
          </span>
        )}
      </div>
    </div>
  );
}
