import { useState, useMemo, useCallback } from "react";
import { Palette, Check, Save, RotateCcw, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Wedding } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Card, SectionTitle, Toast, Badge } from "@/components/ui";
import { SplitEditor } from "@/components/preview/SplitEditor";
import { NavPreview, HomePreview, FooterPreview } from "@/components/preview/PreviewRenderers";
import {
  type ThemeConfig, DEFAULT_THEME, THEME_PRESETS, FONT_OPTIONS,
  getDraftTheme, themeToCssVars,
} from "@/lib/theme";

// ─── Color field metadata ───
const COLOR_FIELDS: { key: keyof ThemeConfig["colors"]; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "card", label: "Card" },
  { key: "button", label: "Button" },
  { key: "buttonText", label: "Button Text" },
  { key: "link", label: "Link" },
  { key: "text", label: "Text" },
  { key: "textMuted", label: "Muted Text" },
  { key: "navBg", label: "Nav Background" },
  { key: "navText", label: "Nav Text" },
  { key: "footerBg", label: "Footer Background" },
  { key: "footerText", label: "Footer Text" },
];

const HEADING_WEIGHTS = ["300", "400", "500", "600", "700"];
const BODY_WEIGHTS = ["300", "400", "500", "600"];
const SHADOW_OPTIONS: ThemeConfig["ui"]["shadowIntensity"][] = ["none", "soft", "medium", "strong"];
const RADIUS_OPTIONS = ["0rem", "0.25rem", "0.375rem", "0.5rem", "0.75rem", "1rem", "1.5rem"];
const SPACING_OPTIONS = ["2rem", "3rem", "4rem", "5rem", "6rem", "8rem"];

