import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type ThemeConfig, type SavedTheme } from "../../lib/supabase";
import { THEME_PRESETS, DEFAULT_THEME, FONT_OPTIONS, themeToCssVars } from "../../lib/theme";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Select, ColorInput, Label } from "../../components/ui/Input";
import { Card } from "../../components/ui/index";
import { Save, Upload, Palette } from "lucide-react";

export function ThemeEditorPage() {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [customName, setCustomName] = useState("");
  const qc = useQueryClient();

  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      if (data) { const t = (data as Wedding).draft_theme_config || (data as Wedding).theme_config || (data as Wedding).theme || DEFAULT_THEME; setTheme(t); }
      return data as Wedding | null;
    },
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

  const save = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_theme_config: theme }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wedding"] }),
  });

  const publish = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_theme_config: theme, theme_config: theme }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wedding"] }),
  });

  const saveCustomTheme = useMutation({
    mutationFn: async () => {
      if (!wedding || !customName.trim()) throw new Error("Name required");
      const { error } = await supabase.from("saved_themes").insert({ wedding_id: wedding.id, name: customName.trim(), config: theme });
      if (error) throw error;
    },
    onSuccess: () => { setCustomName(""); qc.invalidateQueries({ queryKey: ["saved-themes"] }); },
  });

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setTheme({ ...theme, primary: preset.config.primary, secondary: preset.config.secondary, accent: preset.config.accent, bg: preset.config.bg, text: preset.config.text, buttonBg: preset.config.buttonBg, buttonText: preset.config.buttonText });
  };

  const update = (patch: Partial<ThemeConfig>) => setTheme({ ...theme, ...patch });

  const previewWedding = wedding ? { ...wedding, draft_theme_config: theme } : null;

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Theme Editor</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => save.mutate()} disabled={save.isPending}><Save className="mr-2 h-4 w-4" /> {save.isPending ? "Saving..." : "Save Draft"}</Button>
          <Button onClick={() => publish.mutate()} disabled={publish.isPending}><Upload className="mr-2 h-4 w-4" /> {publish.isPending ? "Publishing..." : "Publish"}</Button>
        </div>
      </div>

      <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <HomePreview wedding={previewWedding} device={d} />}>
        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Preset Themes</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_PRESETS.map((preset) => (
                <button key={preset.name} onClick={() => applyPreset(preset)} className="rounded-lg border border-gray-200 p-3 text-left transition hover:border-gray-900 hover:bg-gray-50">
                  <div className="mb-2 flex gap-1">
                    <div className="h-5 w-5 rounded-full border border-gray-200" style={{ background: preset.config.primary }} />
                    <div className="h-5 w-5 rounded-full border border-gray-200" style={{ background: preset.config.secondary }} />
                    <div className="h-5 w-5 rounded-full border border-gray-200" style={{ background: preset.config.accent }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{preset.name}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Colours</h3>
            <ColorInput label="Primary" value={theme.primary} onChange={(v) => update({ primary: v })} />
            <ColorInput label="Secondary" value={theme.secondary} onChange={(v) => update({ secondary: v })} />
            <ColorInput label="Accent" value={theme.accent} onChange={(v) => update({ accent: v })} />
            <ColorInput label="Background" value={theme.bg} onChange={(v) => update({ bg: v })} />
            <ColorInput label="Surface" value={theme.surface} onChange={(v) => update({ surface: v })} />
            <ColorInput label="Text" value={theme.text} onChange={(v) => update({ text: v })} />
            <ColorInput label="Text Muted" value={theme.textMuted} onChange={(v) => update({ textMuted: v })} />
            <ColorInput label="Border" value={theme.border} onChange={(v) => update({ border: v })} />
            <ColorInput label="Button Background" value={theme.buttonBg} onChange={(v) => update({ buttonBg: v })} />
            <ColorInput label="Button Text" value={theme.buttonText} onChange={(v) => update({ buttonText: v })} />
          </Card>

          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Fonts</h3>
            <div>
              <Label>Script Font</Label>
              <Select value={theme.scriptFont} onChange={(e) => update({ scriptFont: e.target.value })}>{FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}</Select>
            </div>
            <div>
              <Label>Heading Font</Label>
              <Select value={theme.headingFont} onChange={(e) => update({ headingFont: e.target.value })}>{FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}</Select>
            </div>
            <div>
              <Label>Body Font</Label>
              <Select value={theme.bodyFont} onChange={(e) => update({ bodyFont: e.target.value })}>{FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}</Select>
            </div>
            <div>
              <Label>UI Font</Label>
              <Select value={theme.uiFont} onChange={(e) => update({ uiFont: e.target.value })}>{FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}</Select>
            </div>
            <Input label="Heading Size" value={theme.headingSize} onChange={(e) => update({ headingSize: e.target.value })} />
            <Input label="Body Size" value={theme.bodySize} onChange={(e) => update({ bodySize: e.target.value })} />
            <Input label="Heading Weight" value={theme.headingWeight} onChange={(e) => update({ headingWeight: e.target.value })} />
            <Input label="Body Weight" value={theme.bodyWeight} onChange={(e) => update({ bodyWeight: e.target.value })} />
            <Input label="Letter Spacing" value={theme.letterSpacing} onChange={(e) => update({ letterSpacing: e.target.value })} />
          </Card>

          <Card className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Save Custom Theme</h3>
            <Input placeholder="Theme name" value={customName} onChange={(e) => setCustomName(e.target.value)} />
            <Button variant="outline" onClick={() => saveCustomTheme.mutate()} disabled={saveCustomTheme.isPending || !customName.trim()}><Palette className="mr-2 h-4 w-4" /> Save as Custom</Button>
            {savedThemes && savedThemes.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-gray-500">Saved Themes</p>
                {savedThemes.map((st) => (
                  <button key={st.id} onClick={() => setTheme(st.config)} className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-2 text-left hover:bg-gray-50">
                    <span className="text-sm text-gray-700">{st.name}</span>
                    <div className="flex gap-1">
                      <div className="h-4 w-4 rounded-full border border-gray-200" style={{ background: st.config.primary }} />
                      <div className="h-4 w-4 rounded-full border border-gray-200" style={{ background: st.config.accent }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </SplitEditor>
    </AdminLayout>
  );
}
