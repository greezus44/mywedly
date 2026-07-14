import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useOutletContext } from "./event-layout";
import {
  THEME_PRESETS,
  RICH_FONT_OPTIONS,
  HEADING_FONT_OPTIONS,
  simplifiedToFullTheme,
  fullToSimplifiedTheme,
  jsonToTheme,
  type SimplifiedThemeConfig,
  type ThemeConfig,
} from "../../lib/theme";
import { EventThemeProvider } from "../../lib/theme-context";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { ColorInput, RangeInput, Select } from "../../components/ui";
import { cn } from "../../lib/utils";

const FONT_SCALE_OPTIONS: { label: string; value: "sm" | "md" | "lg" }[] = [
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
];

const BUTTON_STYLES: { label: string; value: "rounded" | "soft" | "square" }[] = [
  { label: "Rounded", value: "rounded" },
  { label: "Soft", value: "soft" },
  { label: "Square", value: "square" },
];

const BUTTON_SIZES: { label: string; value: "sm" | "md" | "lg" }[] = [
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
];

export default function ThemeEditor() {
  const { event, eventId } = useOutletContext();
  const queryClient = useQueryClient();

  const fullTheme = jsonToTheme(event.draft_theme ?? event.theme);
  const initialSimplified = fullToSimplifiedTheme(fullTheme);

  const [simplified, setSimplified] = useState<SimplifiedThemeConfig>(initialSimplified);
  const [savedEvent, setSavedEvent] = useState(event);

  useEffect(() => {
    setSavedEvent(event);
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fullConfig = simplifiedToFullTheme(simplified);
      const { data, error } = await supabase
        .from("user_events")
        .update({
          draft_theme: fullConfig as unknown as Json,
        })
        .eq("id", eventId)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user_event", eventId] });
      if (data) setSavedEvent(data as typeof event);
    },
  });

  const previewTheme = simplifiedToFullTheme(simplified);
  const previewEvent = {
    ...savedEvent,
    draft_theme: previewTheme as unknown as Json,
  };

  const applyPreset = (preset: SimplifiedThemeConfig) => {
    setSimplified(preset);
  };

  const update = <K extends keyof SimplifiedThemeConfig>(
    key: K,
    value: SimplifiedThemeConfig[K]
  ) => {
    setSimplified((s) => ({ ...s, [key]: value }));
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Theme Editor</h2>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="mb-2 text-sm text-dash-danger">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="mb-2 text-sm text-green-600">Theme saved successfully!</p>
      )}

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Editor panel */}
        <div className="w-1/2 overflow-y-auto scrollbar-thin rounded-lg border border-dash-border bg-dash-bg p-4">
          {/* Presets */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-dash-text">
              Theme Presets
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset.config)}
                  className={cn(
                    "rounded-md border p-2 text-left transition-colors",
                    simplified.primaryColor === preset.config.primaryColor &&
                      simplified.backgroundColor === preset.config.backgroundColor
                      ? "border-dash-primary bg-dash-primary/5"
                      : "border-dash-border hover:bg-dash-bg"
                  )}
                >
                  <div className="mb-1 flex gap-1">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: preset.config.primaryColor }}
                    />
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: preset.config.secondaryColor }}
                    />
                    <div
                      className="h-4 w-4 rounded-full border border-dash-border"
                      style={{ backgroundColor: preset.config.backgroundColor }}
                    />
                  </div>
                  <p className="text-xs font-medium text-dash-text">
                    {preset.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-dash-text">Colors</h3>
            <div className="grid grid-cols-2 gap-3">
              <ColorInput
                label="Primary"
                value={simplified.primaryColor}
                onChange={(v) => update("primaryColor", v)}
              />
              <ColorInput
                label="Secondary"
                value={simplified.secondaryColor}
                onChange={(v) => update("secondaryColor", v)}
              />
              <ColorInput
                label="Background"
                value={simplified.backgroundColor}
                onChange={(v) => update("backgroundColor", v)}
              />
              <ColorInput
                label="Surface"
                value={simplified.surfaceColor}
                onChange={(v) => update("surfaceColor", v)}
              />
              <ColorInput
                label="Primary Text"
                value={simplified.primaryTextColor}
                onChange={(v) => update("primaryTextColor", v)}
              />
              <ColorInput
                label="Secondary Text"
                value={simplified.secondaryTextColor}
                onChange={(v) => update("secondaryTextColor", v)}
              />
            </div>
          </div>

          {/* Fonts */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-dash-text">Fonts</h3>
            <div className="flex flex-col gap-3">
              <Select
                label="Heading Font"
                value={simplified.headingFont}
                onChange={(e) => update("headingFont", e.target.value)}
              >
                {HEADING_FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Body Font"
                value={simplified.bodyFont}
                onChange={(e) => update("bodyFont", e.target.value)}
              >
                {RICH_FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Font Scale"
                value={simplified.fontScale}
                onChange={(e) =>
                  update("fontScale", e.target.value as "sm" | "md" | "lg")
                }
              >
                {FONT_SCALE_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Buttons & Radius */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-dash-text">
              Buttons & Corners
            </h3>
            <div className="flex flex-col gap-3">
              <Select
                label="Button Style"
                value={simplified.buttonStyle}
                onChange={(e) =>
                  update("buttonStyle", e.target.value as "rounded" | "soft" | "square")
                }
              >
                {BUTTON_STYLES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Button Size"
                value={simplified.buttonSize}
                onChange={(e) =>
                  update("buttonSize", e.target.value as "sm" | "md" | "lg")
                }
              >
                {BUTTON_SIZES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </Select>
              <RangeInput
                label="Corner Radius"
                value={simplified.cornerRadius}
                min={0}
                max={24}
                step={1}
                onChange={(v) => update("cornerRadius", v)}
              />
            </div>
          </div>

          {/* Background */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-dash-text">
              Page Background
            </h3>
            <Select
              label="Background Type"
              value={simplified.bgType}
              onChange={(e) =>
                update("bgType", e.target.value as "solid" | "gradient" | "image")
              }
            >
              <option value="solid">Solid Color</option>
              <option value="gradient">Gradient</option>
              <option value="image">Image</option>
            </Select>
            {simplified.bgType === "gradient" && (
              <input
                type="text"
                value={simplified.bgGradient ?? ""}
                onChange={(e) => update("bgGradient", e.target.value)}
                placeholder="linear-gradient(135deg, #fff 0%, #eee 100%)"
                className="mt-2 w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
              />
            )}
          </div>
        </div>

        {/* Preview panel */}
        <div className="flex-1 overflow-y-auto scrollbar-thin rounded-lg border border-dash-border">
          <EventThemeProvider initialTheme={previewTheme}>
            <div className="p-4">
              <CoverPreview event={previewEvent} draft />
            </div>
          </EventThemeProvider>
        </div>
      </div>
    </div>
  );
}
