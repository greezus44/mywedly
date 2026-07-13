import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type ThemeConfig, type CoverConfig, type SavedTheme } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Label, Select, ColorInput } from "../../components/ui/Input";
import { Card, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { THEME_PRESETS, DEFAULT_THEME, FONT_OPTIONS } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { Save, Palette, Check } from "lucide-react";

export function ThemeEditorPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("presets");

  const { data: wedding, isLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const draftTheme: ThemeConfig = (wedding?.draft_theme_config && "colors" in wedding.draft_theme_config ? wedding.draft_theme_config : wedding?.theme_config && "colors" in wedding.theme_config ? wedding.theme_config : DEFAULT_THEME) as ThemeConfig;

  const [theme, setTheme] = useState<ThemeConfig>(draftTheme);

  useEffect(() => {
    if (wedding && JSON.stringify(draftTheme) !== JSON.stringify(theme)) {
      setTheme(draftTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedding]);

  const { data: savedThemes } = useQuery({
    queryKey: ["saved-themes", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("saved_themes").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as SavedTheme[];
    },
    enabled: !!wedding,
  });

  const saveDraft = useMutation({
    mutationFn: async (newTheme: ThemeConfig) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_theme_config: newTheme }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding"] }); setToast("Draft saved"); },
  });

  const publish = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ theme_config: theme, draft_theme_config: theme }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding"] }); setToast("Theme published successfully"); },
  });

  const saveCustomTheme = useMutation({
    mutationFn: async (name: string) => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("saved_themes").insert({ wedding_id: wedding.id, name, theme_config: theme, cover_config: (wedding.draft_cover_config || wedding.cover_config) as CoverConfig });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["saved-themes"] }); setToast("Theme saved to presets"); },
  });

  const update = (patch: Partial<ThemeConfig>) => {
    const newTheme = { ...theme, ...patch };
    setTheme(newTheme);
    saveDraft.mutate(newTheme);
  };

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Loading...</div></div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="p-6 text-gray-500">Wedding not found</div></AdminLayout>;

  const tc = theme.colors || {};
  const ty = theme.typography || {};
  const ui = theme.ui || {};

  const sections = [
    { key: "presets", label: "Presets" },
    { key: "colors", label: "Colours" },
    { key: "typography", label: "Typography" },
    { key: "ui", label: "UI" },
    { key: "saved", label: "Saved" },
  ];

  const previewWedding = { ...wedding, draft_theme_config: theme } as Wedding;

  return (
    <AdminLayout>
      <SplitEditor title="Theme Editor" preview={<HomePreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-indigo-600" />
            <h2 className="font-ui text-base font-semibold text-gray-900">Theme Editor</h2>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 flex-wrap border-b border-gray-100 pb-3">
            {sections.map((s) => (
              <button key={s.key} onClick={() => setActiveSection(s.key)} className={cn("px-3 py-1.5 text-xs font-ui font-medium rounded-lg transition-all", activeSection === s.key ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:text-gray-700")}>{s.label}</button>
            ))}
          </div>

          {activeSection === "presets" && (
            <div className="space-y-3">
              <p className="font-ui text-xs text-gray-500">Choose a preset theme to apply instantly.</p>
              {THEME_PRESETS.map((preset) => (
                <button key={preset.name} onClick={() => { setTheme(preset.theme); saveDraft.mutate(preset.theme); }} className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-400 transition-colors text-left">
                  <div className="flex gap-1">
                    <div className="w-6 h-6 rounded-full border border-gray-200" style={{ background: preset.theme.colors?.primary }} />
                    <div className="w-6 h-6 rounded-full border border-gray-200" style={{ background: preset.theme.colors?.background }} />
                    <div className="w-6 h-6 rounded-full border border-gray-200" style={{ background: preset.theme.colors?.accent }} />
                  </div>
                  <span className="font-ui text-sm text-gray-900 flex-1">{preset.name}</span>
                  {JSON.stringify(theme) === JSON.stringify(preset.theme) && <Check size={16} className="text-indigo-600" />}
                </button>
              ))}
            </div>
          )}

          {activeSection === "colors" && (
            <div className="space-y-4">
              <FormField label="Primary Colour"><ColorInput value={tc.primary || "#b8973a"} onChange={(v) => update({ colors: { ...tc, primary: v } })} /></FormField>
              <FormField label="Primary Light"><ColorInput value={tc.primaryLight || "#d4b85c"} onChange={(v) => update({ colors: { ...tc, primaryLight: v } })} /></FormField>
              <FormField label="Primary Dark"><ColorInput value={tc.primaryDark || "#8a6f28"} onChange={(v) => update({ colors: { ...tc, primaryDark: v } })} /></FormField>
              <FormField label="Background"><ColorInput value={tc.background || "#f5edda"} onChange={(v) => update({ colors: { ...tc, background: v } })} /></FormField>
              <FormField label="Background Light"><ColorInput value={tc.backgroundLight || "#faf5e8"} onChange={(v) => update({ colors: { ...tc, backgroundLight: v } })} /></FormField>
              <FormField label="Surface"><ColorInput value={tc.surface || "#ffffff"} onChange={(v) => update({ colors: { ...tc, surface: v } })} /></FormField>
              <FormField label="Text"><ColorInput value={tc.text || "#2a2a2a"} onChange={(v) => update({ colors: { ...tc, text: v } })} /></FormField>
              <FormField label="Text Muted"><ColorInput value={tc.textMuted || "#8a8a8a"} onChange={(v) => update({ colors: { ...tc, textMuted: v } })} /></FormField>
              <FormField label="Border"><ColorInput value={tc.border || "#b8973a"} onChange={(v) => update({ colors: { ...tc, border: v } })} /></FormField>
              <FormField label="Accent"><ColorInput value={tc.accent || "#c9a0a0"} onChange={(v) => update({ colors: { ...tc, accent: v } })} /></FormField>
            </div>
          )}

          {activeSection === "typography" && (
            <div className="space-y-4">
              <FormField label="Script Font">
                <Select value={ty.scriptFont || "Playfair Display"} onChange={(e) => update({ typography: { ...ty, scriptFont: e.target.value } })} className="!bg-white !border-gray-200 !text-gray-700">
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </FormField>
              <FormField label="Heading Font">
                <Select value={ty.headingFont || "Cormorant Garamond"} onChange={(e) => update({ typography: { ...ty, headingFont: e.target.value } })} className="!bg-white !border-gray-200 !text-gray-700">
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </FormField>
              <FormField label="Body Font">
                <Select value={ty.bodyFont || "Cormorant Garamond"} onChange={(e) => update({ typography: { ...ty, bodyFont: e.target.value } })} className="!bg-white !border-gray-200 !text-gray-700">
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </FormField>
              <FormField label="UI Font">
                <Select value={ty.uiFont || "Jost"} onChange={(e) => update({ typography: { ...ty, uiFont: e.target.value } })} className="!bg-white !border-gray-200 !text-gray-700">
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </FormField>
              <FormField label="Script Size"><Input value={ty.scriptSize || "3rem"} onChange={(e) => update({ typography: { ...ty, scriptSize: e.target.value } })} /></FormField>
              <FormField label="Heading Size"><Input value={ty.headingSize || "1.5rem"} onChange={(e) => update({ typography: { ...ty, headingSize: e.target.value } })} /></FormField>
              <FormField label="Body Size"><Input value={ty.bodySize || "1.0625rem"} onChange={(e) => update({ typography: { ...ty, bodySize: e.target.value } })} /></FormField>
              <FormField label="Letter Spacing"><Input value={ty.letterSpacing || "0.15em"} onChange={(e) => update({ typography: { ...ty, letterSpacing: e.target.value } })} /></FormField>
            </div>
          )}

          {activeSection === "ui" && (
            <div className="space-y-4">
              <FormField label="Corner Radius"><Input value={ui.radius || "8px"} onChange={(e) => update({ ui: { ...ui, radius: e.target.value } })} /></FormField>
              <FormField label="Button Radius"><Input value={ui.buttonRadius || "8px"} onChange={(e) => update({ ui: { ...ui, buttonRadius: e.target.value } })} /></FormField>
              <FormField label="Button Style">
                <Select value={ui.buttonStyle || "outline"} onChange={(e) => update({ ui: { ...ui, buttonStyle: e.target.value } })} className="!bg-white !border-gray-200 !text-gray-700">
                  <option value="outline">Outline</option>
                  <option value="solid">Solid</option>
                </Select>
              </FormField>
            </div>
          )}

          {activeSection === "saved" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input id="theme-name" placeholder="Theme name" className="!bg-white !border-gray-200 !text-gray-700" />
                <Button variant="primary" size="md" onClick={() => { const input = document.getElementById("theme-name") as HTMLInputElement; if (input.value) { saveCustomTheme.mutate(input.value); input.value = ""; } }}>
                  <Save size={14} className="mr-1" /> Save
                </Button>
              </div>
              <div className="space-y-2">
                {savedThemes && savedThemes.length > 0 ? (
                  savedThemes.map((st) => (
                    <button key={st.id} onClick={() => { setTheme(st.theme_config); saveDraft.mutate(st.theme_config); }} className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-400 transition-colors text-left">
                      <div className="flex gap-1">
                        <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: st.theme_config.colors?.primary }} />
                        <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: st.theme_config.colors?.background }} />
                      </div>
                      <span className="font-ui text-sm text-gray-900 flex-1">{st.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="font-ui text-sm text-gray-400 text-center py-4">No saved themes yet</p>
                )}
              </div>
            </div>
          )}

          {/* Publish button */}
          <div className="pt-4 border-t border-gray-100">
            <Button variant="primary" size="md" className="w-full" onClick={() => publish.mutate()} disabled={publish.isPending}>
              <Save size={14} className="mr-2" /> Publish Theme
            </Button>
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
