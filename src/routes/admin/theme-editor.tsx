import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type ThemeConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Label, Select } from "../../components/ui/Input";
import { Toast, EmptyState } from "../../components/ui/index";
import { THEME_PRESETS, DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { Save, Send, RefreshCw, Check, Palette } from "lucide-react";

const SCRIPT_FONTS = ["Playfair Display", "Great Vibes", "Dancing Script", "Sacramento", "Allura"];
const HEADING_FONTS = ["Cormorant Garamond", "Playfair Display", "EB Garamond", "Cinzel", "Marcellus"];
const BODY_FONTS = ["Cormorant Garamond", "EB Garamond", "Lora", "Crimson Text", "Source Serif Pro"];
const UI_FONTS = ["Jost", "Montserrat", "Lato", "Inter", "Poppins"];

const COLOR_FIELDS: { key: string; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
  { key: "border", label: "Border" },
];

export function ThemeEditorPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);

  const weddingQuery = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const wedding = weddingQuery.data;

  useEffect(() => {
    if (wedding) {
      const draftTheme = wedding.draft_theme_config;
      const pubTheme = wedding.theme_config && "colors" in wedding.theme_config ? (wedding.theme_config as ThemeConfig) : null;
      const initial = draftTheme && "colors" in draftTheme ? draftTheme : pubTheme || DEFAULT_THEME;
      setTheme(initial);
    }
  }, [wedding]);

  const saveDraftMutation = useMutation({
    mutationFn: async (config: ThemeConfig) => {
      if (!wedding) throw new Error("No wedding");
      const { data, error } = await supabase
        .from("weddings")
        .update({ draft_theme_config: config, updated_at: new Date().toISOString() })
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
      setToast({ message: "Theme draft saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save theme", type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { data, error } = await supabase
        .from("weddings")
        .update({
          draft_theme_config: theme,
          theme_config: theme,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
      setToast({ message: "Theme published", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish theme", type: "error" }),
  });

  const handleSaveDraft = () => saveDraftMutation.mutate(theme);
  const handlePublish = () => {
    saveDraftMutation.mutate(theme, {
      onSuccess: () => publishMutation.mutate(),
    });
  };

  const applyPreset = (config: ThemeConfig) => setTheme(config);

  const updateColor = (key: string, value: string) => {
    setTheme((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  };

  const updateFont = (key: "scriptFont" | "headingFont" | "bodyFont" | "uiFont", value: string) => {
    setTheme((prev) => ({
      ...prev,
      typography: { ...prev.typography, [key]: value },
    }));
  };

  const updateRadius = (value: number) => {
    setTheme((prev) => ({
      ...prev,
      ui: { ...prev.ui, radius: `${value}px`, buttonRadius: `${value}px` },
    }));
  };

  if (weddingQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-20">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary)]" />
        </div>
      </AdminLayout>
    );
  }

  if (weddingQuery.isError || !wedding) {
    return (
      <AdminLayout>
        <div className="p-8">
          <EmptyState title="Unable to load theme editor" description="Please try again later." />
        </div>
      </AdminLayout>
    );
  }

  const previewWedding: Wedding = {
    ...wedding,
    draft_theme_config: theme,
  };

  const currentRadius = theme.ui?.radius ? parseInt(theme.ui.radius) : 8;

  return (
    <AdminLayout>
      <SplitEditor title="Theme Editor" preview={<HomePreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-xl text-[var(--color-text)] mb-1">Theme</h2>
            <p className="font-ui text-xs text-[var(--color-text-muted)]">Customize your wedding site's appearance</p>
          </div>

          {/* Preset Themes */}
          <div>
            <Label>Preset Themes</Label>
            <div className="grid grid-cols-2 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isActive = theme.colors?.primary === preset.config.colors?.primary &&
                  theme.colors?.background === preset.config.colors?.background;
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.config)}
                    className={cn(
                      "relative p-3 rounded-lg border-2 transition-all text-left",
                      isActive
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                        : "border-[var(--color-border)]/20 hover:border-[var(--color-primary)]/50"
                    )}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                    <div className="flex gap-1.5 mb-2">
                      <div className="w-6 h-6 rounded-full border border-gray-200" style={{ background: preset.config.colors?.primary }} />
                      <div className="w-6 h-6 rounded-full border border-gray-200" style={{ background: preset.config.colors?.background }} />
                      <div className="w-6 h-6 rounded-full border border-gray-200" style={{ background: preset.config.colors?.surface }} />
                    </div>
                    <span className="font-ui text-xs text-[var(--color-text)]">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Colors */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette size={16} className="text-[var(--color-primary)]" />
              <Label className="mb-0">Custom Colors</Label>
            </div>
            <div className="space-y-3">
              {COLOR_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <span className="font-ui text-sm text-[var(--color-text)]">{field.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={(theme.colors as Record<string, string>)?.[field.key] || DEFAULT_THEME.colors![field.key as keyof typeof DEFAULT_THEME.colors]!}
                      onChange={(e) => updateColor(field.key, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-[var(--color-border)]/30 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={(theme.colors as Record<string, string>)?.[field.key] || ""}
                      onChange={(e) => updateColor(field.key, e.target.value)}
                      className="w-24 px-2 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)]/30 text-[var(--color-text)] font-ui text-xs rounded-lg focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fonts */}
          <div>
            <Label>Typography</Label>
            <div className="space-y-3">
              <div>
                <label className="block font-ui text-xs text-[var(--color-text-muted)] mb-1">Script Font</label>
                <Select value={theme.typography?.scriptFont || ""} onChange={(e) => updateFont("scriptFont", e.target.value)}>
                  {SCRIPT_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </div>
              <div>
                <label className="block font-ui text-xs text-[var(--color-text-muted)] mb-1">Heading Font</label>
                <Select value={theme.typography?.headingFont || ""} onChange={(e) => updateFont("headingFont", e.target.value)}>
                  {HEADING_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </div>
              <div>
                <label className="block font-ui text-xs text-[var(--color-text-muted)] mb-1">Body Font</label>
                <Select value={theme.typography?.bodyFont || ""} onChange={(e) => updateFont("bodyFont", e.target.value)}>
                  {BODY_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </div>
              <div>
                <label className="block font-ui text-xs text-[var(--color-text-muted)] mb-1">UI Font</label>
                <Select value={theme.typography?.uiFont || ""} onChange={(e) => updateFont("uiFont", e.target.value)}>
                  {UI_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </div>
            </div>
          </div>

          {/* Radius Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="mb-0">Corner Radius</Label>
              <span className="font-ui text-xs text-[var(--color-text-muted)]">{currentRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              value={currentRadius}
              onChange={(e) => updateRadius(parseInt(e.target.value))}
              className="w-full accent-[var(--color-primary)]"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-3 border-t border-[var(--color-border)]/15">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSaveDraft}
              disabled={saveDraftMutation.isPending}
            >
              <Save size={14} className="mr-2" />
              {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              variant="primary"
              className="w-full"
              onClick={handlePublish}
              disabled={publishMutation.isPending || saveDraftMutation.isPending}
            >
              <Send size={14} className="mr-2" />
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
