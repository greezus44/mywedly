import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { jsonToTheme, themeToEventCssVars, THEME_PRESETS, type ThemeConfig, type ThemeButtonConfig } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { ColorInput } from "../../components/ui";
import { FontSelect } from "../../components/ui/FontSelect";
import { HEADING_FONT_OPTIONS, RICH_FONT_OPTIONS } from "../../lib/theme";

interface EventContextValue { event: UserEvent; eventId: string; }

export function ThemeEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  // FIX #2: Load from draft_theme (the working copy the host edits)
  const [theme, setTheme] = useState<ThemeConfig>(() => jsonToTheme(event.draft_theme ?? event.theme));

  useEffect(() => {
    setTheme(jsonToTheme(event.draft_theme ?? event.theme));
  }, [event.draft_theme, event.theme]);

  const updateColors = (patch: Partial<ThemeConfig["colors"]>) => {
    setTheme((p) => ({ ...p, colors: { ...p.colors, ...patch } }));
  };
  const updateFonts = (patch: Partial<ThemeConfig["fonts"]>) => {
    setTheme((p) => ({ ...p, fonts: { ...p.fonts, ...patch } }));
  };
  const updateButton = (patch: Partial<ThemeButtonConfig>) => {
    setTheme((p) => ({ ...p, button: { ...(p.button ?? {}), ...patch } }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // FIX #2: Save to draft_theme column
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: theme as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const applyPreset = (presetTheme: ThemeConfig) => {
    setTheme(presetTheme);
  };

  const colorFields: Array<{ key: keyof ThemeConfig["colors"]; label: string }> = [
    { key: "bg", label: "Background" },
    { key: "surface", label: "Surface" },
    { key: "border", label: "Border" },
    { key: "text", label: "Text" },
    { key: "heading", label: "Heading" },
    { key: "muted", label: "Muted Text" },
    { key: "primary", label: "Primary" },
    { key: "primaryHover", label: "Primary Hover" },
    { key: "primaryFg", label: "Primary Foreground" },
    { key: "accent", label: "Accent" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Theme</h2>
        <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button>
      </div>

      {saveMutation.isError && <p className="text-sm text-dash-danger">{saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}</p>}
      {saveMutation.isSuccess && <p className="text-sm text-green-600">Saved successfully</p>}

      {/* Presets */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Theme Presets</h3>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.theme)}
              className="rounded-lg border border-dash-border px-3 py-2 text-sm font-medium text-dash-text transition-colors hover:bg-dash-bg"
              style={{ borderColor: preset.theme.colors.border }}
            >
              <span className="mr-1.5 inline-block h-3 w-3 rounded-full align-middle" style={{ backgroundColor: preset.theme.colors.primary }} />
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Colours</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {colorFields.map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-dash-muted">{label}</label>
              <ColorInput value={theme.colors[key]} onChange={(v) => updateColors({ [key]: v })} />
            </div>
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Fonts</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Heading Font</label>
            <FontSelect value={theme.fonts.heading} onChange={(v) => updateFonts({ heading: v })} options={HEADING_FONT_OPTIONS} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Body Font</label>
            <FontSelect value={theme.fonts.body} onChange={(v) => updateFonts({ body: v })} options={HEADING_FONT_OPTIONS} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Rich Text Font</label>
            <FontSelect value={theme.fonts.rich} onChange={(v) => updateFonts({ rich: v })} options={RICH_FONT_OPTIONS} />
          </div>
        </div>
      </div>

      {/* Radius & Scale */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Layout</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Border Radius</label>
            <input type="text" value={theme.radius} onChange={(e) => setTheme((p) => ({ ...p, radius: e.target.value }))} className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Font Scale</label>
            <input type="number" step="0.1" min="0.5" max="2" value={theme.fontScale} onChange={(e) => setTheme((p) => ({ ...p, fontScale: Number(e.target.value) }))} className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Button Styling */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Button Styling</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Button Background</label>
              <ColorInput value={theme.button?.bgColor ?? theme.colors.primary} onChange={(v) => updateButton({ bgColor: v })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Button Background Hover</label>
              <ColorInput value={theme.button?.bgColorHover ?? theme.colors.primaryHover} onChange={(v) => updateButton({ bgColorHover: v })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Button Text Colour</label>
              <ColorInput value={theme.button?.color ?? theme.colors.primaryFg} onChange={(v) => updateButton({ color: v })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Button Font Weight</label>
              <select value={theme.button?.fontWeight ?? 600} onChange={(e) => updateButton({ fontWeight: Number(e.target.value) })} className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none">
                <option value={400}>Normal (400)</option>
                <option value={500}>Medium (500)</option>
                <option value={600}>Semibold (600)</option>
                <option value={700}>Bold (700)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Button Font Family</label>
            <FontSelect value={theme.button?.fontFamily ?? theme.fonts.heading} onChange={(v) => updateButton({ fontFamily: v })} options={HEADING_FONT_OPTIONS} />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Preview</h3>
        <div className="event-themed rounded-lg p-6" style={themeToEventCssVars(theme) as React.CSSProperties}>
          <h2 className="guest-title mb-2">Your Heading</h2>
          <p className="guest-subtitle mb-4">Body text in your selected font and colour.</p>
          <button className="event-btn-primary">RSVP Now</button>
        </div>
      </div>
    </div>
  );
}
