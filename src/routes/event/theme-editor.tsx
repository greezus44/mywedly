import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { EventThemeProvider } from "../../lib/theme-context";
import {
  THEME_PRESETS,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
  simplifiedToFullTheme,
  fullToSimplifiedTheme,
  type SimplifiedThemeConfig,
  type ThemeConfig,
} from "../../lib/theme";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { ColorInput, RangeInput, LoadingSpinner } from "../../components/ui";
import { Select } from "../../components/ui/Input";
import { cn } from "../../lib/utils";

export default function ThemeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<SimplifiedThemeConfig>(() => {
    const raw = (event.draft_theme ?? event.theme ?? null) as Json;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return THEME_PRESETS[2].config; // Classic
    }
    const obj = raw as Record<string, unknown>;
    // Try to detect if it's a full theme config and convert
    if (obj.primaryColor && typeof obj.primaryColor === "string") {
      return obj as unknown as SimplifiedThemeConfig;
    }
    if (obj.primary && typeof obj.primary === "string") {
      return fullToSimplifiedTheme(obj as unknown as ThemeConfig);
    }
    return THEME_PRESETS[2].config;
  });

  useEffect(() => {
    const raw = (event.draft_theme ?? event.theme ?? null) as Json;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
    const obj = raw as Record<string, unknown>;
    if (obj.primaryColor && typeof obj.primaryColor === "string") {
      setTheme(obj as unknown as SimplifiedThemeConfig);
    } else if (obj.primary && typeof obj.primary === "string") {
      setTheme(fullToSimplifiedTheme(obj as unknown as ThemeConfig));
    }
  }, [event]);

  const fullTheme: ThemeConfig = simplifiedToFullTheme(theme);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_theme: fullTheme as unknown as Json,
        })
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", eventId] });
    },
  });

  const previewEvent = {
    ...event,
  };

  return (
    <SplitEditor
      editor={
        <div className="space-y-6">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-dash-text">Theme Editor</h2>
            <p className="text-sm text-dash-muted">
              Choose a preset and customize colors, fonts, and more.
            </p>
          </div>

          {/* Presets */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dash-text">
              Presets
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setTheme(preset.config)}
                  className={cn(
                    "rounded-lg border-2 p-3 text-left transition-all",
                    theme.primaryColor === preset.config.primaryColor &&
                    theme.backgroundColor === preset.config.backgroundColor
                      ? "border-dash-primary"
                      : "border-dash-border hover:border-dash-primary/50"
                  )}
                >
                  <div className="mb-2 flex gap-1">
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: preset.config.primaryColor }}
                    />
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: preset.config.secondaryColor }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-dash-border"
                      style={{ backgroundColor: preset.config.backgroundColor }}
                    />
                  </div>
                  <span className="text-xs font-medium text-dash-text">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-dash-text">Colors</h3>
            <ColorInput
              label="Primary Color"
              value={theme.primaryColor}
              onChange={(v) => setTheme((t) => ({ ...t, primaryColor: v }))}
            />
            <ColorInput
              label="Secondary Color"
              value={theme.secondaryColor}
              onChange={(v) => setTheme((t) => ({ ...t, secondaryColor: v }))}
            />
            <ColorInput
              label="Background Color"
              value={theme.backgroundColor}
              onChange={(v) => setTheme((t) => ({ ...t, backgroundColor: v }))}
            />
            <ColorInput
              label="Surface Color"
              value={theme.surfaceColor}
              onChange={(v) => setTheme((t) => ({ ...t, surfaceColor: v }))}
            />
            <ColorInput
              label="Primary Text Color"
              value={theme.primaryTextColor}
              onChange={(v) => setTheme((t) => ({ ...t, primaryTextColor: v }))}
            />
            <ColorInput
              label="Secondary Text Color"
              value={theme.secondaryTextColor}
              onChange={(v) => setTheme((t) => ({ ...t, secondaryTextColor: v }))}
            />
          </div>

          {/* Fonts */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-dash-text">Fonts</h3>
            <Select
              label="Heading Font"
              value={theme.headingFont}
              onChange={(e) =>
                setTheme((t) => ({ ...t, headingFont: e.target.value }))
              }
            >
              {HEADING_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
            <Select
              label="Body Font"
              value={theme.bodyFont}
              onChange={(e) =>
                setTheme((t) => ({ ...t, bodyFont: e.target.value }))
              }
            >
              {RICH_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
            <Select
              label="Font Scale"
              value={theme.fontScale}
              onChange={(e) =>
                setTheme((t) => ({
                  ...t,
                  fontScale: e.target.value as "sm" | "md" | "lg",
                }))
              }
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </Select>
          </div>

          {/* Buttons & Corners */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-dash-text">Buttons & Corners</h3>
            <Select
              label="Button Style"
              value={theme.buttonStyle}
              onChange={(e) =>
                setTheme((t) => ({
                  ...t,
                  buttonStyle: e.target.value as "rounded" | "soft" | "square",
                }))
              }
            >
              <option value="rounded">Rounded</option>
              <option value="soft">Soft</option>
              <option value="square">Square</option>
            </Select>
            <Select
              label="Button Size"
              value={theme.buttonSize}
              onChange={(e) =>
                setTheme((t) => ({
                  ...t,
                  buttonSize: e.target.value as "sm" | "md" | "lg",
                }))
              }
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </Select>
            <RangeInput
              label="Corner Radius (px)"
              min={0}
              max={20}
              step={1}
              value={theme.cornerRadius}
              onChange={(v) => setTheme((t) => ({ ...t, cornerRadius: v }))}
            />
          </div>

          {/* Background */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-dash-text">Page Background</h3>
            <Select
              label="Background Type"
              value={theme.bgType}
              onChange={(e) =>
                setTheme((t) => ({
                  ...t,
                  bgType: e.target.value as "solid" | "gradient" | "image",
                }))
              }
            >
              <option value="solid">Solid Color</option>
              <option value="gradient">Gradient</option>
            </Select>
            {theme.bgType === "gradient" && (
              <ColorInput
                label="Gradient (CSS)"
                value={theme.bgGradient ?? ""}
                onChange={(v) => setTheme((t) => ({ ...t, bgGradient: v }))}
              />
            )}
          </div>

          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}
          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Theme saved successfully!</p>
          )}

          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            className="w-full"
          >
            {saveMutation.isPending ? <LoadingSpinner size="sm" /> : "Save Changes"}
          </Button>
        </div>
      }
      preview={
        <EventThemeProvider initialTheme={fullTheme}>
          <div className="p-4">
            <CoverPreview event={previewEvent} className="rounded-lg" />
          </div>
        </EventThemeProvider>
      }
    />
  );
}
