import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import { Card, FormField, Toast, ColorInput, RangeInput } from "../../components/ui";
import { Select } from "../../components/ui/Input";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { EventThemeProvider } from "../../lib/theme-context";
import { THEME_PRESETS, RICH_FONT_OPTIONS, DEFAULT_THEME } from "../../lib/theme";
import { useState } from "react";

type Ctx = { event: UserEvent };
export default function ThemeEditorPage() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const theme: ThemeConfig = event.draft_theme || DEFAULT_THEME;

  const update = (patch: Partial<ThemeConfig>) => { const next = { ...theme, ...patch }; saveMutation.mutate({ draft_theme: next }); };
  const saveMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => { const { error } = await supabase.from("user_events").update(patch).eq("id", eventId); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
    onError: (e: Error) => setToast(`Save failed: ${e.message}`),
  });

  return (
    <div className="p-6">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="font-heading text-2xl text-gray-900">Theme</h2>
          <Card className="space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">Presets</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button key={key} onClick={() => update(preset)} className="p-3 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors text-left">
                  <div className="flex gap-1 mb-2">{[preset.primaryColor, preset.secondaryColor, preset.accentColor, preset.bgColor].map((c, i) => <div key={i} className="w-6 h-6 rounded" style={{ background: c }} />)}</div>
                  <span className="text-xs font-medium text-gray-700 capitalize">{key}</span>
                </button>
              ))}
            </div>
          </Card>
          <Card className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Colors</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Primary"><ColorInput value={theme.primaryColor || "#1a1a1a"} onChange={(v) => update({ primaryColor: v })} /></FormField>
              <FormField label="Secondary"><ColorInput value={theme.secondaryColor || "#2a2a2a"} onChange={(v) => update({ secondaryColor: v })} /></FormField>
              <FormField label="Accent"><ColorInput value={theme.accentColor || "#1a1a1a"} onChange={(v) => update({ accentColor: v })} /></FormField>
              <FormField label="Background"><ColorInput value={theme.bgColor || "#ffffff"} onChange={(v) => update({ bgColor: v })} /></FormField>
              <FormField label="Surface"><ColorInput value={theme.surfaceColor || "#ffffff"} onChange={(v) => update({ surfaceColor: v })} /></FormField>
              <FormField label="Text"><ColorInput value={theme.textColor || "#1a1a1a"} onChange={(v) => update({ textColor: v })} /></FormField>
              <FormField label="Text Muted"><ColorInput value={theme.textMutedColor || "#6b6b6b"} onChange={(v) => update({ textMutedColor: v })} /></FormField>
              <FormField label="Border"><ColorInput value={theme.borderColor || "#e2e2e2"} onChange={(v) => update({ borderColor: v })} /></FormField>
            </div>
          </Card>
          <Card className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Typography</h3>
            <FormField label="Heading Font"><Select value={theme.headingFont || "Cormorant Garamond"} onChange={(e) => update({ headingFont: e.target.value })}>{RICH_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</Select></FormField>
            <FormField label="Body Font"><Select value={theme.bodyFont || "Inter"} onChange={(e) => update({ bodyFont: e.target.value })}>{RICH_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</Select></FormField>
            <FormField label="Script Font"><Select value={theme.scriptFont || "Cormorant Garamond"} onChange={(e) => update({ scriptFont: e.target.value })}>{RICH_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</Select></FormField>
          </Card>
          <Card className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Layout</h3>
            <RangeInput label="Button Radius" min={0} max={24} value={theme.buttonRadius ?? 2} onChange={(v) => update({ buttonRadius: v })} />
          </Card>
        </div>
        <div className="lg:sticky lg:top-32 self-start">
          <SplitEditor preview={
            <EventThemeProvider initialTheme={theme}>
              <CoverPreview event={event} />
            </EventThemeProvider>
          }>
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">Theme Preview</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <EventThemeProvider initialTheme={theme}>
                  <CoverPreview event={event} />
                </EventThemeProvider>
              </div>
            </div>
          </SplitEditor>
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
