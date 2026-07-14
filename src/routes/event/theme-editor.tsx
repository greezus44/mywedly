import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, ColorInput, Select } from "../../components/ui";
import {
  THEME_PRESETS,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
  fullToSimplifiedTheme,
  simplifiedToFullTheme,
  type SimplifiedThemeConfig,
} from "../../lib/theme";
import { cn } from "../../lib/utils";

const presetKeys = Object.keys(THEME_PRESETS);

const colorFields: { key: keyof SimplifiedThemeConfig; label: string }[] = [
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "primary", label: "Primary" },
  { key: "primaryHover", label: "Primary Hover" },
  { key: "accent", label: "Accent" },
  { key: "text", label: "Text" },
];

export function ThemeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<SimplifiedThemeConfig>({});

  useEffect(() => {
    const draftTheme = event.draft_theme ?? event.theme ?? {};
    // Check if it's already simplified or a full theme
    const obj = draftTheme as Record<string, unknown>;
    if (obj.colors) {
      // It's a full theme — convert to simplified
      setTheme(fullToSimplifiedTheme(obj as unknown as ReturnType<typeof simplifiedToFullTheme>));
    } else {
      setTheme(obj as SimplifiedThemeConfig);
    }
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_theme: theme as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const applyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) {
      setTheme(fullToSimplifiedTheme(preset));
    }
  };

  const updateColor = (key: keyof SimplifiedThemeConfig, value: string) => {
    setTheme({ ...theme, [key]: value });
  };

  const editor = (
    <div className="p-4 space-y-6">
      {/* Presets */}
      <div>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Theme Presets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {presetKeys.map((key) => {
            const preset = THEME_PRESETS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className="rounded-lg border border-dash-border p-2 hover:border-dash-primary transition-colors text-left"
              >
                <div
                  className="h-12 w-full rounded-md mb-1.5 flex items-center justify-center"
                  style={{ backgroundColor: preset.colors.bg, borderColor: preset.colors.border, borderWidth: 1 }}
                >
                  <div className="flex gap-1">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.colors.primary }} />
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.colors.accent }} />
                  </div>
                </div>
                <span className="text-xs font-medium text-dash-text capitalize">{key}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Colors</h3>
        <div className="grid grid-cols-2 gap-3">
          {colorFields.map((field) => (
            <ColorInput
              key={field.key}
              label={field.label}
              value={(theme[field.key] as string) ?? "#ffffff"}
              onChange={(value) => updateColor(field.key, value)}
            />
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Fonts</h3>
        <div className="space-y-3">
          <Select
            label="Heading font"
            value={theme.headingFont ?? "Georgia, serif"}
            onChange={(e) => setTheme({ ...theme, headingFont: e.target.value })}
          >
            {HEADING_FONT_OPTIONS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </Select>
          <Select
            label="Body font"
            value={theme.bodyFont ?? "Georgia, serif"}
            onChange={(e) => setTheme({ ...theme, bodyFont: e.target.value })}
          >
            {RICH_FONT_OPTIONS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-dash-border">
        {saveMutation.isError && (
          <p className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
          </p>
        )}
        {saveMutation.isSuccess && (
          <p className="text-sm text-green-600">Saved!</p>
        )}
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          className="ml-auto"
        >
          Save changes
        </Button>
      </div>
    </div>
  );

  const preview = (
    <div className="p-4">
      <Card className="overflow-hidden">
        <div
          className="event-themed min-h-[400px] p-8"
          style={{
            backgroundColor: theme.bg,
            color: theme.text,
            fontFamily: theme.bodyFont,
            borderRadius: theme.radius,
          } as React.CSSProperties}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: theme.muted }}
          >
            Welcome
          </p>
          <h1
            className="text-3xl font-bold mb-3"
            style={{ color: theme.heading, fontFamily: theme.headingFont }}
          >
            Our Wedding
          </h1>
          <p className="text-base mb-4" style={{ color: theme.muted }}>
            We invite you to celebrate with us on our special day.
          </p>
          <button
            className="px-6 py-2 rounded font-semibold text-sm uppercase tracking-wide"
            style={{
              backgroundColor: theme.primary,
              color: theme.primaryFg,
              borderRadius: theme.radius,
            }}
          >
            View Invitation
          </button>
          <div
            className="mt-6 rounded-lg border p-4"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderRadius: theme.radius,
            }}
          >
            <h3 className="text-lg font-semibold mb-1" style={{ color: theme.heading }}>
              Our Story
            </h3>
            <p className="text-sm" style={{ color: theme.text }}>
              A love story worth celebrating.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Theme Editor</h2>
        <p className="text-sm text-dash-muted">
          Customize the colors and fonts of your invitation website
        </p>
      </div>
      <div className="h-[calc(100vh-220px)] min-h-[500px]">
        <div className="flex flex-col md:flex-row gap-4 h-full">
          <div
            className="overflow-auto rounded-lg border border-dash-border bg-dash-surface"
            style={{ flex: "0.5 1 0" }}
          >
            {editor}
          </div>
          <div
            className={cn("overflow-auto rounded-lg border border-dash-border bg-dash-surface")}
            style={{ flex: "0.5 1 0" }}
          >
            {preview}
          </div>
        </div>
      </div>
    </div>
  );
}
