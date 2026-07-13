import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Globe, Check, Palette } from "lucide-react";
import { supabase, type Wedding, type ThemeConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Label, Select } from "../../components/ui/Input";
import { Card, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { THEME_PRESETS, DEFAULT_THEME } from "../../lib/theme";
import { cn } from "../../lib/utils";

const FONT_OPTIONS = [
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond" },
  { value: "Jost", label: "Jost" },
  { value: "Lora", label: "Lora" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "EB Garamond", label: "EB Garamond" },
  { value: "Cinzel", label: "Cinzel" },
  { value: "DM Serif Display", label: "DM Serif Display" },
];

export function ThemeEditorPage() {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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

  useEffect(() => {
    if (wedding) {
      const draft = wedding.draft_theme_config;
      const pub = wedding.theme_config && "colors" in wedding.theme_config ? wedding.theme_config : null;
      const base = (draft && "colors" in draft ? draft : pub) as ThemeConfig | null;
      setTheme(base || DEFAULT_THEME);
    }
  }, [wedding]);

  const saveDraftMutation = useMutation({
    mutationFn: async (newTheme: ThemeConfig) => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("weddings").update({ draft_theme_config: newTheme }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Theme draft saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save theme", type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("weddings").update({ theme_config: theme, draft_theme_config: theme }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Theme published", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish theme", type: "error" }),
  });

  const updateColor = (key: string, value: string) => {
    setTheme((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };

  const updateFont = (key: string, value: string) => {
    setTheme((prev) => ({ ...prev, typography: { ...prev.typography, [key]: value } }));
  };

  const updateRadius = (value: string) => {
    setTheme((prev) => ({ ...prev, ui: { ...prev.ui, radius: value, buttonRadius: value } }));
  };

  const applyPreset = (preset: ThemeConfig) => {
    setTheme(preset);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Wedding not found</p>
        </div>
      </AdminLayout>
    );
  }

  const previewWedding = { ...wedding, theme_config: theme, draft_theme_config: theme } as Wedding;

  const colorFields = [
    { key: "primary", label: "Primary" },
    { key: "background", label: "Background" },
    { key: "surface", label: "Surface" },
    { key: "text", label: "Text" },
    { key: "border", label: "Border" },
  ];

  return (
    <AdminLayout>
      <SplitEditor title="Theme Editor" preview={<HomePreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Theme</h2>
            <p className="font-ui text-xs text-[var(--color-text-muted)] mb-6">Customize the look and feel of your invitation</p>
          </div>

          <div>
            <Label>Preset Themes</Label>
            <div className="grid grid-cols-2 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isActive = JSON.stringify(preset.config.colors) === JSON.stringify(theme.colors);
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.config)}
                    className={cn(
                      "relative p-3 rounded-lg border-2 transition-all text-left",
                      isActive ? "border-[var(--color-primary)] shadow-sm" : "border-[var(--color-border)]/20 hover:border-[var(--color-primary)]/40"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: preset.config.colors?.primary }} />
                        <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: preset.config.colors?.background }} />
                        <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: preset.config.colors?.surface }} />
                      </div>
                      {isActive && <Check size={14} className="text-[var(--color-primary)] ml-auto" />}
                    </div>
                    <span className="font-ui text-xs text-[var(--color-text)]">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)]/15">
            <div className="flex items-center gap-2 mb-4">
              <Palette size={16} className="text-[var(--color-primary)]" />
              <h3 className="font-heading text-lg text-[var(--color-text)]">Custom Colors</h3>
            </div>
            <div className="space-y-3">
              {colorFields.map((field) => (
                <div key={field.key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={(theme.colors as Record<string, string>)?.[field.key] || "#000000"}
                    onChange={(e) => updateColor(field.key, e.target.value)}
                    className="w-10 h-10 rounded-lg border border-[var(--color-border)]/20 cursor-pointer"
                  />
                  <div className="flex-1">
                    <Label>{field.label}</Label>
                    <Input
                      value={(theme.colors as Record<string, string>)?.[field.key] || ""}
                      onChange={(e) => updateColor(field.key, e.target.value)}
                      placeholder="#b8973a"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)]/15">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-4">Typography</h3>
            <div className="space-y-4">
              <FormField label="Script Font" hint="Used for couple names and decorative headings">
                <Select value={theme.typography?.scriptFont || ""} onChange={(e) => updateFont("scriptFont", e.target.value)}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Heading Font" hint="Used for section headings">
                <Select value={theme.typography?.headingFont || ""} onChange={(e) => updateFont("headingFont", e.target.value)}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Body Font" hint="Used for body text and descriptions">
                <Select value={theme.typography?.bodyFont || ""} onChange={(e) => updateFont("bodyFont", e.target.value)}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="UI Font" hint="Used for buttons, labels, and navigation">
                <Select value={theme.typography?.uiFont || ""} onChange={(e) => updateFont("uiFont", e.target.value)}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)]/15">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-4">Border Radius</h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="24"
                step="2"
                value={parseInt(theme.ui?.radius || "8")}
                onChange={(e) => updateRadius(`${e.target.value}px`)}
                className="flex-1 accent-[var(--color-primary)]"
              />
              <span className="font-ui text-sm text-[var(--color-text)] min-w-[3rem] text-right">{theme.ui?.radius || "8px"}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)]/15 space-y-3">
            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => saveDraftMutation.mutate(theme)}
              disabled={saveDraftMutation.isPending}
            >
              <Save size={14} className="mr-2" />
              {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              <Globe size={14} className="mr-2" />
              {publishMutation.isPending ? "Publishing..." : "Publish Theme"}
            </Button>
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
