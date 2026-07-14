import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { ColorInput, RangeInput, Card } from "../../components/ui";
import {
  THEME_PRESETS,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
  fullToSimplifiedTheme,
  simplifiedToFullTheme,
  type SimplifiedThemeConfig,
} from "../../lib/theme";
import { cn } from "../../lib/utils";

const COLOR_FIELDS: { key: keyof SimplifiedThemeConfig; label: string }[] = [
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "border", label: "Border" },
  { key: "primary", label: "Primary" },
  { key: "primaryHover", label: "Primary Hover" },
  { key: "accent", label: "Accent" },
];

export function ThemeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const existingTheme = (event.draft_theme ?? event.theme ?? null) as Json | null;
  const existingSimplified = fullToSimplifiedTheme(
    THEME_PRESETS.default,
  );

  // Parse existing theme into simplified form
  const parsedSimplified: SimplifiedThemeConfig = (() => {
    if (!existingTheme || typeof existingTheme !== "object" || Array.isArray(existingTheme)) {
      return existingSimplified;
    }
    const t = existingTheme as Record<string, unknown>;
    const colorsIn = (t.colors && typeof t.colors === "object" && !Array.isArray(t.colors) ? t.colors : {}) as Record<string, unknown>;
    const fontsIn = (t.fonts && typeof t.fonts === "object" && !Array.isArray(t.fonts) ? t.fonts : {}) as Record<string, unknown>;
    return {
      bg: colorsIn.bg as string | undefined,
      surface: colorsIn.surface as string | undefined,
      border: colorsIn.border as string | undefined,
      primary: colorsIn.primary as string | undefined,
      primaryHover: colorsIn.primaryHover as string | undefined,
      accent: colorsIn.accent as string | undefined,
      fontHeading: fontsIn.heading as string | undefined,
      fontBody: fontsIn.body as string | undefined,
      fontRich: fontsIn.rich as string | undefined,
      radius: t.radius as string | undefined,
      fontScale: t.fontScale as number | undefined,
    };
  })();

  const [simplified, setSimplified] = useState<SimplifiedThemeConfig>(parsedSimplified);
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<SimplifiedThemeConfig>) => {
    setSimplified((prev) => ({ ...prev, ...patch }));
  };

  const applyPreset = (presetName: string) => {
    const preset = THEME_PRESETS[presetName];
    if (preset) {
      setSimplified(fullToSimplifiedTheme(preset));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fullTheme = simplifiedToFullTheme(simplified);
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_theme: fullTheme as unknown as Json })
        .eq("id", eventId)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Theme Editor</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Customise colours, fonts, and styling for your website
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">✓ Saved</span>}
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Presets */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Theme Presets</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(THEME_PRESETS).map(([name, theme]) => (
            <button
              key={name}
              type="button"
              onClick={() => applyPreset(name)}
              className={cn(
                "rounded-lg border-2 p-3 text-left transition-all hover:shadow-md",
                "border-dash-border",
              )}
              style={{
                backgroundColor: theme.colors.bg,
                borderColor: theme.colors.border,
              }}
            >
              <div
                className="mb-2 h-8 rounded"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <div
                className="text-sm font-medium capitalize"
                style={{ color: theme.colors.heading }}
              >
                {name}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Colors */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Colours</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLOR_FIELDS.map((field) => (
            <ColorInput
              key={field.key}
              label={field.label}
              value={(simplified[field.key] as string) ?? "#000000"}
              onChange={(v) => update({ [field.key]: v } as Partial<SimplifiedThemeConfig>)}
            />
          ))}
        </div>
      </Card>

      {/* Fonts */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Fonts</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Heading Font"
            value={simplified.fontHeading ?? ""}
            onChange={(e) => update({ fontHeading: e.target.value })}
          >
            <option value="">Default</option>
            {HEADING_FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            label="Body / Rich Text Font"
            value={simplified.fontRich ?? ""}
            onChange={(e) => update({ fontRich: e.target.value })}
          >
            <option value="">Default</option>
            {RICH_FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Other */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Other Settings</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Border Radius
            </label>
            <div className="flex gap-2">
              {["0rem", "0.25rem", "0.5rem", "0.75rem", "1rem"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update({ radius: r })}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm transition-colors",
                    simplified.radius === r
                      ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                      : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <RangeInput
            label="Font Scale"
            value={Math.round((simplified.fontScale ?? 1) * 100)}
            onChange={(v) => update({ fontScale: v / 100 })}
            min={50}
            max={200}
            step={5}
          />
        </div>
      </Card>
    </div>
  );
}
