import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  RICH_FONT_OPTIONS,
  HEADING_FONT_OPTIONS,
  type ThemeConfig,
} from "../../lib/theme";
import { ColorInput, Select, Button, Card } from "../../components/ui";
import { cn } from "../../lib/utils";

const COLOR_FIELDS: { key: keyof ThemeConfig; label: string }[] = [
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "border", label: "Border" },
  { key: "text", label: "Text" },
  { key: "heading", label: "Heading" },
  { key: "muted", label: "Muted" },
  { key: "primary", label: "Primary" },
  { key: "primaryHover", label: "Primary Hover" },
  { key: "primaryFg", label: "Primary Foreground" },
  { key: "accent", label: "Accent" },
];

export default function ThemeEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const t = event.draft_theme ?? event.theme;
    return (t as unknown as ThemeConfig) ?? DEFAULT_THEME;
  });
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    const t = event.draft_theme ?? event.theme;
    setTheme((t as unknown as ThemeConfig) ?? DEFAULT_THEME);
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_theme: theme as unknown as Json,
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", event.id] });
      setSavedMsg("Saved successfully");
      setTimeout(() => setSavedMsg(null), 3000);
    },
  });

  const applyPreset = (preset: ThemeConfig) => {
    setTheme(preset);
  };

  const updateColor = (key: keyof ThemeConfig, value: string) => {
    setTheme({ ...theme, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Theme</h2>
          <p className="text-sm text-dash-muted">Customize the look and feel of your website.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
      </div>
      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
        </p>
      )}
      {savedMsg && <p className="text-sm text-green-600">{savedMsg}</p>}

      {/* Presets */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Theme Presets</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(THEME_PRESETS).map(([name, preset]) => (
            <button
              key={name}
              type="button"
              onClick={() => applyPreset(preset)}
              className={cn(
                "rounded-lg border-2 p-3 text-left transition-all hover:shadow-md",
                JSON.stringify(theme) === JSON.stringify(preset)
                  ? "border-dash-primary"
                  : "border-dash-border"
              )}
            >
              <div className="mb-2 flex gap-1">
                <div className="h-6 w-6 rounded" style={{ background: preset.primary }} />
                <div className="h-6 w-6 rounded" style={{ background: preset.bg }} />
                <div className="h-6 w-6 rounded" style={{ background: preset.accent }} />
              </div>
              <span className="text-xs font-medium capitalize text-dash-text">{name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Colors */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Colors</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {COLOR_FIELDS.map((field) => (
            <ColorInput
              key={field.key}
              label={field.label}
              value={theme[field.key] as string}
              onChange={(val) => updateColor(field.key, val)}
            />
          ))}
        </div>
      </Card>

      {/* Fonts */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Fonts</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Heading Font"
            value={theme.fontHeading}
            onChange={(e) => setTheme({ ...theme, fontHeading: e.target.value })}
          >
            {HEADING_FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Select
            label="Body Font"
            value={theme.fontBody}
            onChange={(e) => setTheme({ ...theme, fontBody: e.target.value })}
          >
            {RICH_FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Select
            label="Rich Text Font"
            value={theme.fontRich}
            onChange={(e) => setTheme({ ...theme, fontRich: e.target.value })}
          >
            {RICH_FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>
    </div>
  );
}
