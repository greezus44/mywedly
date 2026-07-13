import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type ThemeConfig, type SavedTheme } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, ColorInput, Select, Label } from "../../components/ui/Input";
import { Card, Badge, Toast } from "../../components/ui/index";
import { THEME_PRESETS, DEFAULT_THEME, themeToCssVars, FONT_OPTIONS } from "../../lib/theme";
import { Check, Save, Upload, Palette } from "lucide-react";

export function ThemeEditorPage() {
  const queryClient = useQueryClient();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [device, setDevice] = useState<DeviceType>("desktop");

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });

  const { data: wed, isLoading: wedLoading, error: wedError } = useQuery({
    queryKey: ["wedding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user!.id).maybeSingle();
      if (error) throw error;
      return data as Wedding | null;
    },
  });

  useEffect(() => {
    if (wed) {
      setWedding(wed);
      const t = wed.draft_theme_config || wed.theme_config || wed.theme || DEFAULT_THEME;
      setTheme(t);
    }
  }, [wed]);

  const { data: saved } = useQuery({
    queryKey: ["saved-themes", wed?.id],
    enabled: !!wed,
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_themes").select("*").eq("wedding_id", wed!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SavedTheme[];
    },
  });

  useEffect(() => { if (saved) setSavedThemes(saved); }, [saved]);

  const saveDraftMutation = useMutation({
    mutationFn: async (newTheme: ThemeConfig) => {
      const { error } = await supabase.from("weddings").update({ draft_theme_config: newTheme }).eq("id", wedding!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] });
      setToast({ message: "Draft theme saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save draft", type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weddings").update({ draft_theme_config: theme, theme_config: theme, is_published: true }).eq("id", wedding!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] });
      setToast({ message: "Theme published!", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish", type: "error" }),
  });

  const saveThemeMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("saved_themes").insert({ wedding_id: wedding!.id, name, config: theme });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-themes", wed?.id] });
      setToast({ message: "Theme preset saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save preset", type: "error" }),
  });

  if (wedLoading) return <AdminLayout><div className="py-20 text-center text-gray-500">Loading…</div></AdminLayout>;
  if (wedError) return <AdminLayout><div className="py-20 text-center text-red-600">{wedError.message}</div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="py-20 text-center text-gray-500">No wedding found.</div></AdminLayout>;

  const update = (patch: Partial<ThemeConfig>) => setTheme((prev) => ({ ...prev, ...patch }));
  const previewWedding = { ...wedding, draft_theme_config: theme } as Wedding;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Theme Editor</h2>
            <p className="text-sm text-gray-500">Customize colors and fonts for your invitation.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => saveDraftMutation.mutate(theme)} disabled={saveDraftMutation.isPending}>
              <Save className="mr-1.5 h-4 w-4" /> Save Draft
            </Button>
            <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              <Upload className="mr-1.5 h-4 w-4" /> Publish
            </Button>
          </div>
        </div>

        <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <HomePreview wedding={previewWedding} device={d} />}>
          <div className="space-y-6">
            <div>
              <Label>Color Presets</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {THEME_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => update({ primary: p.config.primary, secondary: p.config.secondary, accent: p.config.accent, bg: p.config.bg, text: p.config.text, buttonBg: p.config.buttonBg, buttonText: p.config.buttonText })}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-left hover:border-gray-400 transition"
                  >
                    <div className="flex gap-1">
                      <span className="h-5 w-5 rounded-full border border-gray-200" style={{ background: p.config.primary }} />
                      <span className="h-5 w-5 rounded-full border border-gray-200" style={{ background: p.config.accent }} />
                      <span className="h-5 w-5 rounded-full border border-gray-200" style={{ background: p.config.bg }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Saved Themes</Label>
              {savedThemes.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No saved themes yet.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {savedThemes.map((st) => (
                    <button key={st.id} type="button" onClick={() => setTheme(st.config)} className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-2 text-left hover:bg-gray-50">
                      <span className="text-sm font-medium text-gray-700">{st.name}</span>
                      <div className="flex gap-1">
                        <span className="h-4 w-4 rounded-full border border-gray-200" style={{ background: st.config.primary }} />
                        <span className="h-4 w-4 rounded-full border border-gray-200" style={{ background: st.config.accent }} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Custom Colors</Label>
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
            </div>

            <div className="space-y-3">
              <Label>Fonts</Label>
              <Select label="Script Font" value={theme.scriptFont} onChange={(e) => update({ scriptFont: e.target.value })}>
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
              <Select label="Heading Font" value={theme.headingFont} onChange={(e) => update({ headingFont: e.target.value })}>
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
              <Select label="Body Font" value={theme.bodyFont} onChange={(e) => update({ bodyFont: e.target.value })}>
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
              <Select label="UI Font" value={theme.uiFont} onChange={(e) => update({ uiFont: e.target.value })}>
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Typography Sizes</Label>
              <Input label="Heading Size" value={theme.headingSize} onChange={(e) => update({ headingSize: e.target.value })} />
              <Input label="Body Size" value={theme.bodySize} onChange={(e) => update({ bodySize: e.target.value })} />
              <Input label="Heading Weight" value={theme.headingWeight} onChange={(e) => update({ headingWeight: e.target.value })} />
              <Input label="Body Weight" value={theme.bodyWeight} onChange={(e) => update({ bodyWeight: e.target.value })} />
              <Input label="Letter Spacing" value={theme.letterSpacing} onChange={(e) => update({ letterSpacing: e.target.value })} />
            </div>

            <Button variant="outline" className="w-full" onClick={() => {
              const name = prompt("Enter a name for this theme preset:");
              if (name) saveThemeMutation.mutate(name);
            }}>
              <Palette className="mr-1.5 h-4 w-4" /> Save as Preset
            </Button>
          </div>
        </SplitEditor>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </AdminLayout>
  );
}
