import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, ColorInput, RangeInput, Input } from "../../components/ui";
import { FontSelect } from "../../components/ui/FontSelect";
import {
  HEADING_FONT_OPTIONS,
  THEME_PRESETS,
  type ThemeConfig,
  type ThemeButtonConfig,
} from "../../lib/theme";
import { cn } from "../../lib/utils";

const FONT_WEIGHTS = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Semibold", value: 600 },
  { label: "Bold", value: 700 },
];

function asTheme(json: Json | null | undefined): ThemeConfig {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return THEME_PRESETS[0].theme;
  }
  const obj = json as Record<string, unknown>;
  const colors = (obj.colors as Record<string, unknown> | undefined) ?? {};
  const fonts = (obj.fonts as Record<string, unknown> | undefined) ?? {};
  const button = (obj.button as Record<string, unknown> | undefined) ?? {};
  return {
    colors: {
      bg: (colors.bg as string) || "#fffbeb",
      surface: (colors.surface as string) || "#ffffff",
      surfaceAlt: (colors.surfaceAlt as string) || "rgba(255,255,255,0.08)",
      border: (colors.border as string) || "#fde68a",
      text: (colors.text as string) || "#78350f",
      heading: (colors.heading as string) || "#78350f",
      muted: (colors.muted as string) || "#92400e",
      primary: (colors.primary as string) || "#b45309",
      primaryHover: (colors.primaryHover as string) || "#92400e",
      primaryFg: (colors.primaryFg as string) || "#ffffff",
      accent: (colors.accent as string) || "#d97706",
    },
    fonts: {
      heading: (fonts.heading as string) || "Georgia, serif",
      body: (fonts.body as string) || "Georgia, serif",
      rich: (fonts.rich as string) || "Georgia, serif",
    },
    radius: (obj.radius as string) || "0.5rem",
    fontScale: typeof obj.fontScale === "number" ? obj.fontScale : 1,
    button: {
      bgColor: button.bgColor as string | undefined,
      bgColorHover: button.bgColorHover as string | undefined,
      color: button.color as string | undefined,
      fontFamily: button.fontFamily as string | undefined,
      fontSize: button.fontSize as string | undefined,
      fontWeight: typeof button.fontWeight === "number" ? button.fontWeight : undefined,
    },
  };
}

