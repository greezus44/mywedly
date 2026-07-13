import React from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, ColorInput, FormField } from "../../components/ui";
import { Select } from "../../components/ui/Input";
import { THEME_PRESETS, RICH_FONT_OPTIONS } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";

export default function ThemeEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const theme = event.draft_theme || event.theme || {};
  const saveMutation = useMutation({
    mutationFn: async (newTheme: ThemeConfig) => { const { error } = await supabase.from("user_events").update({ draft_theme: newTheme }).eq("id", event.id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", event.id] }),
    onError: (err: any) => alert("Failed to save: " + (err.message || "Unknown error")),
  });
  const [local, setLocal] = React.useState<ThemeConfig>(theme);
  React.useEffect(() => setLocal(theme), [JSON.stringify(theme)]);
  const update = (patch: Partial<ThemeConfig>) => setLocal((prev) => ({ ...prev, ...patch }));
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-dash-text">Theme</h2>
        <Button onClick={() => saveMutation.mutate(local)} loading={saveMutation.isPending}>Save Changes</Button>
      </div>
      <SplitEditor preview={<CoverPreview event={{ ...event, draft_theme: local } as UserEvent} />}>
        <Card className="p-4 space-y-4">
          <FormField label="Preset">
            <Select value="" onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { const preset = THEME_PRESETS.find((p) => p.name === e.target.value); if (preset) setLocal(preset.theme); }}>
              <option value="">Choose a preset...</option>
              {THEME_PRESETS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Font">
            <Select value={local.font || ""} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => update({ font: e.target.value })}>
              {RICH_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <ColorInput label="Background" value={local.bg || "#ffffff"} onChange={(v) => update({ bg: v })} />
            <ColorInput label="Surface" value={local.surface || "#ffffff"} onChange={(v) => update({ surface: v })} />
            <ColorInput label="Primary" value={local.primary || "#000000"} onChange={(v) => update({ primary: v })} />
            <ColorInput label="Primary Hover" value={local.primaryHover || "#000000"} onChange={(v) => update({ primaryHover: v })} />
            <ColorInput label="Text" value={local.text || "#000000"} onChange={(v) => update({ text: v })} />
            <ColorInput label="Muted" value={local.muted || "#666666"} onChange={(v) => update({ muted: v })} />
            <ColorInput label="Border" value={local.border || "#cccccc"} onChange={(v) => update({ border: v })} />
            <ColorInput label="Accent" value={local.accent || "#cccccc"} onChange={(v) => update({ accent: v })} />
          </div>
        </Card>
      </SplitEditor>
    </div>
  );
}
