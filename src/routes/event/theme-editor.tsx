import React, { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Select } from "../../components/ui/Input";
import { ColorInput, FormField, LoadingSpinner, Card } from "../../components/ui";
import {
  THEME_PRESETS,
  DEFAULT_THEME,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
  themeToEventCssVars,
  type ThemeConfig,
} from "../../lib/theme";

const COLOR_FIELDS: { key: keyof ThemeConfig; label: string }[] = [
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "border", label: "Border" },
  { key: "text", label: "Body Text" },
  { key: "heading", label: "Heading Text" },
  { key: "muted", label: "Muted Text" },
  { key: "primary", label: "Primary" },
  { key: "primaryHover", label: "Primary Hover" },
  { key: "primaryFg", label: "Primary Foreground" },
  { key: "accent", label: "Accent" },
];

export default function ThemeEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = (event.draft_theme ?? event.theme ?? DEFAULT_THEME) as ThemeConfig;
    setTheme({ ...DEFAULT_THEME, ...t });
  }, [event.id]);

  const saveMutation = useMutation({
    mutationFn: async (payload: ThemeConfig) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: payload })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate(theme);
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  function applyPreset(presetKey: string) {
    const preset = THEME_PRESETS[presetKey];
    if (preset) setTheme({ ...preset.theme });
  }

  const cssVars = themeToEventCssVars(theme);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Website Theme</h2>
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        {saveMutation.isPending && <LoadingSpinner className="h-4 w-4" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormField label="Theme Presets">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className="rounded-lg border border-dash-border p-3 text-left hover:border-dash-primary/50 transition-colors"
                >
                  <div className="flex gap-1 mb-2">
                    {[
                      preset.theme.primary,
                      preset.theme.bg,
                      preset.theme.surface,
                      preset.theme.accent,
                    ].map((c, i) => (
                      <div key={i} className="h-4 w-4 rounded-full border border-dash-border" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="text-xs font-medium text-dash-text">{preset.name}</div>
                </button>
              ))}
            </div>
          </FormField>

          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-dash-text">Colors</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COLOR_FIELDS.map((field) => (
                <ColorInput
                  key={field.key}
                  label={field.label}
                  value={theme[field.key] as string}
                  onChange={(v) => setTheme((t) => ({ ...t, [field.key]: v }))}
                />
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Heading Font"
              value={theme.fontHeading}
              onChange={(e) => setTheme((t) => ({ ...t, fontHeading: e.target.value }))}
            >
              {HEADING_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </Select>
            <Select
              label="Body Font"
              value={theme.fontBody}
              onChange={(e) => setTheme((t) => ({ ...t, fontBody: e.target.value }))}
            >
              {HEADING_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </Select>
            <Select
              label="Rich Text Font"
              value={theme.fontRich}
              onChange={(e) => setTheme((t) => ({ ...t, fontRich: e.target.value }))}
            >
              {RICH_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Live Preview */}
        <div className="rounded-xl border border-dash-border overflow-hidden">
          <div className="border-b border-dash-border px-4 py-2 bg-dash-surface">
            <span className="text-sm font-medium text-dash-text">Live Preview</span>
          </div>
          <div
            className="p-8 min-h-[400px]"
            style={{
              background: "var(--event-bg)",
              color: "var(--event-text)",
              fontFamily: "var(--event-font-body)",
              ...cssVars,
            } as React.CSSProperties}
          >
            <h1
              className="text-3xl mb-4"
              style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}
            >
              {event.draft_name || event.name || "Your Event Title"}
            </h1>
            <p className="mb-3" style={{ color: "var(--event-muted)" }}>
              A preview of your theme colors and typography.
            </p>
            <button
              className="px-4 py-2 rounded-lg font-medium"
              style={{ background: "var(--event-primary)", color: "var(--event-primary-fg)" }}
            >
              Primary Button
            </button>
            <div className="mt-6 p-4 rounded-lg" style={{ background: "var(--event-surface)", border: "1px solid var(--event-border)" }}>
              <h2
                className="text-xl mb-2"
                style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}
              >
                Surface Card
              </h2>
              <p className="text-sm" style={{ color: "var(--event-text)" }}>
                This card uses the surface and border colors from your theme.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
