import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import {
  THEME_PRESETS, DEFAULT_THEME, HEADING_FONT_OPTIONS, RICH_FONT_OPTIONS,
  type ThemeConfig, themeToEventCssVars,
} from "../../lib/theme";
import { ColorInput, Select } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { cn } from "../../lib/utils";

const COLOR_FIELDS: { key: keyof ThemeConfig; label: string }[] = [
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "border", label: "Border" },
  { key: "text", label: "Text" },
  { key: "heading", label: "Heading" },
  { key: "muted", label: "Muted Text" },
  { key: "primary", label: "Primary" },
  { key: "primaryHover", label: "Primary Hover" },
  { key: "primaryFg", label: "Primary Text" },
  { key: "accent", label: "Accent" },
];

export default function ThemeEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const currentTheme = (event.draft_theme ?? event.theme ?? DEFAULT_THEME) as ThemeConfig;

  const [theme, setTheme] = useState<ThemeConfig>({ ...DEFAULT_THEME, ...currentTheme });
  const [activePreset, setActivePreset] = useState<string | null>(
    Object.entries(THEME_PRESETS).find(([, p]) => JSON.stringify(p.theme) === JSON.stringify(currentTheme))?.[0] ?? null
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_theme: theme as unknown as Json })
        .eq("id", event.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", event.id] });
    },
    onError: () => {},
  });

  function applyPreset(key: string) {
    const preset = THEME_PRESETS[key];
    if (!preset) return;
    setTheme({ ...preset.theme });
    setActivePreset(key);
  }

  function updateColor(key: keyof ThemeConfig, value: string) {
    setTheme((prev) => ({ ...prev, [key]: value }));
    setActivePreset(null);
  }

  const previewEvent: Partial<UserEvent> = {
    ...event,
    theme: theme as unknown as Json,
    cover_config: event.draft_cover_config ?? event.cover_config,
    cover_image: event.draft_cover_image ?? event.cover_image,
    name: event.draft_name ?? event.name,
    event_date: event.draft_event_date ?? event.event_date,
  };

  const cssVars = themeToEventCssVars(theme);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Theme Editor</h2>
          <p className="mt-1 text-sm text-dash-muted">Customize colors and fonts for your website.</p>
        </div>
        <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-dash-danger/30 bg-red-50 px-4 py-3 text-sm text-dash-danger">
          Failed to save. Please try again.
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Changes saved successfully.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-6">
          {/* Presets */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dash-text">Theme Presets</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={cn(
                    "rounded-lg border-2 p-3 text-left transition-colors",
                    activePreset === key
                      ? "border-dash-primary ring-2 ring-dash-primary/20"
                      : "border-dash-border hover:border-dash-primary"
                  )}
                >
                  <div className="flex gap-1">
                    <div className="h-6 w-6 rounded" style={{ background: preset.theme.primary }} />
                    <div className="h-6 w-6 rounded" style={{ background: preset.theme.bg }} />
                    <div className="h-6 w-6 rounded" style={{ background: preset.theme.accent }} />
                  </div>
                  <div className="mt-2 text-xs font-medium text-dash-text">{preset.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dash-text">Colors</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {COLOR_FIELDS.map((field) => (
                <ColorInput
                  key={field.key}
                  label={field.label}
                  value={theme[field.key] as string}
                  onChange={(v) => updateColor(field.key, v)}
                />
              ))}
            </div>
          </div>

          {/* Fonts */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-dash-text">Fonts</label>
            <Select
              label="Heading Font"
              value={theme.fontHeading}
              onChange={(e) => { setTheme({ ...theme, fontHeading: e.target.value }); setActivePreset(null); }}
            >
              {HEADING_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </Select>
            <Select
              label="Body Font"
              value={theme.fontBody}
              onChange={(e) => { setTheme({ ...theme, fontBody: e.target.value }); setActivePreset(null); }}
            >
              {RICH_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </Select>
            <Select
              label="Rich Text Font"
              value={theme.fontRich}
              onChange={(e) => { setTheme({ ...theme, fontRich: e.target.value }); setActivePreset(null); }}
            >
              {RICH_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Live Preview */}
        <div className="sticky top-32 self-start">
          <label className="mb-2 block text-sm font-medium text-dash-text">Live Preview</label>
          <div className="overflow-hidden rounded-xl border border-dash-border" style={cssVars as React.CSSProperties}>
            <div className="event-themed">
              <CoverPreview event={previewEvent} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
