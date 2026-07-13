import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type ThemeConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Label, Select } from "../../components/ui/Input";
import { Card, Badge, Toast } from "../../components/ui/index";
import { THEME_PRESETS, DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { Save, Palette, Type, Check } from "lucide-react";

const FONT_OPTIONS = [
  { label: "Cormorant Garamond", value: "Cormorant Garamond" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "EB Garamond", value: "EB Garamond" },
  { label: "Lora", value: "Lora" },
  { label: "Cinzel", value: "Cinzel" },
  { label: "Jost", value: "Jost" },
  { label: "Inter", value: "Inter" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Karla", value: "Karla" },
  { label: "Work Sans", value: "Work Sans" },
];

const COLOR_FIELDS: { key: string; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "primaryLight", label: "Primary Light" },
  { key: "primaryDark", label: "Primary Dark" },
  { key: "background", label: "Background" },
  { key: "backgroundLight", label: "Background Light" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
  { key: "textMuted", label: "Text Muted" },
  { key: "border", label: "Border" },
  { key: "accent", label: "Accent" },
];

export function ThemeEditorPage() {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [previewWedding, setPreviewWedding] = useState<Wedding | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const { data: wedding, isLoading, error } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  useEffect(() => {
    if (wedding) {
      const draft = wedding.draft_theme_config;
      const pub = wedding.theme_config && "colors" in wedding.theme_config ? wedding.theme_config : DEFAULT_THEME;
      const t = draft && "colors" in draft ? draft : pub;
      setTheme(t);
      const matched = THEME_PRESETS.find((p) => JSON.stringify(p.config) === JSON.stringify(t));
      setActivePreset(matched?.name || null);
    }
  }, [wedding]);

  useEffect(() => {
    if (wedding) {
      setPreviewWedding({ ...wedding, draft_theme_config: theme } as Wedding);
    }
  }, [wedding, theme]);

  const saveMutation = useMutation({
    mutationFn: async (data: ThemeConfig) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("weddings")
        .update({ draft_theme_config: data, updated_at: new Date().toISOString() })
        .eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Theme saved to draft", type: "success" });
    },
    onError: (err) => setToast({ message: err.message || "Failed to save", type: "error" }),
  });

  const handleSave = () => saveMutation.mutate(theme);

  const applyPreset = (presetName: string) => {
    const preset = THEME_PRESETS.find((p) => p.name === presetName);
    if (preset) {
      setTheme(preset.config);
      setActivePreset(presetName);
    }
  };

  const updateColor = (key: string, value: string) => {
    setTheme((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
    setActivePreset(null);
  };

  const updateTypography = (key: string, value: string) => {
    setTheme((prev) => ({ ...prev, typography: { ...prev.typography, [key]: value } }));
    setActivePreset(null);
  };

  const updateUi = (key: string, value: string) => {
    setTheme((prev) => ({ ...prev, ui: { ...prev.ui, [key]: value } }));
    setActivePreset(null);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="font-ui text-sm text-gray-400">Loading theme editor...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl text-[var(--color-text)]">Theme Editor</h1>
            <p className="font-ui text-xs text-[var(--color-text-muted)]">Customize colors, fonts, and styling</p>
          </div>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save size={14} className="mr-1.5" />
            {saveMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SplitEditor
            title="Theme Editor"
            preview={previewWedding ? <HomePreview wedding={previewWedding} /> : <div />}
          >
            <div className="space-y-6">
              {/* Presets */}
              <div>
                <Label>Theme Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.map((preset) => {
                    const vars = themeToCssVars(preset.config);
                    const isActive = activePreset === preset.name;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset.name)}
                        className={`relative flex items-center gap-2 p-3 border rounded-lg transition-all text-left ${
                          isActive
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-1.5 right-1.5">
                            <Check size={12} className="text-[var(--color-primary)]" />
                          </div>
                        )}
                        <div className="flex gap-1 flex-shrink-0">
                          <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: vars["--color-primary"] }} />
                          <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: vars["--color-bg"] }} />
                        </div>
                        <span className="font-ui text-xs text-[var(--color-text)] truncate">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Palette size={16} className="text-[var(--color-primary)]" />
                  <h3 className="font-heading text-base text-[var(--color-text)]">Colors</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {COLOR_FIELDS.map((field) => (
                    <div key={field.key}>
                      <label className="block font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-1.5">
                        {field.label}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={(theme.colors as Record<string, string>)?.[field.key] || "#000000"}
                          onChange={(e) => updateColor(field.key, e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0"
                        />
                        <Input
                          value={(theme.colors as Record<string, string>)?.[field.key] || ""}
                          onChange={(e) => updateColor(field.key, e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Type size={16} className="text-[var(--color-primary)]" />
                  <h3 className="font-heading text-base text-[var(--color-text)]">Typography</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Script Font (Names)</Label>
                    <Select value={theme.typography?.scriptFont || ""} onChange={(e) => updateTypography("scriptFont", e.target.value)}>
                      {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Heading Font</Label>
                    <Select value={theme.typography?.headingFont || ""} onChange={(e) => updateTypography("headingFont", e.target.value)}>
                      {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Body Font</Label>
                    <Select value={theme.typography?.bodyFont || ""} onChange={(e) => updateTypography("bodyFont", e.target.value)}>
                      {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>UI Font</Label>
                    <Select value={theme.typography?.uiFont || ""} onChange={(e) => updateTypography("uiFont", e.target.value)}>
                      {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Script Size</Label>
                      <Input value={theme.typography?.scriptSize || ""} onChange={(e) => updateTypography("scriptSize", e.target.value)} placeholder="3rem" />
                    </div>
                    <div>
                      <Label>Heading Size</Label>
                      <Input value={theme.typography?.headingSize || ""} onChange={(e) => updateTypography("headingSize", e.target.value)} placeholder="1.5rem" />
                    </div>
                    <div>
                      <Label>Body Size</Label>
                      <Input value={theme.typography?.bodySize || ""} onChange={(e) => updateTypography("bodySize", e.target.value)} placeholder="1.0625rem" />
                    </div>
                    <div>
                      <Label>Letter Spacing</Label>
                      <Input value={theme.typography?.letterSpacing || ""} onChange={(e) => updateTypography("letterSpacing", e.target.value)} placeholder="0.15em" />
                    </div>
                  </div>
                </div>
              </div>

              {/* UI */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-heading text-base text-[var(--color-text)] mb-4">UI Elements</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Corner Radius</Label>
                    <Input value={theme.ui?.radius || ""} onChange={(e) => updateUi("radius", e.target.value)} placeholder="8px" />
                  </div>
                  <div>
                    <Label>Button Radius</Label>
                    <Input value={theme.ui?.buttonRadius || ""} onChange={(e) => updateUi("buttonRadius", e.target.value)} placeholder="8px" />
                  </div>
                </div>
              </div>

              <Card className="p-4 bg-[var(--color-bg-light)]">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">{activePreset || "Custom"}</Badge>
                </div>
                <p className="font-ui text-xs text-[var(--color-text-muted)]">
                  {activePreset
                    ? `Using "${activePreset}" preset. Modify any value to customize.`
                    : "Custom theme — no preset matched."}
                </p>
              </Card>
            </div>
          </SplitEditor>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
