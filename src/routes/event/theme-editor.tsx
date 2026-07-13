import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, ThemeConfig } from "../../lib/supabase";
import { DEFAULT_THEME, THEME_PRESETS, FONT_OPTIONS } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { FormField, ColorInput, RangeInput, Toggle, Toast } from "../../components/ui/index";
import { debounce, cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export default function ThemeEditor() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [theme, setTheme] = useState<ThemeConfig>({ ...DEFAULT_THEME, ...(event?.draft_theme || {}) });

  useEffect(() => {
    if (event) {
      setTheme({ ...DEFAULT_THEME, ...(event.draft_theme || {}) });
    }
  }, [event]);

  const previewKey = useMemo(() => JSON.stringify(theme), [theme]);

  const debouncedSave = useMemo(
    () =>
      debounce(async (themeConfig: ThemeConfig) => {
        if (!eventId) return;
        setSaving(true);
        const { error } = await supabase
          .from("user_events")
          .update({ draft_theme: themeConfig })
          .eq("id", eventId);
        setSaving(false);
        if (error) {
          setToast("Failed to save");
          setTimeout(() => setToast(null), 3000);
        }
        queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      }, 800),
    [eventId, queryClient]
  );

  useEffect(() => {
    if (!event) return;
    debouncedSave(theme);
  }, [theme, event, debouncedSave]);

  const saveMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: theme })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast("Saved");
      setTimeout(() => setToast(null), 3000);
    },
    onError: () => {
      setToast("Failed to save");
      setTimeout(() => setToast(null), 3000);
    },
  });

  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setTheme({ ...theme, preset: presetId, ...preset.config });
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Theme</h1>
          <p className="text-sm text-gray-500 mt-0.5">Colors, fonts, and layout settings</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
            </span>
          )}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save
          </Button>
        </div>
      </div>

      <SplitEditor title="Theme Settings" preview={<HomePreview event={event} theme={theme} content={event.draft_content} />} previewKey={previewKey}>
        <div className="space-y-5">
          <FormField label="Preset">
            <div className="grid grid-cols-3 gap-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-colors",
                    theme.preset === preset.id ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-4 h-4 rounded-full border border-gray-200" style={{ background: preset.config.bgColor }} />
                    <span className="w-4 h-4 rounded-full border border-gray-200" style={{ background: preset.config.primaryColor }} />
                  </div>
                  <p className="text-xs font-medium text-gray-900">{preset.name}</p>
                </button>
              ))}
            </div>
          </FormField>

          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Colors</h3>
            <div className="space-y-3">
              <FormField label="Background">
                <ColorInput value={theme.bgColor} onChange={(v) => setTheme({ ...theme, bgColor: v })} />
              </FormField>
              <FormField label="Primary">
                <ColorInput value={theme.primaryColor} onChange={(v) => setTheme({ ...theme, primaryColor: v })} />
              </FormField>
              <FormField label="Accent">
                <ColorInput value={theme.accentColor} onChange={(v) => setTheme({ ...theme, accentColor: v })} />
              </FormField>
              <FormField label="Heading Text">
                <ColorInput value={theme.headingColor} onChange={(v) => setTheme({ ...theme, headingColor: v })} />
              </FormField>
              <FormField label="Body Text">
                <ColorInput value={theme.bodyColor} onChange={(v) => setTheme({ ...theme, bodyColor: v })} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Button Background">
                  <ColorInput value={theme.buttonBgColor} onChange={(v) => setTheme({ ...theme, buttonBgColor: v })} />
                </FormField>
                <FormField label="Button Text">
                  <ColorInput value={theme.buttonTextColor} onChange={(v) => setTheme({ ...theme, buttonTextColor: v })} />
                </FormField>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Fonts</h3>
            <div className="space-y-3">
              <FormField label="Heading Font">
                <Select value={theme.headingFont} onChange={(e) => setTheme({ ...theme, headingFont: e.target.value })}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Body Font">
                <Select value={theme.bodyFont} onChange={(e) => setTheme({ ...theme, bodyFont: e.target.value })}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Script Font">
                <Select value={theme.scriptFont} onChange={(e) => setTheme({ ...theme, scriptFont: e.target.value })}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Layout</h3>
            <div className="space-y-3">
              <FormField label="Button Radius">
                <RangeInput value={theme.buttonRadius} min={0} max={24} onChange={(v) => setTheme({ ...theme, buttonRadius: v })} />
              </FormField>
              <FormField label="Section Padding">
                <RangeInput value={theme.sectionPadding} min={32} max={160} step={4} onChange={(v) => setTheme({ ...theme, sectionPadding: v })} />
              </FormField>
              <FormField label="Max Width">
                <RangeInput value={theme.maxWidth} min={480} max={1200} step={20} onChange={(v) => setTheme({ ...theme, maxWidth: v })} />
              </FormField>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <Toggle
                checked={theme.applyToAll}
                onChange={(v) => setTheme({ ...theme, applyToAll: v })}
                label="Apply theme to all pages"
              />
              <p className="mt-2 text-xs text-gray-500">
                When enabled, this theme will be applied across all pages of your event site.
              </p>
            </div>
          </div>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
