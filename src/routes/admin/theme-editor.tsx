import { useEffect, useMemo, useState } from "react";
import { Palette, Check, Save, RotateCcw, Type, Square, Layers, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Wedding } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Card, SectionTitle, Toast, Badge } from "@/components/ui";
import { SplitEditor } from "@/components/preview/SplitEditor";
import {
  HomePreview,
  NavPreview,
  FooterPreview,
} from "@/components/preview/PreviewRenderers";
import {
  type ThemeConfig,
  DEFAULT_THEME,
  THEME_PRESETS,
  FONT_OPTIONS,
  getDraftTheme,
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
  { key: "textMuted", label: "Text Muted" },
  { key: "navBg", label: "Nav Background" },
  { key: "navText", label: "Nav Text" },
  { key: "footerBg", label: "Footer Background" },
  { key: "footerText", label: "Footer Text" },
];

const WEIGHT_OPTIONS = ["300", "400", "500", "600", "700"];
const SHADOW_OPTIONS: { value: ThemeConfig["ui"]["shadowIntensity"]; label: string }[] = [
  { value: "none", label: "None" },
  { value: "soft", label: "Soft" },
  { value: "medium", label: "Medium" },
  { value: "strong", label: "Strong" },
];

export function AdminThemeEditor() {
  const { wedding, loading, setWedding } = useHostWedding();

  // Local theme state — initialized from the wedding's draft (or published) theme.
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize theme once the wedding loads.
  useEffect(() => {
    if (wedding) setTheme(getDraftTheme(wedding));
  }, [wedding?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Mutators ───
  const setColor = (key: keyof ThemeConfig["colors"], value: string) =>
    setTheme((t) => ({ ...t, colors: { ...t.colors, [key]: value }, preset: undefined }));

  const setTypo = <K extends keyof ThemeConfig["typography"]>(key: K, value: ThemeConfig["typography"][K]) =>
    setTheme((t) => ({ ...t, typography: { ...t.typography, [key]: value }, preset: undefined }));

  const setUi = <K extends keyof ThemeConfig["ui"]>(key: K, value: ThemeConfig["ui"][K]) =>
    setTheme((t) => ({ ...t, ui: { ...t.ui, [key]: value }, preset: undefined }));

  const applyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS.find((p) => p.key === presetKey);
    if (preset) setTheme({ ...preset.theme, preset: preset.key });
  };

  const resetTheme = () => setTheme({ ...DEFAULT_THEME });

  // Strip the runtime-only `preset` marker before persisting? No — keep it so we
  // can highlight the active preset on reload. Supabase jsonb accepts it.
  const themeToPersist = (t: ThemeConfig): Record<string, unknown> => t as unknown as Record<string, unknown>;

  // ─── Save Draft ───
  const saveDraft = async () => {
    if (!wedding) return;
    setSaving(true);
    const payload = themeToPersist(theme);
    const { data, error } = await supabase
      .from("weddings")
      .update({ draft_theme_config: payload })
      .eq("id", wedding.id)
      .select()
      .single();
    setSaving(false);
    if (error) { showToast("Failed to save draft", "error"); return; }
    if (data) setWedding(data as Wedding);
    showToast("Draft saved");
  };

  // ─── Publish ───
  const publish = async () => {
    if (!wedding) return;
    setSaving(true);
    const payload = themeToPersist(theme);
    const { data, error } = await supabase
      .from("weddings")
      .update({ theme_config: payload, draft_theme_config: null })
      .eq("id", wedding.id)
      .select()
      .single();
    setSaving(false);
    if (error) { showToast("Failed to publish", "error"); return; }
    if (data) setWedding(data as Wedding);
    showToast("Theme published");
  };

  // ─── Preview node ───
  const preview = useMemo(() => {
    if (!wedding) return null;
    return (
      <div className="w-full">
        <NavPreview theme={theme} items={["Home", "Events", "Story", "Gallery"]} />
        <HomePreview wedding={wedding} theme={theme} />
        <FooterPreview theme={theme} hashtag={wedding.hashtag} date={wedding.wedding_date} />
      </div>
    );
  }, [theme, wedding]);

  // ─── Loading / empty state ───
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-sepia/70">Loading theme editor…</p>
      </div>
    );
  }
  if (!wedding) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-sepia/70">No wedding found.</p>
      </div>
    );
  }

  // ─── Editor (left panel) ───
  const editor = (
    <div className="space-y-6">
      <SectionTitle
        title="Theme Editor"
        subtitle="Customize your wedding website's appearance. Changes preview instantly."
        action={
          <Button variant="ghost" size="sm" onClick={resetTheme} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
        }
      />

      {/* 1. Presets */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-sepia" />
          <h3 className="text-sm font-medium text-onyx">Theme Presets</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEME_PRESETS.map((preset) => {
            const isActive = theme.preset === preset.key;
            return (
              <button
                key={preset.key}
                onClick={() => applyPreset(preset.key)}
                className={`relative text-left rounded-lg border p-3 transition-all hover:shadow-sm ${
                  isActive ? "border-sepia ring-2 ring-sepia/20 bg-mist/50" : "border-sand bg-white"
                }`}
              >
                {/* Swatches */}
                <div className="flex gap-1 mb-2">
                  {(["primary", "secondary", "accent", "background"] as const).map((c) => (
                    <span
                      key={c}
                      className="w-5 h-5 rounded-full border border-onyx/10"
                      style={{ background: preset.theme.colors[c] }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-onyx truncate">{preset.name}</p>
                {isActive && (
                  <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-sepia text-parchment">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 2. Custom Colors */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Square className="w-4 h-4 text-sepia" />
          <h3 className="text-sm font-medium text-onyx">Custom Colors</h3>
          {!theme.preset && <Badge variant="info" className="ml-auto">Custom</Badge>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <Label>{label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.colors[key]}
                  onChange={(e) => setColor(key, e.target.value)}
                  className="w-9 h-9 rounded-md border border-sand cursor-pointer bg-white p-0.5 shrink-0"
                  aria-label={`${label} color picker`}
                />
                <Input
                  value={theme.colors[key]}
                  onChange={(e) => setColor(key, e.target.value)}
                  className="font-mono text-xs uppercase"
                  spellCheck={false}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Typography */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-4 h-4 text-sepia" />
          <h3 className="text-sm font-medium text-onyx">Typography</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <div>
            <Label>Heading Font</Label>
            <Select value={theme.typography.headingFont} onChange={(e) => setTypo("headingFont", e.target.value)}>
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Body Font</Label>
            <Select value={theme.typography.bodyFont} onChange={(e) => setTypo("bodyFont", e.target.value)}>
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Heading Weight</Label>
            <Select value={theme.typography.headingWeight} onChange={(e) => setTypo("headingWeight", e.target.value)}>
              {WEIGHT_OPTIONS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Body Weight</Label>
            <Select value={theme.typography.bodyWeight} onChange={(e) => setTypo("bodyWeight", e.target.value)}>
              {WEIGHT_OPTIONS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Font Style</Label>
            <Select
              value={theme.typography.fontStyle}
              onChange={(e) => setTypo("fontStyle", e.target.value as "normal" | "italic")}
            >
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* 4. UI */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-sepia" />
          <h3 className="text-sm font-medium text-onyx">UI</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
          <div>
            <Label>Border Radius</Label>
            <Input
              value={theme.ui.borderRadius}
              onChange={(e) => setUi("borderRadius", e.target.value)}
              placeholder="0.5rem"
            />
          </div>
          <div>
            <Label>Shadow Intensity</Label>
            <Select
              value={theme.ui.shadowIntensity}
              onChange={(e) => setUi("shadowIntensity", e.target.value as ThemeConfig["ui"]["shadowIntensity"])}
            >
              {SHADOW_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Section Spacing</Label>
            <Input
              value={theme.ui.sectionSpacing}
              onChange={(e) => setUi("sectionSpacing", e.target.value)}
              placeholder="4rem"
            />
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      <SplitEditor
        editor={editor}
        preview={preview}
        previewLabel="Live Preview"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={saveDraft} disabled={saving} className="gap-1.5">
              <Save className="w-3.5 h-3.5" /> Save Draft
            </Button>
            <Button variant="primary" size="sm" onClick={publish} disabled={saving} className="gap-1.5">
              <Send className="w-3.5 h-3.5" /> Publish
            </Button>
          </>
        }
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

export default AdminThemeEditor;
