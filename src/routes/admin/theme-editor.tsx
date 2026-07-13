import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Upload, Check, Palette } from "lucide-react";
import { supabase, type Wedding, type ThemeConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Label, Select } from "../../components/ui/Input";
import { FormField } from "../../components/ui/ImageUpload";
import { Toast, Card } from "../../components/ui/index";
import { THEME_PRESETS, DEFAULT_THEME, getDraftTheme, themeToCssVars } from "../../lib/theme";
import { cn } from "../../lib/utils";

const FONT_OPTIONS = {
  script: ["Playfair Display", "Cormorant Garamond", "Great Vibes", "Allura", "Sacramento"],
  heading: ["Cormorant Garamond", "Playfair Display", "Cinzel", "Cardo", "EB Garamond"],
  body: ["Cormorant Garamond", "EB Garamond", "Cardo", "Lora", "Crimson Text"],
  ui: ["Jost", "Montserrat", "Lato", "Open Sans", "Inter"],
};

const BUTTON_STYLES = ["outline", "filled", "pill", "underline"];

export function ThemeEditorPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [initialized, setInitialized] = useState(false);

  const { data: wedding, isLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("created_by", user.user.id)
        .single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  useEffect(() => {
    if (wedding && !initialized) {
      setTheme(getDraftTheme(wedding));
      setInitialized(true);
    }
  }, [wedding, initialized]);

  const saveDraftMutation = useMutation({
    mutationFn: async (draft: ThemeConfig) => {
      if (!wedding) throw new Error("No wedding");
      const { data, error } = await supabase
        .from("weddings")
        .update({ draft_theme_config: draft, updated_at: new Date().toISOString() })
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const draft = getDraftTheme(wedding);
      const { data, error } = await supabase
        .from("weddings")
        .update({
          theme_config: draft,
          draft_theme_config: draft,
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
      setToast({ message: "Theme published!", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish theme", type: "error" }),
  });

  const updateTheme = useCallback(
    (updater: (prev: ThemeConfig) => ThemeConfig) => {
      setTheme((prev) => {
        const next = updater(prev);
        saveDraftMutation.mutate(next);
        return next;
      });
    },
    [saveDraftMutation]
  );

  const updateColor = (key: string, value: string) => {
    updateTheme((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  };

  const updateFont = (key: string, value: string) => {
    updateTheme((prev) => ({
      ...prev,
      typography: { ...prev.typography, [key]: value },
    }));
  };

  const updateUI = (key: string, value: string) => {
    updateTheme((prev) => ({
      ...prev,
      ui: { ...prev.ui, [key]: value },
    }));
  };

  const applyPreset = (config: ThemeConfig) => {
    updateTheme(() => ({ ...config }));
  };

  const previewWedding: Wedding | undefined = wedding
    ? {
        ...wedding,
        draft_theme_config: theme,
        theme_config: theme,
      }
    : undefined;

  if (isLoading || !wedding || !previewWedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading theme editor...</p>
        </div>
      </AdminLayout>
    );
  }

  const colorFields: { key: string; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "background", label: "Background" },
    { key: "surface", label: "Surface" },
    { key: "text", label: "Text" },
    { key: "border", label: "Border" },
    { key: "primaryLight", label: "Primary Light" },
    { key: "primaryDark", label: "Primary Dark" },
    { key: "textMuted", label: "Text Muted" },
    { key: "accent", label: "Accent" },
    { key: "success", label: "Success" },
    { key: "warning", label: "Warning" },
    { key: "error", label: "Error" },
  ];

  const radiusValue = parseInt(theme.ui?.radius || "8");

  return (
    <AdminLayout>
      <SplitEditor title="Theme Editor" preview={<HomePreview wedding={previewWedding} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Theme Customization</h2>
            <p className="font-ui text-sm text-[var(--color-text-muted)]">
              Choose a preset or customize every detail.
            </p>
          </div>

          {/* Publish bar */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-light)] border border-[var(--color-border)]/15">
            <div className="flex items-center gap-2">
              {saveDraftMutation.isPending && (
                <span className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Save size={12} className="animate-pulse" /> Saving...
                </span>
              )}
              {saveDraftMutation.isSuccess && !saveDraftMutation.isPending && (
                <span className="font-ui text-xs text-[var(--color-success)]">Draft saved</span>
              )}
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              <Upload size={14} className="mr-1.5" />
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </div>

          {/* Theme Presets */}
          <div>
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-3 flex items-center gap-2">
              <Palette size={18} /> Presets
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isSelected =
                  theme.colors?.primary === preset.config.colors?.primary &&
                  theme.colors?.background === preset.config.colors?.background;
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.config)}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left transition-all",
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                        : "border-[var(--color-border)]/15 hover:border-[var(--color-primary)]/40"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      {[
                        preset.config.colors?.primary,
                        preset.config.colors?.background,
                        preset.config.colors?.accent,
                      ].map((color, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full border border-[var(--color-border)]/20"
                          style={{ background: color }}
                        />
                      ))}
                      {isSelected && (
                        <Check size={14} className="text-[var(--color-primary)] ml-auto" />
                      )}
                    </div>
                    <p className="font-ui text-xs font-medium text-[var(--color-text)]">{preset.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="pt-4 border-t border-[var(--color-border)]/15">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-3">Custom Colors</h3>
            <div className="grid grid-cols-2 gap-3">
              {colorFields.map((field) => (
                <div key={field.key}>
                  <Label>{field.label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={(theme.colors as Record<string, string>)?.[field.key] || "#000000"}
                      onChange={(e) => updateColor(field.key, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-[var(--color-border)]/20 cursor-pointer bg-transparent"
                    />
                    <Input
                      value={(theme.colors as Record<string, string>)?.[field.key] || ""}
                      onChange={(e) => updateColor(field.key, e.target.value)}
                      placeholder="#b8973a"
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="pt-4 border-t border-[var(--color-border)]/15">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-3">Typography</h3>
            <div className="space-y-3">
              <FormField label="Script Font">
                <Select
                  value={theme.typography?.scriptFont || "Playfair Display"}
                  onChange={(e) => updateFont("scriptFont", e.target.value)}
                >
                  {FONT_OPTIONS.script.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Heading Font">
                <Select
                  value={theme.typography?.headingFont || "Cormorant Garamond"}
                  onChange={(e) => updateFont("headingFont", e.target.value)}
                >
                  {FONT_OPTIONS.heading.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Body Font">
                <Select
                  value={theme.typography?.bodyFont || "Cormorant Garamond"}
                  onChange={(e) => updateFont("bodyFont", e.target.value)}
                >
                  {FONT_OPTIONS.body.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="UI Font">
                <Select
                  value={theme.typography?.uiFont || "Jost"}
                  onChange={(e) => updateFont("uiFont", e.target.value)}
                >
                  {FONT_OPTIONS.ui.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>

          {/* UI Settings */}
          <div className="pt-4 border-t border-[var(--color-border)]/15">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-3">UI Settings</h3>
            <FormField label={`Border Radius — ${radiusValue}px`}>
              <input
                type="range"
                min="0"
                max="24"
                value={radiusValue}
                onChange={(e) => updateUI("radius", `${e.target.value}px`)}
                className="w-full accent-[var(--color-primary)]"
              />
              <div className="flex justify-between mt-1">
                <span className="font-ui text-xs text-[var(--color-text-muted)]">Sharp</span>
                <span className="font-ui text-xs text-[var(--color-text-muted)]">Round</span>
              </div>
            </FormField>
            <FormField label="Button Style">
              <Select
                value={theme.ui?.buttonStyle || "outline"}
                onChange={(e) => updateUI("buttonStyle", e.target.value)}
              >
                {BUTTON_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
