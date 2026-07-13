import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, ThemeConfig, EventContent } from "../../lib/supabase";
import { DEFAULT_THEME, DEFAULT_CONTENT, THEME_PRESETS, FONT_OPTIONS } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { FormField, ColorInput, RangeInput, Toast, ErrorState } from "../../components/ui/index";
import { debounce, cn } from "../../lib/utils";

type Ctx = { event: UserEvent | null };

export default function ThemeEditor() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<ThemeConfig>(event?.draft_theme || event?.theme || DEFAULT_THEME);
  const [content, setContent] = useState<EventContent>(event?.draft_content || event?.content || DEFAULT_CONTENT);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState("0");

  useEffect(() => {
    if (event) { setConfig(event.draft_theme || event.theme || DEFAULT_THEME); setContent(event.draft_content || event.content || DEFAULT_CONTENT); }
  }, [event?.id]);

  const debouncedPreviewUpdate = useMemo(() => debounce(() => setPreviewKey(k => String(Number(k) + 1)), 150), []);
  const updateConfig = useCallback((patch: Partial<ThemeConfig>) => { setConfig(prev => ({ ...prev, ...patch })); debouncedPreviewUpdate(); }, [debouncedPreviewUpdate]);

  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (preset) { setConfig(prev => ({ ...prev, ...preset.config, preset: presetId } as ThemeConfig)); debouncedPreviewUpdate(); }
  };

  const handleSave = useCallback(async () => {
    if (!event || !eventId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_events").update({ draft_theme: config }).eq("id", eventId);
      if (error) throw error;
      queryClient.setQueryData(["event", eventId], (old: UserEvent | null) => old ? { ...old, draft_theme: config } : old);
      setToast("Theme saved!"); setTimeout(() => setToast(null), 3000);
    } catch (err: any) { setToast("Failed: " + err.message); setTimeout(() => setToast(null), 3000); }
    finally { setSaving(false); }
  }, [event, eventId, config, queryClient]);

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;
  const previewEvent = { ...event, draft_theme: config, draft_content: content };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Theme</h1><p className="text-sm text-gray-500">Customise colours and typography</p></div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>
      <SplitEditor title="Theme Settings" previewKey={previewKey} preview={<HomePreview event={previewEvent} theme={config} content={content} />} children={
        <div className="space-y-5">
          <div className="space-y-2"><h3 className="text-sm font-semibold text-gray-900">Colour Presets</h3>
            <div className="grid grid-cols-5 gap-2">
              {THEME_PRESETS.map(preset => (
                <button key={preset.id} onClick={() => applyPreset(preset.id)} className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors", config.preset === preset.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:bg-gray-50")}>
                  <div className="flex gap-0.5">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.config.bgColor }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.config.primaryColor }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.config.accentColor }} />
                  </div>
                  <span className="text-[10px] text-gray-600">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">Colours</h3>
            <FormField label="Background"><ColorInput value={config.bgColor} onChange={(v) => updateConfig({ bgColor: v })} /></FormField>
            <FormField label="Primary"><ColorInput value={config.primaryColor} onChange={(v) => updateConfig({ primaryColor: v })} /></FormField>
            <FormField label="Accent"><ColorInput value={config.accentColor} onChange={(v) => updateConfig({ accentColor: v })} /></FormField>
            <FormField label="Heading Text"><ColorInput value={config.headingColor} onChange={(v) => updateConfig({ headingColor: v })} /></FormField>
            <FormField label="Body Text"><ColorInput value={config.bodyColor} onChange={(v) => updateConfig({ bodyColor: v })} /></FormField>
            <FormField label="Button Background"><ColorInput value={config.buttonBgColor} onChange={(v) => updateConfig({ buttonBgColor: v })} /></FormField>
            <FormField label="Button Text"><ColorInput value={config.buttonTextColor} onChange={(v) => updateConfig({ buttonTextColor: v })} /></FormField>
          </div>
          <div className="space-y-3 border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">Typography</h3>
            <FormField label="Heading Font"><Select value={config.headingFont} onChange={(e) => updateConfig({ headingFont: e.target.value })}>{FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}</Select></FormField>
            <FormField label="Body Font"><Select value={config.bodyFont} onChange={(e) => updateConfig({ bodyFont: e.target.value })}>{FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}</Select></FormField>
            <FormField label="Script Font"><Select value={config.scriptFont} onChange={(e) => updateConfig({ scriptFont: e.target.value })}>{FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}</Select></FormField>
          </div>
          <div className="space-y-3 border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">Layout</h3>
            <FormField label="Button Roundness"><RangeInput value={config.buttonRadius} min={0} max={24} onChange={(v) => updateConfig({ buttonRadius: v })} /></FormField>
            <FormField label="Section Spacing"><RangeInput value={config.sectionPadding} min={32} max={128} onChange={(v) => updateConfig({ sectionPadding: v })} /></FormField>
            <FormField label="Content Width"><RangeInput value={config.maxWidth} min={600} max={1200} step={50} onChange={(v) => updateConfig({ maxWidth: v })} /></FormField>
          </div>
        </div>
      } />
      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
