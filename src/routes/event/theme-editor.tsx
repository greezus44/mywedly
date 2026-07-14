import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, ColorInput, RangeInput, FontSelect } from "../../components/ui";
import { EventThemeProvider } from "../../lib/theme-context";
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
  type ThemeConfig,
  type ThemeButtonConfig,
} from "../../lib/theme";

interface EventContextValue { event: UserEvent; eventId: string; }

export function ThemeEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const raw = event.draft_theme ?? event.theme ?? DEFAULT_THEME;
    return typeof raw === "object" && raw !== null ? (raw as ThemeConfig) : DEFAULT_THEME;
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = event.draft_theme ?? event.theme ?? DEFAULT_THEME;
    setTheme(typeof raw === "object" && raw !== null ? (raw as ThemeConfig) : DEFAULT_THEME);
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: theme })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const updateColors = (patch: Partial<ThemeConfig["colors"]>) =>
    setTheme((p) => ({ ...p, colors: { ...p.colors, ...patch } }));
  const updateFonts = (patch: Partial<ThemeConfig["fonts"]>) =>
    setTheme((p) => ({ ...p, fonts: { ...p.fonts, ...patch } }));
  const updateButton = (patch: Partial<ThemeButtonConfig>) =>
    setTheme((p) => ({ ...p, button: { ...p.button, ...patch } }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Theme</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button>
        </div>
      </div>

      {/* Presets */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => setTheme(preset.theme)}
              className="rounded-lg border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text hover:bg-dash-bg"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Colors */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Colors</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ColorInput label="Background" value={theme.colors.bg} onChange={(v) => updateColors({ bg: v })} />
          <ColorInput label="Surface" value={theme.colors.surface} onChange={(v) => updateColors({ surface: v })} />
          <ColorInput label="Border" value={theme.colors.border} onChange={(v) => updateColors({ border: v })} />
          <ColorInput label="Text" value={theme.colors.text} onChange={(v) => updateColors({ text: v })} />
          <ColorInput label="Heading" value={theme.colors.heading} onChange={(v) => updateColors({ heading: v })} />
          <ColorInput label="Muted" value={theme.colors.muted} onChange={(v) => updateColors({ muted: v })} />
          <ColorInput label="Primary" value={theme.colors.primary} onChange={(v) => updateColors({ primary: v })} />
          <ColorInput label="Primary Hover" value={theme.colors.primaryHover} onChange={(v) => updateColors({ primaryHover: v })} />
          <ColorInput label="Primary Foreground" value={theme.colors.primaryFg} onChange={(v) => updateColors({ primaryFg: v })} />
          <ColorInput label="Accent" value={theme.colors.accent} onChange={(v) => updateColors({ accent: v })} />
        </div>
      </Card>

      {/* Fonts */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Fonts</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <FontSelect
            label="Heading Font"
            value={theme.fonts.heading}
            onChange={(v) => updateFonts({ heading: v })}
            options={HEADING_FONT_OPTIONS}
          />
          <FontSelect
            label="Body Font"
            value={theme.fonts.body}
            onChange={(v) => updateFonts({ body: v })}
            options={HEADING_FONT_OPTIONS}
          />
          <FontSelect
            label="Rich Text Font"
            value={theme.fonts.rich}
            onChange={(v) => updateFonts({ rich: v })}
            options={RICH_FONT_OPTIONS}
          />
        </div>
      </Card>

      {/* Layout */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Layout</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-dash-text">Border Radius</label>
            <select
              value={theme.radius}
              onChange={(e) => setTheme((p) => ({ ...p, radius: e.target.value }))}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:outline-none"
            >
              <option value="0">Sharp (0)</option>
              <option value="0.25rem">Small (0.25rem)</option>
              <option value="0.5rem">Medium (0.5rem)</option>
              <option value="0.75rem">Large (0.75rem)</option>
              <option value="1rem">Extra Large (1rem)</option>
            </select>
          </div>
          <RangeInput
            label="Font Scale"
            value={theme.fontScale}
            min={0.75}
            max={1.5}
            step={0.05}
            onChange={(v) => setTheme((p) => ({ ...p, fontScale: v }))}
          />
        </div>
      </Card>

      {/* Button Styling */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Button Styling</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ColorInput label="Button Background" value={theme.button?.bgColor ?? theme.colors.primary} onChange={(v) => updateButton({ bgColor: v })} />
          <ColorInput label="Button Background Hover" value={theme.button?.bgColorHover ?? theme.colors.primaryHover} onChange={(v) => updateButton({ bgColorHover: v })} />
          <ColorInput label="Button Text Color" value={theme.button?.color ?? theme.colors.primaryFg} onChange={(v) => updateButton({ color: v })} />
          <FontSelect
            label="Button Font Family"
            value={theme.button?.fontFamily ?? theme.fonts.heading}
            onChange={(v) => updateButton({ fontFamily: v })}
            options={HEADING_FONT_OPTIONS}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-dash-text">Button Font Size</label>
            <select
              value={theme.button?.fontSize ?? "0.875rem"}
              onChange={(e) => updateButton({ fontSize: e.target.value })}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:outline-none"
            >
              <option value="0.75rem">Small (0.75rem)</option>
              <option value="0.875rem">Medium (0.875rem)</option>
              <option value="1rem">Large (1rem)</option>
              <option value="1.125rem">Extra Large (1.125rem)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-dash-text">Button Font Weight</label>
            <select
              value={String(theme.button?.fontWeight ?? 600)}
              onChange={(e) => updateButton({ fontWeight: Number(e.target.value) })}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:outline-none"
            >
              <option value="400">Regular (400)</option>
              <option value="500">Medium (500)</option>
              <option value="600">Semibold (600)</option>
              <option value="700">Bold (700)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Preview</h3>
        <EventThemeProvider theme={theme}>
          <div className="space-y-4 p-4">
            <h1 className="guest-title">Sample Heading</h1>
            <p className="guest-subtitle">This is sample body text to preview your theme.</p>
            <button type="button" className="event-btn-primary">Primary Button</button>
            <button type="button" className="event-btn-secondary">Secondary Button</button>
            <div className="event-card">
              <p className="text-sm">Card content preview</p>
              <input type="text" className="event-input mt-2" placeholder="Input preview" readOnly />
            </div>
          </div>
        </EventThemeProvider>
      </Card>
    </div>
  );
}
