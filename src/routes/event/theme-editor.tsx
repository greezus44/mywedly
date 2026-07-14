import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, ColorInput, Select, RangeInput, LoadingSpinner } from "../../components/ui";
import { cn } from "../../lib/utils";
import {
  THEME_PRESETS,
  HEADING_FONT_OPTIONS,
  fullToSimplifiedTheme,
  simplifiedToFullTheme,
  jsonToTheme,
  type SimplifiedThemeConfig,
} from "../../lib/theme";
import type { EventContextValue } from "./event-layout";

const BUTTON_FONT_WEIGHTS = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Bold", value: 700 },
];

const BUTTON_FONT_SIZES = [
  { label: "Small (0.75rem)", value: "0.75rem" },
  { label: "Normal (0.875rem)", value: "0.875rem" },
  { label: "Medium (1rem)", value: "1rem" },
  { label: "Large (1.125rem)", value: "1.125rem" },
];

export function ThemeEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<SimplifiedThemeConfig>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      const draftJson = event.draft_theme ?? event.theme;
      const fullTheme = jsonToTheme(draftJson);
      setTheme(fullToSimplifiedTheme(fullTheme));
      setLoaded(true);
    }
  }, [event, loaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fullTheme = simplifiedToFullTheme(theme);
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_theme: fullTheme as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  function applyPreset(presetName: string) {
    const preset = THEME_PRESETS.find((p) => p.name === presetName);
    if (preset) {
      setTheme(fullToSimplifiedTheme(preset.theme));
    }
  }

  function update<K extends keyof SimplifiedThemeConfig>(key: K, val: SimplifiedThemeConfig[K]) {
    setTheme((prev) => ({ ...prev, [key]: val }));
  }

  if (!loaded) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Theme Editor</h2>
          <p className="text-sm text-dash-muted">Customize your invitation website's appearance.</p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          Save Theme
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-dash-danger">
          {saveMutation.error?.message ?? "Failed to save theme"}
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Theme saved successfully!
        </div>
      )}

      {/* Theme Presets */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Theme Presets</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset.name)}
              className="rounded-md border border-dash-border p-3 text-left transition-colors hover:border-dash-primary"
              style={{
                backgroundColor: preset.theme.colors.bg,
                borderColor: preset.theme.colors.border,
              }}
            >
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: preset.theme.colors.primary }} />
                <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: preset.theme.colors.accent }} />
              </div>
              <p className="mt-2 text-xs font-medium" style={{ color: preset.theme.colors.heading }}>
                {preset.name}
              </p>
            </button>
          ))}
        </div>
      </Card>

      {/* Colors */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Colours</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ColorInput label="Background" value={theme.bg ?? "#fffbeb"} onChange={(v) => update("bg", v)} />
          <ColorInput label="Surface" value={theme.surface ?? "#ffffff"} onChange={(v) => update("surface", v)} />
          <ColorInput label="Border" value={theme.border ?? "#fde68a"} onChange={(v) => update("border", v)} />
          <ColorInput label="Text" value={theme.text ?? "#78350f"} onChange={(v) => update("text", v)} />
          <ColorInput label="Heading" value={theme.heading ?? "#78350f"} onChange={(v) => update("heading", v)} />
          <ColorInput label="Muted Text" value={theme.muted ?? "#92400e"} onChange={(v) => update("muted", v)} />
          <ColorInput label="Primary" value={theme.primary ?? "#b45309"} onChange={(v) => update("primary", v)} />
          <ColorInput label="Primary Hover" value={theme.primaryHover ?? "#92400e"} onChange={(v) => update("primaryHover", v)} />
          <ColorInput label="Primary Foreground" value={theme.primaryFg ?? "#ffffff"} onChange={(v) => update("primaryFg", v)} />
          <ColorInput label="Accent" value={theme.accent ?? "#d97706"} onChange={(v) => update("accent", v)} />
        </div>
      </Card>

      {/* Fonts */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Fonts</h3>
        <div className="space-y-4">
          <Select
            label="Heading Font"
            value={theme.headingFont ?? "Georgia, serif"}
            onChange={(e) => update("headingFont", e.target.value)}
          >
            {HEADING_FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </Select>
          <Select
            label="Body Font"
            value={theme.bodyFont ?? "Georgia, serif"}
            onChange={(e) => update("bodyFont", e.target.value)}
          >
            {HEADING_FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </Select>
          <Select
            label="Rich Text Font"
            value={theme.richFont ?? "'EB Garamond', serif"}
            onChange={(e) => update("richFont", e.target.value)}
          >
            {HEADING_FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </Select>
          <RangeInput
            label="Font Scale"
            value={theme.fontScale ?? 1}
            onChange={(v) => update("fontScale", v)}
            min={0.8}
            max={1.5}
            step={0.05}
          />
        </div>
      </Card>

      {/* Button Styling */}
      <Card className="p-4">
        <h3 className="mb-1 text-sm font-semibold text-dash-text">Button Styling</h3>
        <p className="mb-4 text-xs text-dash-muted">
          Customize the appearance of buttons on your invitation website. Leave blank to inherit from the Event Theme.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ColorInput
            label="Button Text Colour"
            value={theme.buttonColor ?? theme.primaryFg ?? "#ffffff"}
            onChange={(v) => update("buttonColor", v)}
          />
          <ColorInput
            label="Button Background Colour"
            value={theme.buttonBgColor ?? theme.primary ?? "#b45309"}
            onChange={(v) => update("buttonBgColor", v)}
          />
          <ColorInput
            label="Button Background Hover Colour"
            value={theme.buttonBgColorHover ?? theme.primaryHover ?? "#92400e"}
            onChange={(v) => update("buttonBgColorHover", v)}
          />
          <Select
            label="Button Label Font Family"
            value={theme.buttonFontFamily ?? theme.headingFont ?? "Georgia, serif"}
            onChange={(e) => update("buttonFontFamily", e.target.value)}
          >
            {HEADING_FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </Select>
          <Select
            label="Button Label Font Size"
            value={theme.buttonFontSize ?? "0.875rem"}
            onChange={(e) => update("buttonFontSize", e.target.value)}
          >
            {BUTTON_FONT_SIZES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-dash-text">Button Font Weight</span>
            <div className="flex gap-1">
              {BUTTON_FONT_WEIGHTS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => update("buttonFontWeight", w.value)}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors",
                    (theme.buttonFontWeight ?? 600) === w.value
                      ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                      : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg",
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Button Preview */}
        <div className="mt-4 rounded-md border border-dash-border bg-dash-bg p-4">
          <p className="mb-2 text-xs text-dash-muted">Preview</p>
          <button
            type="button"
            className="rounded-md px-6 py-2.5 transition-all"
            style={{
              backgroundColor: theme.buttonBgColor ?? theme.primary ?? "#b45309",
              color: theme.buttonColor ?? theme.primaryFg ?? "#ffffff",
              fontFamily: theme.buttonFontFamily ?? theme.headingFont ?? "Georgia, serif",
              fontSize: theme.buttonFontSize ?? "0.875rem",
              fontWeight: theme.buttonFontWeight ?? 600,
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = theme.buttonBgColorHover ?? theme.primaryHover ?? "#92400e";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = theme.buttonBgColor ?? theme.primary ?? "#b45309";
            }}
          >
            RSVP Now
          </button>
        </div>
      </Card>

      {/* Radius */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Border Radius</h3>
        <Select
          label="Corner Radius"
          value={theme.radius ?? "0.5rem"}
          onChange={(e) => update("radius", e.target.value)}
        >
          <option value="0">None</option>
          <option value="0.25rem">Small</option>
          <option value="0.375rem">Medium-Small</option>
          <option value="0.5rem">Medium</option>
          <option value="0.75rem">Large</option>
          <option value="1rem">Extra Large</option>
        </Select>
      </Card>
    </div>
  );
}

export default ThemeEditor;