export function ThemeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<ThemeConfig>(asTheme(event.draft_theme));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTheme(asTheme(event.draft_theme));
  }, [event.draft_theme]);

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
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const updateColors = (patch: Partial<ThemeConfig["colors"]>) => {
    setTheme((prev) => ({ ...prev, colors: { ...prev.colors, ...patch } }));
  };

  const updateFonts = (patch: Partial<ThemeConfig["fonts"]>) => {
    setTheme((prev) => ({ ...prev, fonts: { ...prev.fonts, ...patch } }));
  };

  const updateButton = (patch: Partial<ThemeButtonConfig>) => {
    setTheme((prev) => ({ ...prev, button: { ...prev.button, ...patch } }));
  };

  const applyPreset = (preset: ThemeConfig) => {
    setTheme(preset);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Theme Editor</h2>
          <p className="text-sm text-dash-muted">Customize the visual style of your event site.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          {saved ? "Saved!" : "Save"}
        </Button>
      </div>

      {/* Presets */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Theme Presets</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset.theme)}
              className="rounded-lg border border-dash-border p-3 text-left transition-colors hover:border-dash-primary"
            >
              <div
                className="mb-2 h-12 w-full rounded"
                style={{ background: preset.theme.colors.bg, border: `1px solid ${preset.theme.colors.border}` }}
              />
              <p className="text-xs font-medium text-dash-text">{preset.name}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Colors */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Colours</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ColorInput label="Background" value={theme.colors.bg} onChange={(bg) => updateColors({ bg })} />
          <ColorInput label="Surface" value={theme.colors.surface} onChange={(surface) => updateColors({ surface })} />
          <ColorInput label="Border" value={theme.colors.border} onChange={(border) => updateColors({ border })} />
          <ColorInput label="Text" value={theme.colors.text} onChange={(text) => updateColors({ text })} />
          <ColorInput label="Heading" value={theme.colors.heading} onChange={(heading) => updateColors({ heading })} />
          <ColorInput label="Muted" value={theme.colors.muted} onChange={(muted) => updateColors({ muted })} />
          <ColorInput label="Primary" value={theme.colors.primary} onChange={(primary) => updateColors({ primary })} />
          <ColorInput label="Primary Hover" value={theme.colors.primaryHover} onChange={(primaryHover) => updateColors({ primaryHover })} />
          <ColorInput label="Primary Foreground" value={theme.colors.primaryFg} onChange={(primaryFg) => updateColors({ primaryFg })} />
          <ColorInput label="Accent" value={theme.colors.accent} onChange={(accent) => updateColors({ accent })} />
        </div>
      </Card>

      {/* Fonts */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Fonts</h3>
        <div className="space-y-4">
          <FontSelect
            label="Heading Font"
            value={theme.fonts.heading}
            onChange={(heading) => updateFonts({ heading })}
            options={HEADING_FONT_OPTIONS}
          />
          <FontSelect
            label="Body Font"
            value={theme.fonts.body}
            onChange={(body) => updateFonts({ body })}
            options={HEADING_FONT_OPTIONS}
          />
          <FontSelect
            label="Rich Text Font"
            value={theme.fonts.rich}
            onChange={(rich) => updateFonts({ rich })}
            options={HEADING_FONT_OPTIONS}
          />
        </div>
      </Card>

      {/* Layout */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Layout</h3>
        <div className="space-y-4">
          <Input
            label="Border Radius"
            value={theme.radius}
            onChange={(e) => setTheme((prev) => ({ ...prev, radius: e.target.value }))}
            placeholder="0.5rem"
          />
          <RangeInput
            label="Font Scale"
            value={theme.fontScale}
            onChange={(fontScale) => setTheme((prev) => ({ ...prev, fontScale }))}
            min={0.75}
            max={1.5}
            step={0.05}
          />
        </div>
      </Card>

      {/* Button Styling */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Button Styling</h3>
        <div className="space-y-4">
          <ColorInput
            label="Button Text Colour"
            value={theme.button?.color || theme.colors.primaryFg}
            onChange={(color) => updateButton({ color })}
          />
          <ColorInput
            label="Button BG Colour"
            value={theme.button?.bgColor || theme.colors.primary}
            onChange={(bgColor) => updateButton({ bgColor })}
          />
          <ColorInput
            label="Button BG Hover Colour"
            value={theme.button?.bgColorHover || theme.colors.primaryHover}
            onChange={(bgColorHover) => updateButton({ bgColorHover })}
          />
          <FontSelect
            label="Button Label Font Family"
            value={theme.button?.fontFamily || theme.fonts.heading}
            onChange={(fontFamily) => updateButton({ fontFamily })}
            options={HEADING_FONT_OPTIONS}
          />
          <Input
            label="Button Label Font Size"
            value={theme.button?.fontSize || "0.875rem"}
            onChange={(e) => updateButton({ fontSize: e.target.value })}
            placeholder="0.875rem"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Button Font Weight</label>
            <div className="flex gap-1">
              {FONT_WEIGHTS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => updateButton({ fontWeight: w.value })}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors",
                    (theme.button?.fontWeight ?? 600) === w.value
                      ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                      : "border-dash-border text-dash-text hover:bg-dash-bg"
                  )}
                  style={{ fontWeight: w.value }}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Button preview */}
          <div className="rounded-lg border border-dash-border p-4 text-center">
            <button
              type="button"
              disabled
              style={{
                backgroundColor: theme.button?.bgColor || theme.colors.primary,
                color: theme.button?.color || theme.colors.primaryFg,
                fontFamily: theme.button?.fontFamily || theme.fonts.heading,
                fontSize: theme.button?.fontSize || "0.875rem",
                fontWeight: theme.button?.fontWeight ?? 600,
                padding: "0.75rem 2rem",
                borderRadius: theme.radius,
                border: "none",
                cursor: "default",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              RSVP Now
            </button>
          </div>
        </div>
      </Card>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save."}
        </p>
      )}
    </div>
  );
}
