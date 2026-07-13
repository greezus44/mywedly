import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type ThemeConfig, type SavedTheme } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { ColorInput, Select, Label } from "../../components/ui/Input";
import { Card } from "../../components/ui/index";
import { THEME_PRESETS, DEFAULT_THEME, FONT_OPTIONS, themeToCssVars } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { Save, Upload, Palette, Check } from "lucide-react";

export function ThemeEditorPage() {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [toast, setToast] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: wedding } = useQuery({
    queryKey: ["wedding", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.id).maybeSingle();
      return data as Wedding | null;
    },
    enabled: !!user,
  });

  const { data: savedThemes } = useQuery({
    queryKey: ["saved-themes", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("saved_themes").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as SavedTheme[];
    },
    enabled: !!wedding,
  });

  useEffect(() => {
    if (wedding) {
      const t = wedding.draft_theme_config || wedding.theme_config || wedding.theme || DEFAULT_THEME;
      setTheme(t);
    }
  }, [wedding]);

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("weddings").update({ draft_theme_config: theme }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] });
      setToast("Draft saved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("weddings").update({ draft_theme_config: theme, theme_config: theme }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] });
      setToast("Theme published!");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const saveThemeMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("saved_themes").insert({ wedding_id: wedding.id, name, config: theme });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-themes", wedding?.id] });
      setToast("Theme saved to presets");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setTheme((prev) => ({
      ...prev,
      primary: preset.config.primary,
      secondary: preset.config.secondary,
      accent: preset.config.accent,
      bg: preset.config.bg,
      text: preset.config.text,
      buttonBg: preset.config.buttonBg,
      buttonText: preset.config.buttonText,
    }));
  };

  const updateField = <K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading theme editor...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Theme Editor</h1>
            <p className="mt-1 text-sm text-gray-500">Customize colors and fonts for your wedding invitation.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => saveDraftMutation.mutate()} disabled={saveDraftMutation.isPending}>
              <Save className="mr-1.5 h-4 w-4" /> Save Draft
            </Button>
            <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              <Upload className="mr-1.5 h-4 w-4" /> Publish
            </Button>
          </div>
        </div>

        <SplitEditor
          preview={(device: DeviceType) => <HomePreview wedding={{ ...wedding, draft_theme_config: theme } as Wedding} device={device} />}
        >
          <div className="space-y-6">
            {/* Presets */}
            <div>
              <Label className="mb-3">Theme Presets</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      "rounded-lg border-2 p-3 text-left transition hover:border-gray-900",
                      theme.primary === preset.config.primary ? "border-gray-900" : "border-gray-200"
                    )}
                  >
                    <div className="mb-2 flex gap-1">
                      <div className="h-6 w-6 rounded-full" style={{ background: preset.config.primary }} />
                      <div className="h-6 w-6 rounded-full" style={{ background: preset.config.accent }} />
                      <div className="h-6 w-6 rounded-full border border-gray-200" style={{ background: preset.config.bg }} />
                    </div>
                    <p className="text-xs font-medium text-gray-900">{preset.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Saved Themes */}
            {savedThemes && savedThemes.length > 0 && (
              <div>
                <Label className="mb-3">Saved Themes</Label>
                <div className="space-y-2">
                  {savedThemes.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setTheme(st.config)}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition"
                    >
                      <span className="text-sm font-medium text-gray-900">{st.name}</span>
                      <div className="flex gap-1">
                        <div className="h-4 w-4 rounded-full" style={{ background: st.config.primary }} />
                        <div className="h-4 w-4 rounded-full" style={{ background: st.config.accent }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            <div>
              <Label className="mb-3">Custom Colors</Label>
              <div className="space-y-3">
                <ColorInput label="Primary Color" value={theme.primary} onChange={(v) => updateField("primary", v)} />
                <ColorInput label="Secondary Color" value={theme.secondary} onChange={(v) => updateField("secondary", v)} />
                <ColorInput label="Accent Color" value={theme.accent} onChange={(v) => updateField("accent", v)} />
                <ColorInput label="Background Color" value={theme.bg} onChange={(v) => updateField("bg", v)} />
                <ColorInput label="Surface Color" value={theme.surface} onChange={(v) => updateField("surface", v)} />
                <ColorInput label="Text Color" value={theme.text} onChange={(v) => updateField("text", v)} />
                <ColorInput label="Muted Text Color" value={theme.textMuted} onChange={(v) => updateField("textMuted", v)} />
                <ColorInput label="Border Color" value={theme.border} onChange={(v) => updateField("border", v)} />
                <ColorInput label="Button Background" value={theme.buttonBg} onChange={(v) => updateField("buttonBg", v)} />
                <ColorInput label="Button Text" value={theme.buttonText} onChange={(v) => updateField("buttonText", v)} />
              </div>
            </div>

            {/* Fonts */}
            <div>
              <Label className="mb-3">Typography</Label>
              <div className="space-y-3">
                <Select label="Script Font" value={theme.scriptFont} onChange={(e) => updateField("scriptFont", e.target.value)}>
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
                <Select label="Heading Font" value={theme.headingFont} onChange={(e) => updateField("headingFont", e.target.value)}>
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
                <Select label="Body Font" value={theme.bodyFont} onChange={(e) => updateField("bodyFont", e.target.value)}>
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
                <Select label="UI Font" value={theme.uiFont} onChange={(e) => updateField("uiFont", e.target.value)}>
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </div>
            </div>

            {/* Save Current as Preset */}
            <div>
              <Button variant="outline" onClick={() => {
                const name = prompt("Name this theme:");
                if (name) saveThemeMutation.mutate(name);
              }}>
                <Palette className="mr-1.5 h-4 w-4" /> Save Current as Preset
              </Button>
            </div>
          </div>
        </SplitEditor>

        {toast && (
          <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
