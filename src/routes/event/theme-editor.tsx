import React from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { ColorInput, Select, FormField } from "../../components/ui";
import { THEME_PRESETS, RICH_FONT_OPTIONS } from "../../lib/theme";

export default function ThemeEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const theme = event.draft_theme || event.theme || {};
  const [bg, setBg] = React.useState(theme.bg || "#faf7f2");
  const [surface, setSurface] = React.useState(theme.surface || "#ffffff");
  const [border, setBorder] = React.useState(theme.border || "#e8e0d5");
  const [text, setText] = React.useState(theme.text || "#2d2424");
  const [muted, setMuted] = React.useState(theme.muted || "#8a7a72");
  const [primary, setPrimary] = React.useState(theme.primary || "#b8860b");
  const [primaryHover, setPrimaryHover] = React.useState(theme.primaryHover || "#9a7209");
  const [primaryLight, setPrimaryLight] = React.useState(theme.primaryLight || "#f5e6c8");
  const [accent, setAccent] = React.useState(theme.accent || "#d4a574");
  const [font, setFont] = React.useState(theme.font || '"Cormorant Garamond", serif');

  const saveMutation = useMutation({
    mutationFn: async () => {
      const themeConfig: ThemeConfig = { bg, surface, border, text, muted, primary, primaryHover, primaryLight, accent, font };
      const { error } = await supabase.from("user_events").update({ draft_theme: themeConfig }).eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", event.id] }),
    onError: (err: any) => alert("Failed to save: " + (err.message || "Unknown error")),
  });

  const applyPreset = (preset: ThemeConfig) => {
    setBg(preset.bg || ""); setSurface(preset.surface || ""); setBorder(preset.border || "");
    setText(preset.text || ""); setMuted(preset.muted || ""); setPrimary(preset.primary || "");
    setPrimaryHover(preset.primaryHover || ""); setPrimaryLight(preset.primaryLight || "");
    setAccent(preset.accent || ""); setFont(preset.font || "");
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-dash-text mb-6">Theme</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormField label="Preset">
            <Select value="" onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { const preset = THEME_PRESETS.find((p) => p.name === e.target.value); if (preset) applyPreset(preset.theme); }}>
              <option value="">Choose a preset...</option>
              {THEME_PRESETS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <ColorInput label="Background" value={bg} onChange={setBg} />
            <ColorInput label="Surface" value={surface} onChange={setSurface} />
            <ColorInput label="Border" value={border} onChange={setBorder} />
            <ColorInput label="Text" value={text} onChange={setText} />
            <ColorInput label="Muted" value={muted} onChange={setMuted} />
            <ColorInput label="Primary" value={primary} onChange={setPrimary} />
            <ColorInput label="Primary Hover" value={primaryHover} onChange={setPrimaryHover} />
            <ColorInput label="Primary Light" value={primaryLight} onChange={setPrimaryLight} />
            <ColorInput label="Accent" value={accent} onChange={setAccent} />
          </div>
          <FormField label="Font Family">
            <Select value={font} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFont(e.target.value)}>
              {RICH_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
          </FormField>
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save Changes</Button>
        </div>
        <div className="rounded-xl border border-dash-border overflow-hidden" style={{ background: bg, color: text, fontFamily: font }}>
          <div className="p-8 text-center">
            <h1 className="text-3xl font-serif mb-2" style={{ color: primary }}>Preview Title</h1>
            <p className="mb-4" style={{ color: muted }}>Preview subtitle text</p>
            <div className="inline-block px-6 py-2.5 rounded-lg text-white font-medium" style={{ background: primary }}>Button</div>
            <div className="mt-4 p-4 rounded-lg border" style={{ borderColor: border, background: surface }}>
              <p style={{ color: text }}>Card content example</p>
              <p className="text-sm" style={{ color: muted }}>Muted text example</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
