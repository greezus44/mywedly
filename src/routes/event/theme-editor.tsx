import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button, Card, ColorInput, RangeInput } from "../../components/ui";
import { FontSelect } from "../../components/ui/FontSelect";
import { HEADING_FONT_OPTIONS, THEME_PRESETS, fullToSimplifiedTheme, simplifiedToFullTheme, type ThemeConfig, type SimplifiedThemeConfig } from "../../lib/theme";

interface EventContextValue { event: UserEvent; eventId: string; }

export function ThemeEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const raw = event.draft_theme ?? event.theme;
    if (raw && typeof raw === "object" && "colors" in (raw as Record<string, unknown>)) return raw as unknown as ThemeConfig;
    return simplifiedToFullTheme(raw as unknown as SimplifiedThemeConfig);
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const updateColors = (patch: Partial<ThemeConfig["colors"]>) => setTheme((p) => ({ ...p, colors: { ...p.colors, ...patch } }));
  const updateFonts = (patch: Partial<ThemeConfig["fonts"]>) => setTheme((p) => ({ ...p, fonts: { ...p.fonts, ...patch } }));
  const updateButton = (patch: Partial<NonNullable<ThemeConfig["button"]>>) => setTheme((p) => ({ ...p, button: { ...p.button, ...patch } }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const simplified = fullToSimplifiedTheme(theme);
      const { error } = await supabase.from("user_events").update({ draft_theme: simplified as unknown as Record<string, unknown> }).eq("id", eventId);
      if (error) throw error;
    },
    onMutate: () => { setSaving(true); setSavedMsg(null); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event", eventId] }); setSaving(false); setSavedMsg("Saved!"); setTimeout(() => setSavedMsg(null), 2000); },
    onError: (e) => { setSaving(false); setSavedMsg(e instanceof Error ? e.message : "Failed to save"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Theme</h2>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-sm text-dash-muted">{savedMsg}</span>}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saving}>Save</Button>
        </div>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setTheme(preset.theme)}
              className="rounded-lg border border-dash-border px-3 py-1.5 text-sm text-dash-text hover:bg-dash-bg"
              style={{ fontFamily: preset.theme.fonts.heading }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Colors</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Fonts</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FontSelect label="Heading Font" value={theme.fonts.heading} onChange={(v) => updateFonts({ heading: v })} options={HEADING_FONT_OPTIONS} />
          <FontSelect label="Body Font" value={theme.fonts.body} onChange={(v) => updateFonts({ body: v })} options={HEADING_FONT_OPTIONS} />
          <FontSelect label="Rich Text Font" value={theme.fonts.rich} onChange={(v) => updateFonts({ rich: v })} options={HEADING_FONT_OPTIONS} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Border Radius</label>
            <input value={theme.radius} onChange={(e) => setTheme((p) => ({ ...p, radius: e.target.value }))} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          </div>
          <RangeInput label="Font Scale" value={theme.fontScale} min={0.8} max={1.5} step={0.05} onChange={(v) => setTheme((p) => ({ ...p, fontScale: v }))} />
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Button Styling</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ColorInput label="Button Background" value={theme.button?.bgColor ?? theme.colors.primary} onChange={(v) => updateButton({ bgColor: v })} />
          <ColorInput label="Button Hover BG" value={theme.button?.bgColorHover ?? theme.colors.primaryHover} onChange={(v) => updateButton({ bgColorHover: v })} />
          <ColorInput label="Button Text Color" value={theme.button?.color ?? theme.colors.primaryFg} onChange={(v) => updateButton({ color: v })} />
          <FontSelect label="Button Font Family" value={theme.button?.fontFamily ?? ""} onChange={(v) => updateButton({ fontFamily: v })} options={HEADING_FONT_OPTIONS} placeholder="Default heading font" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Button Font Size</label>
            <input value={theme.button?.fontSize ?? ""} onChange={(e) => updateButton({ fontSize: e.target.value })} placeholder="0.875rem" className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Button Font Weight</label>
            <select value={theme.button?.fontWeight ?? 600} onChange={(e) => updateButton({ fontWeight: Number(e.target.value) })} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none">
              <option value={400}>Regular (400)</option>
              <option value={500}>Medium (500)</option>
              <option value={600}>Semibold (600)</option>
              <option value={700}>Bold (700)</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}
