import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Select } from "../../components/ui/Input";
import { ColorInput, RangeInput, Toggle, FormField, Toast, Skeleton } from "../../components/ui";
import { THEME_PRESETS, DEFAULT_THEME, FONT_OPTIONS } from "../../lib/theme";

export default function ThemeEditor() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (event && !initialized.current) {
      setTheme(event.draft_theme || event.theme || DEFAULT_THEME);
      initialized.current = true;
    }
  }, [event]);

  const saveMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { error } = await supabase
        .from("events")
        .update({ draft_theme: theme })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => setToast({ message: "Saved", type: "success" }),
    onError: () => setToast({ message: "Failed to save", type: "error" }),
  });

  const debouncedSave = useRef(debounce(() => saveMutation.mutate(), 600)).current;

  const triggerSave = useCallback(() => {
    if (!initialized.current) return;
    debouncedSave();
  }, [debouncedSave]);

  const update = (patch: Partial<ThemeConfig>) => {
    setTheme((prev) => ({ ...prev, ...patch }));
    triggerSave();
  };

  const applyPreset = (presetName: string) => {
    const preset = THEME_PRESETS[presetName];
    if (preset) {
      setTheme({ ...preset, preset: presetName });
      triggerSave();
    }
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
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Theme Editor</h1>
      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="space-y-5">
          <FormField label="Preset">
            <Select value={theme.preset || "classic"} onChange={(e) => applyPreset(e.target.value)}>
              {Object.entries(THEME_PRESETS).map(([key, val]) => (
                <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
              ))}
            </Select>
          </FormField>

          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide pt-2 border-t border-slate-100">Colors</h2>
          <FormField label="Primary Color">
            <ColorInput value={theme.primaryColor || "#0f172a"} onChange={(v) => update({ primaryColor: v })} />
          </FormField>
          <FormField label="Secondary Color">
            <ColorInput value={theme.secondaryColor || "#334155"} onChange={(v) => update({ secondaryColor: v })} />
          </FormField>
          <FormField label="Accent Color">
            <ColorInput value={theme.accentColor || "#0ea5e9"} onChange={(v) => update({ accentColor: v })} />
          </FormField>
          <FormField label="Background Color">
            <ColorInput value={theme.bgColor || "#ffffff"} onChange={(v) => update({ bgColor: v })} />
          </FormField>
          <FormField label="Background Subtle Color">
            <ColorInput value={theme.bgSubtleColor || "#f8fafc"} onChange={(v) => update({ bgSubtleColor: v })} />
          </FormField>
          <FormField label="Text Color">
            <ColorInput value={theme.textColor || "#1e293b"} onChange={(v) => update({ textColor: v })} />
          </FormField>
          <FormField label="Text Muted Color">
            <ColorInput value={theme.textMutedColor || "#64748b"} onChange={(v) => update({ textMutedColor: v })} />
          </FormField>
          <FormField label="Border Color">
            <ColorInput value={theme.borderColor || "#e2e8f0"} onChange={(v) => update({ borderColor: v })} />
          </FormField>

          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide pt-2 border-t border-slate-100">Typography</h2>
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

          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide pt-2 border-t border-slate-100">Layout</h2>
          <FormField label={`Button Radius: ${theme.buttonRadius ?? 8}px`}>
            <RangeInput value={theme.buttonRadius ?? 8} onChange={(v) => update({ buttonRadius: v })} min={0} max={24} step={1} />
          </FormField>
          <FormField label={`Section Padding: ${theme.sectionPadding ?? 64}px`}>
            <RangeInput value={theme.sectionPadding ?? 64} onChange={(v) => update({ sectionPadding: v })} min={16} max={128} step={4} />
          </FormField>
          <FormField label={`Max Width: ${theme.maxWidth ?? 1200}px`}>
            <RangeInput value={theme.maxWidth ?? 1200} onChange={(v) => update({ maxWidth: v })} min={600} max={1600} step={50} />
          </FormField>

          <div className="pt-2 border-t border-slate-100">
            <Toggle checked={theme.applyToAll ?? false} onChange={(v) => update({ applyToAll: v })} label="Apply to all pages" />
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
