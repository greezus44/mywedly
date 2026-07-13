import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type ThemeConfig, type SavedTheme } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Select, ColorInput, RangeInput, Label } from "../../components/ui/Input";
import { Card, Badge } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { THEME_PRESETS, DEFAULT_THEME, FONT_OPTIONS } from "../../lib/theme";
import { Save, Palette, Check } from "lucide-react";

export function ThemeEditorPage() {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [savedThemeName, setSavedThemeName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      if (data) {
        const t = (data as Wedding).draft_theme_config || (data as Wedding).theme_config || (data as Wedding).theme || DEFAULT_THEME;
        setTheme(t);
      }
      return data as Wedding | null;
    },
  });

  const { data: savedThemes } = useQuery({
    queryKey: ["saved-themes"],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("saved_themes").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as SavedTheme[];
    },
    enabled: !!wedding,
  });

  const saveDraft = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_theme_config: theme }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wedding"] });
      setToast("Draft saved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const publish = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_theme_config: theme, theme_config: theme }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wedding"] });
      setToast("Theme published");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const saveCustomTheme = useMutation({
    mutationFn: async () => {
      if (!wedding || !savedThemeName.trim()) throw new Error("Enter a name");
      const { error } = await supabase.from("saved_themes").insert({ wedding_id: wedding.id, name: savedThemeName.trim(), config: theme });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-themes"] });
      setSavedThemeName("");
      setToast("Theme saved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const applyPreset = (presetConfig: Partial<ThemeConfig>) => {
    setTheme({ ...theme, ...presetConfig } as ThemeConfig);
  };

  const applySavedTheme = (config: ThemeConfig) => {
    setTheme(config);
  };

  const update = (patch: Partial<ThemeConfig>) => setTheme({ ...theme, ...patch });

  const previewWedding: Wedding | null = wedding ? { ...wedding, draft_theme_config: theme } : null;

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Theme Editor</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => saveDraft.mutate()} disabled={saveDraft.isPending}>
            <Save className="mr-2 h-4 w-4" /> {saveDraft.isPending ? "Saving..." : "Save Draft"}
          </Button>
          <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
            <Check className="mr-2 h-4 w-4" /> {publish.isPending ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <HomePreview wedding={previewWedding} device={d} />}>
        <div className="space-y-4">
          {/* Presets */}
          <Card>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <Palette className="h-4 w-4 text-indigo-600" /> Theme Presets
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset.config)}
                  className="rounded-lg border border-gray-200 p-2 text-left transition hover:border-indigo-400 hover:bg-indigo-50"
                >
                  <div className="mb-1 flex gap-1">
                    {[preset.config.primary, preset.config.secondary, preset.config.accent, preset.config.buttonBg].map((c, i) => (
                      <div key={i} className="h-4 w-4 rounded-full border border-gray-200" style={{ background: c }} />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{preset.name}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Saved Themes */}
          {savedThemes && savedThemes.length > 0 && (
            <Card>
              <h3 className="mb-3 font-semibold text-gray-900">Saved Themes</h3>
              <div className="space-y-2">
                {savedThemes.map((st) => (
                  <div key={st.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2">
                    <span className="text-sm font-medium text-gray-700">{st.name}</span>
                    <Button size="sm" variant="ghost" onClick={() => applySavedTheme(st.config)}>Apply</Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Custom Colours */}
          <Card className="space-y-4">
            <h3 className="font-semibold text-gray-900">Custom Colours</h3>
            <div className="grid grid-cols-2 gap-3">
              <ColorInput label="Primary" value={theme.primary} onChange={(v) => update({ primary: v })} />
              <ColorInput label="Secondary" value={theme.secondary} onChange={(v) => update({ secondary: v })} />
              <ColorInput label="Accent" value={theme.accent} onChange={(v) => update({ accent: v })} />
              <ColorInput label="Background" value={theme.bg} onChange={(v) => update({ bg: v })} />
              <ColorInput label="Surface" value={theme.surface} onChange={(v) => update({ surface: v })} />
              <ColorInput label="Text" value={theme.text} onChange={(v) => update({ text: v })} />
              <ColorInput label="Text Muted" value={theme.textMuted} onChange={(v) => update({ textMuted: v })} />
              <ColorInput label="Border" value={theme.border} onChange={(v) => update({ border: v })} />
              <ColorInput label="Button BG" value={theme.buttonBg} onChange={(v) => update({ buttonBg: v })} />
              <ColorInput label="Button Text" value={theme.buttonText} onChange={(v) => update({ buttonText: v })} />
            </div>
          </Card>

          {/* Typography */}
          <Card className="space-y-4">
            <h3 className="font-semibold text-gray-900">Typography</h3>
            <FormField label="Script Font">
              <Select value={theme.scriptFont} onChange={(e) => update({ scriptFont: e.target.value })}>
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
            </FormField>
            <FormField label="Heading Font">
              <Select value={theme.headingFont} onChange={(e) => update({ headingFont: e.target.value })}>
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
            </FormField>
            <FormField label="Body Font">
              <Select value={theme.bodyFont} onChange={(e) => update({ bodyFont: e.target.value })}>
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
            </FormField>
            <FormField label="UI Font">
              <Select value={theme.uiFont} onChange={(e) => update({ uiFont: e.target.value })}>
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
            </FormField>
            <FormField label="Heading Size">
              <Input value={theme.headingSize} onChange={(e) => update({ headingSize: e.target.value })} placeholder="3rem" />
            </FormField>
            <FormField label="Body Size">
              <Input value={theme.bodySize} onChange={(e) => update({ bodySize: e.target.value })} placeholder="1rem" />
            </FormField>
            <FormField label="Heading Weight">
              <Select value={theme.headingWeight} onChange={(e) => update({ headingWeight: e.target.value })}>
                <option value="300">Light (300)</option>
                <option value="400">Regular (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semibold (600)</option>
                <option value="700">Bold (700)</option>
              </Select>
            </FormField>
            <FormField label="Body Weight">
              <Select value={theme.bodyWeight} onChange={(e) => update({ bodyWeight: e.target.value })}>
                <option value="300">Light (300)</option>
                <option value="400">Regular (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semibold (600)</option>
                <option value="700">Bold (700)</option>
              </Select>
            </FormField>
            <FormField label="Letter Spacing">
              <Input value={theme.letterSpacing} onChange={(e) => update({ letterSpacing: e.target.value })} placeholder="0.02em" />
            </FormField>
          </Card>

          {/* Save Custom Theme */}
          <Card>
            <h3 className="mb-3 font-semibold text-gray-900">Save Custom Theme</h3>
            <div className="flex gap-2">
              <Input value={savedThemeName} onChange={(e) => setSavedThemeName(e.target.value)} placeholder="Theme name" />
              <Button onClick={() => saveCustomTheme.mutate()} disabled={saveCustomTheme.isPending || !savedThemeName.trim()}>
                Save
              </Button>
            </div>
          </Card>
        </div>
      </SplitEditor>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
