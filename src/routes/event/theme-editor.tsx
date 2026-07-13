import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import { DEFAULT_THEME, THEME_PRESETS, FONT_OPTIONS } from "../../lib/theme";
import { debounce } from "../../lib/utils";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { ColorInput, RangeInput, Toggle, FormField, Toast, Skeleton } from "../../components/ui";
import { Select } from "../../components/ui/Input";

export default function ThemeEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();

  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!event) return;
    setTheme(event.draft_theme || event.theme || DEFAULT_THEME);
    initialized.current = true;
  }, [event]);

  const save = useCallback(async (data: ThemeConfig) => {
    if (!eventId) return;
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = { draft_theme: data };
      if (data.applyToAll) {
        updateData.cover_config = { ...(event?.draft_cover_config || event?.cover_config || {}), bgColor: data.bgColor, textColor: data.textColor, buttonColor: data.primaryColor };
        updateData.login_config = { ...(event?.draft_login_config || event?.login_config || {}), bgColor: data.bgColor, textColor: data.textColor, buttonColor: data.primaryColor };
      }
      const { error } = await supabase.from("events").update(updateData).eq("id", eventId);
      if (error) throw error;
      setToast({ message: "Saved", type: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Save failed", type: "error" });
    } finally {
      setSaving(false);
    }
  }, [eventId, event]);

  const debouncedSave = useRef(debounce(save, 800)).current;

  const update = (patch: Partial<ThemeConfig>) => {
    setTheme((prev) => {
      const next = { ...prev, ...patch };
      if (initialized.current) debouncedSave(next);
      return next;
    });
  };

  const applyPreset = (presetName: string) => {
    const preset = THEME_PRESETS[presetName];
    if (!preset) return;
    setTheme(preset);
    if (initialized.current) debouncedSave(preset);
  };

  if (!event) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const previewEvent: UserEvent = { ...event, draft_theme: theme };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Theme Editor</h1>
          <p className="text-sm text-slate-500">Customize colors, fonts, and layout</p>
        </div>
        {saving && <span className="text-sm text-slate-500">Saving...</span>}
      </div>
      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="space-y-5">
          <FormField label="Preset">
            <Select value={theme.preset || "classic"} onChange={(e) => applyPreset(e.target.value)}>
              {Object.entries(THEME_PRESETS).map(([key, val]) => (
                <option key={key} value={key}>{(val.preset || key).charAt(0).toUpperCase() + (val.preset || key).slice(1)}</option>
              ))}
            </Select>
          </FormField>

          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Colors</h2>
            <div className="space-y-3">
              <ColorInput label="Primary Color" value={theme.primaryColor || "#0f172a"} onChange={(v) => update({ primaryColor: v })} />
              <ColorInput label="Secondary Color" value={theme.secondaryColor || "#334155"} onChange={(v) => update({ secondaryColor: v })} />
              <ColorInput label="Accent Color" value={theme.accentColor || "#0ea5e9"} onChange={(v) => update({ accentColor: v })} />
              <ColorInput label="Background Color" value={theme.bgColor || "#ffffff"} onChange={(v) => update({ bgColor: v })} />
              <ColorInput label="Background Subtle" value={theme.bgSubtleColor || "#f8fafc"} onChange={(v) => update({ bgSubtleColor: v })} />
              <ColorInput label="Text Color" value={theme.textColor || "#1e293b"} onChange={(v) => update({ textColor: v })} />
              <ColorInput label="Text Muted" value={theme.textMutedColor || "#64748b"} onChange={(v) => update({ textMutedColor: v })} />
              <ColorInput label="Border Color" value={theme.borderColor || "#e2e8f0"} onChange={(v) => update({ borderColor: v })} />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Fonts</h2>
            <FormField label="Heading Font">
              <Select value={theme.headingFont || "Inter"} onChange={(e) => update({ headingFont: e.target.value })}>
                {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </Select>
            </FormField>
            <div className="mt-3">
              <FormField label="Body Font">
                <Select value={theme.bodyFont || "Inter"} onChange={(e) => update({ bodyFont: e.target.value })}>
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Select>
              </FormField>
            </div>
            <div className="mt-3">
              <FormField label="Script Font">
                <Select value={theme.scriptFont || "Cormorant Garamond"} onChange={(e) => update({ scriptFont: e.target.value })}>
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Select>
              </FormField>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Layout</h2>
            <RangeInput label="Button Radius" value={theme.buttonRadius ?? 8} min={0} max={24} step={1} onChange={(v) => update({ buttonRadius: v })} />
            <div className="mt-3">
              <RangeInput label="Section Padding" value={theme.sectionPadding ?? 64} min={16} max={128} step={4} onChange={(v) => update({ sectionPadding: v })} />
            </div>
            <div className="mt-3">
              <RangeInput label="Max Width" value={theme.maxWidth ?? 1200} min={600} max={1600} step={50} onChange={(v) => update({ maxWidth: v })} />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Toggle checked={theme.applyToAll ?? false} onChange={(v) => update({ applyToAll: v })} label="Apply theme to all pages" />
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
