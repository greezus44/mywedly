import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type ThemeConfig, type CoverConfig, type SavedTheme } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Select, ColorInput } from "../../components/ui/Input";
import { Card, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { THEME_PRESETS, DEFAULT_THEME, DEFAULT_COVER_CONFIG, FONT_OPTIONS } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { Save, Send, Check } from "lucide-react";

export function ThemeEditorPage() {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [cover, setCover] = useState<CoverConfig>(DEFAULT_COVER_CONFIG);
  const [themeName, setThemeName] = useState("My Custom Theme");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading, error } = useQuery<Wedding>({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: savedThemes } = useQuery<SavedTheme[]>({
    queryKey: ["saved-themes", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("saved_themes").select("*").eq("wedding_id", wedding.id);
      return (data || []) as SavedTheme[];
    },
    enabled: !!wedding,
  });

  useEffect(() => {
    if (wedding) {
      const draftT = wedding.draft_theme_config;
      if (draftT && "colors" in draftT) setTheme(draftT as ThemeConfig);
      else if (wedding.theme_config && "colors" in wedding.theme_config) setTheme(wedding.theme_config as ThemeConfig);
      const draftC = wedding.draft_cover_config;
      if (draftC && "colors" in draftC) setCover(draftC as CoverConfig);
      else if (wedding.cover_config && "colors" in wedding.cover_config) setCover(wedding.cover_config as CoverConfig);
    }
  }, [wedding]);

  const updateColor = (key: string, value: string) => setTheme((p) => ({ ...p, colors: { ...p.colors, [key]: value } }));
  const updateTypography = (key: string, value: string) => setTheme((p) => ({ ...p, typography: { ...p.typography, [key]: value } }));

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setTheme(preset.theme);
    setCover(preset.cover);
    setThemeName(preset.name);
    setToast({ message: `Applied ${preset.name}`, type: "success" });
  };

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_theme_config: theme, draft_cover_config: cover }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Draft saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save draft", type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_theme_config: theme, draft_cover_config: cover, theme_config: theme, cover_config: cover }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Theme published!", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish", type: "error" }),
  });

  const saveCustomThemeMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("saved_themes").insert({ wedding_id: wedding.id, name: themeName, theme_config: theme, cover_config: cover });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-themes", wedding?.id] });
      setToast({ message: "Custom theme saved!", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save custom theme", type: "error" }),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-gray-500">Loading theme editor...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data.</p>
        </div>
      </AdminLayout>
    );
  }

  const previewWedding = { ...wedding, draft_theme_config: theme, draft_cover_config: cover } as Wedding;
  const colors = theme.colors || {};
  const typography = theme.typography || {};
  const ui = theme.ui || {};

  return (
    <AdminLayout>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <h1 className="font-ui text-base font-semibold text-gray-900">Theme Editor</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => saveDraftMutation.mutate()} disabled={saveDraftMutation.isPending}>
              <Save size={14} className="mr-1.5" /> Save Draft
            </Button>
            <button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white font-ui text-xs font-medium uppercase tracking-wider rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Send size={14} /> Publish
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <SplitEditor title="Theme Preview" preview={<HomePreview wedding={previewWedding} />}>
            <Card className="p-5 mb-4">
              <h3 className="font-ui text-sm font-semibold text-gray-900 mb-4">Preset Themes</h3>
              <div className="grid grid-cols-2 gap-3">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-left hover:border-indigo-400",
                      theme.colors?.primary === preset.theme.colors?.primary ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      {preset.theme.colors && [preset.theme.colors.primary, preset.theme.colors.primaryLight, preset.theme.colors.primaryDark].map((c, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border border-gray-200" style={{ background: c }} />
                      ))}
                    </div>
                    <p className="font-ui text-xs font-medium text-gray-900">{preset.name}</p>
                    {theme.colors?.primary === preset.theme.colors?.primary && <Check size={12} className="text-indigo-600 mt-1" />}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-5 mb-4">
              <h3 className="font-ui text-sm font-semibold text-gray-900 mb-4">Custom Colours</h3>
              <div className="space-y-4">
                <FormField label="Primary"><ColorInput value={colors.primary || "#b8973a"} onChange={(v) => updateColor("primary", v)} /></FormField>
                <FormField label="Primary Light"><ColorInput value={colors.primaryLight || "#d4b85c"} onChange={(v) => updateColor("primaryLight", v)} /></FormField>
                <FormField label="Primary Dark"><ColorInput value={colors.primaryDark || "#8a6f28"} onChange={(v) => updateColor("primaryDark", v)} /></FormField>
                <FormField label="Background"><ColorInput value={colors.background || "#f5edda"} onChange={(v) => updateColor("background", v)} /></FormField>
                <FormField label="Background Light"><ColorInput value={colors.backgroundLight || "#faf5e8"} onChange={(v) => updateColor("backgroundLight", v)} /></FormField>
                <FormField label="Surface"><ColorInput value={colors.surface || "#ffffff"} onChange={(v) => updateColor("surface", v)} /></FormField>
                <FormField label="Text"><ColorInput value={colors.text || "#2a2a2a"} onChange={(v) => updateColor("text", v)} /></FormField>
                <FormField label="Text Muted"><ColorInput value={colors.textMuted || "#8a8a8a"} onChange={(v) => updateColor("textMuted", v)} /></FormField>
                <FormField label="Border"><ColorInput value={colors.border || "#b8973a"} onChange={(v) => updateColor("border", v)} /></FormField>
                <FormField label="Accent"><ColorInput value={colors.accent || "#c9a0a0"} onChange={(v) => updateColor("accent", v)} /></FormField>
              </div>
            </Card>

            <Card className="p-5 mb-4">
              <h3 className="font-ui text-sm font-semibold text-gray-900 mb-4">Typography</h3>
              <div className="space-y-4">
                <FormField label="Script Font">
                  <Select value={typography.scriptFont || "Playfair Display"} onChange={(e) => updateTypography("scriptFont", e.target.value)}>
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </Select>
                </FormField>
                <FormField label="Heading Font">
                  <Select value={typography.headingFont || "Cormorant Garamond"} onChange={(e) => updateTypography("headingFont", e.target.value)}>
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </Select>
                </FormField>
                <FormField label="Body Font">
                  <Select value={typography.bodyFont || "Cormorant Garamond"} onChange={(e) => updateTypography("bodyFont", e.target.value)}>
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </Select>
                </FormField>
                <FormField label="UI Font">
                  <Select value={typography.uiFont || "Jost"} onChange={(e) => updateTypography("uiFont", e.target.value)}>
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </Select>
                </FormField>
                <FormField label="Script Size"><Input value={typography.scriptSize || "3rem"} onChange={(e) => updateTypography("scriptSize", e.target.value)} /></FormField>
                <FormField label="Heading Size"><Input value={typography.headingSize || "1.5rem"} onChange={(e) => updateTypography("headingSize", e.target.value)} /></FormField>
                <FormField label="Body Size"><Input value={typography.bodySize || "1.0625rem"} onChange={(e) => updateTypography("bodySize", e.target.value)} /></FormField>
                <FormField label="Letter Spacing"><Input value={typography.letterSpacing || "0.15em"} onChange={(e) => updateTypography("letterSpacing", e.target.value)} /></FormField>
              </div>
            </Card>

            <Card className="p-5 mb-4">
              <h3 className="font-ui text-sm font-semibold text-gray-900 mb-4">UI</h3>
              <div className="space-y-4">
                <FormField label="Corner Radius">
                  <Input value={ui.radius || "8px"} onChange={(e) => setTheme((p) => ({ ...p, ui: { ...p.ui, radius: e.target.value } }))} placeholder="8px" />
                </FormField>
                <FormField label="Button Radius">
                  <Input value={ui.buttonRadius || "8px"} onChange={(e) => setTheme((p) => ({ ...p, ui: { ...p.ui, buttonRadius: e.target.value } }))} placeholder="8px" />
                </FormField>
                <FormField label="Button Style">
                  <Select value={ui.buttonStyle || "outline"} onChange={(e) => setTheme((p) => ({ ...p, ui: { ...p.ui, buttonStyle: e.target.value } }))}>
                    <option value="outline">Outline</option>
                    <option value="solid">Solid</option>
                    <option value="underline">Underline</option>
                  </Select>
                </FormField>
              </div>
            </Card>

            <Card className="p-5 mb-4">
              <h3 className="font-ui text-sm font-semibold text-gray-900 mb-4">Save Custom Theme</h3>
              <div className="space-y-3">
                <FormField label="Theme Name">
                  <Input value={themeName} onChange={(e) => setThemeName(e.target.value)} placeholder="My Custom Theme" />
                </FormField>
                <Button variant="outline" size="sm" onClick={() => saveCustomThemeMutation.mutate()} disabled={saveCustomThemeMutation.isPending}>
                  <Save size={14} className="mr-1.5" /> Save to Saved Themes
                </Button>
                {(savedThemes || []).length > 0 && (
                  <div className="pt-2">
                    <p className="font-ui text-xs font-medium text-gray-500 mb-2">Saved Themes</p>
                    <div className="space-y-1.5">
                      {(savedThemes || []).map((st) => (
                        <button
                          key={st.id}
                          onClick={() => { setTheme(st.theme_config); setCover(st.cover_config); setThemeName(st.name); }}
                          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <span className="font-ui text-xs font-medium text-gray-700">{st.name}</span>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: st.theme_config.colors?.primary }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </SplitEditor>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </AdminLayout>
  );
}
