import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import {
  Button, ColorInput, RangeInput, Select, FontSelect,
  Card, Toggle,
} from "../../components/ui";
import {
  jsonToTheme, themeToEventCssVars, THEME_PRESETS,
  HEADING_FONT_OPTIONS, type ThemeConfig, type ThemeButtonConfig,
} from "../../lib/theme";
import { cn } from "../../lib/utils";

export function ThemeEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<ThemeConfig>(() =>
    jsonToTheme(event.draft_theme ?? event.theme),
  );
  const [saved, setSaved] = useState(false);

  function updateColor(key: keyof ThemeConfig["colors"], val: string) {
    setTheme((t) => ({ ...t, colors: { ...t.colors, [key]: val } }));
  }

  function updateFont(key: keyof ThemeConfig["fonts"], val: string) {
    setTheme((t) => ({ ...t, fonts: { ...t.fonts, [key]: val } }));
  }

  function updateButton(key: keyof ThemeButtonConfig, val: string | number | undefined) {
    setTheme((t) => ({ ...t, button: { ...t.button, [key]: val } }));
  }

  const mutation = useMutation({
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

  const previewStyle = themeToEventCssVars(theme) as React.CSSProperties;

  const colorFields: { label: string; key: keyof ThemeConfig["colors"] }[] = [
    { label: "Background", key: "bg" },
    { label: "Surface", key: "surface" },
    { label: "Border", key: "border" },
    { label: "Text", key: "text" },
    { label: "Heading", key: "heading" },
    { label: "Muted", key: "muted" },
    { label: "Primary", key: "primary" },
    { label: "Primary Hover", key: "primaryHover" },
    { label: "Primary Foreground", key: "primaryFg" },
    { label: "Accent", key: "accent" },
  ];

  const radiusOptions = ["0", "0.25rem", "0.375rem", "0.5rem", "0.75rem", "1rem", "1.5rem", "9999px"];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-semibold text-dash-text">Theme</h2>

      {/* Presets */}
      <section>
        <h3 className="text-sm font-semibold text-dash-text uppercase tracking-wide mb-3">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setTheme(p.theme)}
              className="rounded-full border border-dash-border px-3 py-1 text-sm text-dash-text hover:border-dash-primary hover:text-dash-primary transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </section>

      {/* Colours */}
      <section>
        <h3 className="text-sm font-semibold text-dash-text uppercase tracking-wide mb-3">Colours</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {colorFields.map((f) => (
            <ColorInput
              key={f.key}
              label={f.label}
              value={theme.colors[f.key]}
              onChange={(v) => updateColor(f.key, v)}
            />
          ))}
        </div>
      </section>

      {/* Fonts */}
      <section>
        <h3 className="text-sm font-semibold text-dash-text uppercase tracking-wide mb-3">Fonts</h3>
        <div className="space-y-4">
          <FontSelect
            label="Heading Font"
            value={theme.fonts.heading}
            onChange={(v) => updateFont("heading", v)}
            options={HEADING_FONT_OPTIONS}
          />
          <FontSelect
            label="Body Font"
            value={theme.fonts.body}
            onChange={(v) => updateFont("body", v)}
            options={HEADING_FONT_OPTIONS}
          />
          <FontSelect
            label="Rich Text Font"
            value={theme.fonts.rich}
            onChange={(v) => updateFont("rich", v)}
            options={HEADING_FONT_OPTIONS}
          />
        </div>
      </section>

      {/* Radius + Scale */}
      <section>
        <h3 className="text-sm font-semibold text-dash-text uppercase tracking-wide mb-3">Layout</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1">Border Radius</label>
            <Select
              value={theme.radius}
              onChange={(e) => setTheme((t) => ({ ...t, radius: e.target.value }))}
            >
              {radiusOptions.map((r) => (
                <option key={r} value={r}>{r === "0" ? "None" : r === "9999px" ? "Pill" : r}</option>
              ))}
            </Select>
          </div>
          <RangeInput
            label="Font Scale"
            value={Math.round(theme.fontScale * 100)}
            onChange={(v) => setTheme((t) => ({ ...t, fontScale: v / 100 }))}
            min={75}
            max={125}
            unit="%"
          />
        </div>
      </section>

      {/* Button Styling */}
      <section>
        <h3 className="text-sm font-semibold text-dash-text uppercase tracking-wide mb-3">Button Styling</h3>
        <div className="space-y-4">
          <ColorInput
            label="Button Background"
            value={theme.button?.bgColor ?? theme.colors.primary}
            onChange={(v) => updateButton("bgColor", v)}
          />
          <ColorInput
            label="Button Hover Background"
            value={theme.button?.bgColorHover ?? theme.colors.primaryHover}
            onChange={(v) => updateButton("bgColorHover", v)}
          />
          <ColorInput
            label="Button Text Colour"
            value={theme.button?.color ?? theme.colors.primaryFg}
            onChange={(v) => updateButton("color", v)}
          />
          <FontSelect
            label="Button Font"
            value={theme.button?.fontFamily ?? theme.fonts.heading}
            onChange={(v) => updateButton("fontFamily", v)}
            options={HEADING_FONT_OPTIONS}
          />
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1">Button Font Size</label>
            <input
              type="text"
              value={theme.button?.fontSize ?? "0.875rem"}
              onChange={(e) => updateButton("fontSize", e.target.value)}
              placeholder="0.875rem"
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1">Button Font Weight</label>
            <div className="flex gap-1">
              {([400, 500, 600, 700] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => updateButton("fontWeight", w)}
                  className={cn(
                    "flex-1 rounded border px-2 py-1.5 text-xs transition-colors",
                    (theme.button?.fontWeight ?? 600) === w
                      ? "border-dash-primary bg-dash-primary text-white"
                      : "border-dash-border bg-dash-surface text-dash-text hover:border-dash-primary/50",
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Preview swatch */}
      <section>
        <h3 className="text-sm font-semibold text-dash-text uppercase tracking-wide mb-3">Preview</h3>
        <div
          className="rounded-xl border p-6 space-y-3"
          style={{ ...previewStyle, backgroundColor: "var(--event-bg)", borderColor: "var(--event-border)" }}
        >
          <h2 style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>
            Heading Preview
          </h2>
          <p style={{ color: "var(--event-text)", fontFamily: "var(--event-font-body)" }}>
            Body text preview. This is how your content will look.
          </p>
          <button
            style={{
              backgroundColor: "var(--event-btn-bg)",
              color: "var(--event-btn-color)",
              fontFamily: "var(--event-btn-font-family)",
              fontSize: "var(--event-btn-font-size)",
              fontWeight: "var(--event-btn-font-weight)",
              borderRadius: "var(--event-radius)",
              padding: "0.5rem 1.25rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            Button Preview
          </button>
        </div>
      </section>

      <Button onClick={() => mutation.mutate()} loading={mutation.isPending} className="w-full">
        {saved ? "Saved!" : "Save changes"}
      </Button>
    </div>
  );
}
