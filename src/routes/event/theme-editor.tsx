import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { ColorInput, RangeInput, FormField, Toggle, Toast } from "../../components/ui";
import { Select } from "../../components/ui/Input";
import { Loader2 } from "lucide-react";
import { DEFAULT_THEME, THEME_PRESETS, FONT_OPTIONS } from "../../lib/theme";
import { debounce } from "../../lib/utils";

export default function ThemeEditor() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (event && !initialized.current) {
      setTheme(event.draft_theme || event.theme || DEFAULT_THEME);
      initialized.current = true;
    }
  }, [event]);

  const saveMutation = useMutation<void, Error, ThemeConfig>({
    mutationFn: async (t) => {
      setSaving(true);
      const { error } = await supabase
        .from("events")
        .update({ draft_theme: t })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => setToast({ message: "Saved", type: "success" }),
    onError: () => setToast({ message: "Failed to save", type: "error" }),
    onSettled: () => setSaving(false),
  });

  const debouncedSave = useRef(
    debounce((t: ThemeConfig) => {
      saveMutation.mutate(t);
    }, 800)
  ).current;

  const update = useCallback(
    (patch: Partial<ThemeConfig>) => {
      const next = { ...theme, ...patch };
      setTheme(next);
      debouncedSave(next);
    },
    [theme, debouncedSave]
  );

  const applyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) {
      const next = { ...preset, applyToAll: theme.applyToAll };
      setTheme(next);
      debouncedSave(next);
    }
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const previewEvent: UserEvent = { ...event, draft_theme: theme };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Theme Editor</h1>
          <p className="text-sm text-slate-500">Customize colors, fonts, and layout.</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
          </div>
        )}
      </div>
      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Preset</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors ${
                    theme.preset === key ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex gap-1">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primaryColor }} />
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accentColor }} />
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.bgColor }} />
                  </div>
                  <span className="capitalize text-slate-700">{key}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Colors</h3>
            <div className="space-y-3">
              <ColorInput label="Primary Color" value={theme.primaryColor || "#0f172a"} onChange={(v) => update({ primaryColor: v })} />
              <ColorInput label="Secondary Color" value={theme.secondaryColor || "#334155"} onChange={(v) => update({ secondaryColor: v })} />
              <ColorInput label="Accent Color" value={theme.accentColor || "#0ea5e9"} onChange={(v) => update({ accentColor: v })} />
              <ColorInput label="Background Color" value={theme.bgColor || "#ffffff"} onChange={(v) => update({ bgColor: v })} />
              <ColorInput label="Background Subtle" value={theme.bgSubtleColor || "#f8fafc"} onChange={(v) => update({ bgSubtleColor: v })} />
              <ColorInput label="Text Color" value={theme.textColor || "#1e293b"} onChange={(v) => update({ textColor: v })} />
              <ColorInput label="Text Muted Color" value={theme.textMutedColor || "#64748b"} onChange={(v) => update({ textMutedColor: v })} />
              <ColorInput label="Border Color" value={theme.borderColor || "#e2e8f0"} onChange={(v) => update({ borderColor: v })} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Fonts</h3>
            <div className="space-y-3">
              <FormField label="Heading Font">
                <Select value={theme.headingFont || "Inter"} onChange={(e) => update({ headingFont: e.target.value })}>
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Select>
              </FormField>
              <FormField label="Body Font">
                <Select value={theme.bodyFont || "Inter"} onChange={(e) => update({ bodyFont: e.target.value })}>
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Select>
              </FormField>
              <FormField label="Script Font">
                <Select value={theme.scriptFont || "Cormorant Garamond"} onChange={(e) => update({ scriptFont: e.target.value })}>
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Select>
              </FormField>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Layout</h3>
            <div className="space-y-3">
              <RangeInput label="Button Radius" value={theme.buttonRadius ?? 8} min={0} max={24} step={1} onChange={(v) => update({ buttonRadius: v })} />
              <RangeInput label="Section Padding" value={theme.sectionPadding ?? 64} min={32} max={128} step={4} onChange={(v) => update({ sectionPadding: v })} />
              <RangeInput label="Max Width" value={theme.maxWidth ?? 1200} min={600} max={1600} step={50} onChange={(v) => update({ maxWidth: v })} />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <Toggle
              checked={theme.applyToAll ?? false}
              onChange={(v) => update({ applyToAll: v })}
              label="Apply theme to all sections"
            />
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