export function AdminThemeEditor() {
  const { wedding, loading, setWedding } = useHostWedding();
  const [theme, setTheme] = useState<ThemeConfig>(() => getDraftTheme(wedding));
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);

  // Re-init theme once wedding loads
  const loadedKey = wedding?.id;
  const [initKey, setInitKey] = useState<string | undefined>(undefined);
  if (loadedKey && initKey !== loadedKey) {
    setInitKey(loadedKey);
    setTheme(getDraftTheme(wedding));
  }

  const coupleNames = useMemo(() => {
    if (!wedding) return "Our Wedding";
    return `${wedding.couple_name_one} & ${wedding.couple_name_two}`;
  }, [wedding]);

  // ─── Update helpers ───
  const updateColor = useCallback((key: keyof ThemeConfig["colors"], value: string) => {
    setTheme((t) => ({ ...t, colors: { ...t.colors, [key]: value }, preset: undefined }));
  }, []);

  const updateTypography = useCallback(<K extends keyof ThemeConfig["typography"]>(
    key: K, value: ThemeConfig["typography"][K],
  ) => {
    setTheme((t) => ({ ...t, typography: { ...t.typography, [key]: value }, preset: undefined }));
  }, []);

  const updateUi = useCallback(<K extends keyof ThemeConfig["ui"]>(
    key: K, value: ThemeConfig["ui"][K],
  ) => {
    setTheme((t) => ({ ...t, ui: { ...t.ui, [key]: value }, preset: undefined }));
  }, []);

  const applyPreset = useCallback((presetKey: string) => {
    const preset = THEME_PRESETS.find((p) => p.key === presetKey);
    if (preset) setTheme({ ...preset.theme, preset: presetKey });
  }, []);

  const resetTheme = useCallback(() => {
    setTheme({ ...DEFAULT_THEME, preset: "classic-white" });
    setToast({ message: "Theme reset to default", type: "success" });
  }, []);

  // ─── Persist helpers ───
  const updateWedding = useCallback(async (patch: Partial<Wedding>) => {
    if (!wedding) return false;
    const { data, error } = await supabase
      .from("weddings")
      .update(patch)
      .eq("id", wedding.id)
      .select()
      .single();
    if (error || !data) {
      setToast({ message: "Failed to save theme", type: "error" });
      return false;
    }
    setWedding(data as Wedding);
    return true;
  }, [wedding, setWedding]);

  const handleSaveDraft = useCallback(async () => {
    setSaving("draft");
    const ok = await updateWedding({ draft_theme_config: theme as unknown as Record<string, unknown> });
    setSaving(null);
    if (ok) setToast({ message: "Draft saved", type: "success" });
  }, [theme, updateWedding]);

  const handlePublish = useCallback(async () => {
    setSaving("publish");
    const ok = await updateWedding({
      theme_config: theme as unknown as Record<string, unknown>,
      draft_theme_config: null,
    });
    setSaving(null);
    if (ok) setToast({ message: "Theme published", type: "success" });
  }, [theme, updateWedding]);

  // ─── Loading / empty guards ───
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sepia">Loading…</div>;
  }
  if (!wedding) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        No wedding found.
      </div>
    );
  }

  // ─── Editor panel ───
  const editor = (
    <div className="space-y-6">
      {/* Presets */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-sepia" />
          <h2 className="text-sm font-semibold text-onyx uppercase tracking-widest">Presets</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEME_PRESETS.map((preset) => {
            const active = theme.preset === preset.key;
            const swatches = [
              preset.theme.colors.primary, preset.theme.colors.background,
              preset.theme.colors.accent, preset.theme.colors.footerBg,
            ];
            return (
              <button
                key={preset.key}
                onClick={() => applyPreset(preset.key)}
                className={`relative rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                  active ? "border-onyx ring-2 ring-onyx/10" : "border-sand hover:border-sepia/40"
                }`}
              >
                <div className="flex gap-1 mb-2">
                  {swatches.map((c, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-black/10" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-xs font-medium text-onyx block leading-tight">{preset.name}</span>
                {active && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-onyx flex items-center justify-center">
                    <Check className="w-3 h-3 text-parchment" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {theme.preset && (
          <div className="mt-3">
            <Badge variant="info">Active: {THEME_PRESETS.find((p) => p.key === theme.preset)?.name ?? theme.preset}</Badge>
          </div>
        )}
      </Card>

      {/* Custom Colors */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-onyx uppercase tracking-widest mb-4">Custom Colors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <Label>{label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.colors[key]}
                  onChange={(e) => updateColor(key, e.target.value)}
                  className="w-10 h-10 shrink-0 rounded-lg border border-sand cursor-pointer bg-white p-1"
                  title={label}
                />
                <Input
                  type="text"
                  value={theme.colors[key]}
                  onChange={(e) => updateColor(key, e.target.value)}
                  className="font-mono text-xs uppercase"
                  maxLength={7}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Typography */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-onyx uppercase tracking-widest mb-4">Typography</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Heading Font</Label>
            <Select value={theme.typography.headingFont} onChange={(e) => updateTypography("headingFont", e.target.value)}>
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>
          <div>
            <Label>Body Font</Label>
            <Select value={theme.typography.bodyFont} onChange={(e) => updateTypography("bodyFont", e.target.value)}>
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>
          <div>
            <Label>Heading Weight</Label>
            <Select value={theme.typography.headingWeight} onChange={(e) => updateTypography("headingWeight", e.target.value)}>
              {HEADING_WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
            </Select>
          </div>
          <div>
            <Label>Body Weight</Label>
            <Select value={theme.typography.bodyWeight} onChange={(e) => updateTypography("bodyWeight", e.target.value)}>
              {BODY_WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
            </Select>
          </div>
          <div>
            <Label>Heading Size</Label>
            <Input
              type="text"
              value={theme.typography.headingSize}
              onChange={(e) => updateTypography("headingSize", e.target.value)}
              placeholder="1rem"
            />
          </div>
          <div>
            <Label>Body Size</Label>
            <Input
              type="text"
              value={theme.typography.bodySize}
              onChange={(e) => updateTypography("bodySize", e.target.value)}
              placeholder="1rem"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Font Style</Label>
            <Select
              value={theme.typography.fontStyle}
              onChange={(e) => updateTypography("fontStyle", e.target.value as "normal" | "italic")}
            >
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* UI Controls */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-onyx uppercase tracking-widest mb-4">UI</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Border Radius</Label>
            <Select value={theme.ui.borderRadius} onChange={(e) => updateUi("borderRadius", e.target.value)}>
              {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </div>
          <div>
            <Label>Shadow Intensity</Label>
            <Select
              value={theme.ui.shadowIntensity}
              onChange={(e) => updateUi("shadowIntensity", e.target.value as ThemeConfig["ui"]["shadowIntensity"])}
            >
              {SHADOW_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </Select>
          </div>
          <div>
            <Label>Section Spacing</Label>
            <Select value={theme.ui.sectionSpacing} onChange={(e) => updateUi("sectionSpacing", e.target.value)}>
              {SPACING_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );

  // ─── Preview panel ───
  const preview = (
    <div>
      <NavPreview theme={theme} coupleNames={coupleNames} items={["Home", "Events", "Story", "Gallery"]} />
      <HomePreview wedding={wedding} theme={theme} />
      <FooterPreview theme={theme} hashtag={wedding.hashtag} date={wedding.wedding_date} />
    </div>
  );

  // ─── Actions ───
  const actions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={resetTheme} title="Reset to default">
        <RotateCcw className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Reset</span>
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleSaveDraft}
        disabled={saving !== null}
      >
        <Save className="w-3.5 h-3.5" />
        {saving === "draft" ? "Saving…" : "Save Draft"}
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={handlePublish}
        disabled={saving !== null}
      >
        <Send className="w-3.5 h-3.5" />
        {saving === "publish" ? "Publishing…" : "Publish"}
      </Button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <SectionTitle
        title="Theme Editor"
        subtitle="Design your wedding website. Changes preview instantly — save as draft or publish live."
        action={null}
      />

      <SplitEditor
        editor={editor}
        preview={preview}
        previewLabel="Live Preview"
        actions={actions}
        draftData={{ theme }}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default AdminThemeEditor;
