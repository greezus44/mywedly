import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import {
  THEME_PRESETS,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
  simplifiedToFullTheme,
  fullToSimplifiedTheme,
  type SimplifiedThemeConfig,
  type ThemeConfig,
} from "../../lib/theme";
import { EventThemeProvider } from "../../lib/theme-context";
import { Button } from "../../components/ui/Button";
import { ColorInput, RangeInput, Select } from "../../components/ui";
import { cn } from "../../lib/utils";
import type { EventOutletContext } from "./event-layout";

export default function ThemeEditor() {
  const { event, eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const existingTheme = event.draft_theme ?? event.theme;
  const fullTheme: ThemeConfig = existingTheme
    ? (existingTheme as unknown as ThemeConfig)
    : simplifiedToFullTheme(THEME_PRESETS[2].config);
  const initial: SimplifiedThemeConfig = fullToSimplifiedTheme(fullTheme);

  const [config, setConfig] = useState<SimplifiedThemeConfig>(initial);
  const [saved, setSaved] = useState(false);

  const fullConfig = simplifiedToFullTheme(config);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_theme: fullConfig as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const applyPreset = (presetConfig: SimplifiedThemeConfig) => {
    setConfig({ ...presetConfig });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-dash-border bg-dash-surface px-4 py-3">
        <h2 className="text-lg font-semibold text-dash-text">Theme Editor</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Editor */}
        <div className="overflow-y-auto lg:w-[400px] lg:border-r border-dash-border bg-dash-surface">
          <div className="space-y-6 p-4">
            {/* Presets */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">
                Presets
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.config)}
                    className={cn(
                      "rounded-lg border-2 p-2 text-left transition-all hover:shadow-sm",
                      config.primaryColor === preset.config.primaryColor &&
                        config.backgroundColor === preset.config.backgroundColor
                        ? "border-dash-primary"
                        : "border-dash-border"
                    )}
                  >
                    <div
                      className="mb-2 flex gap-1"
                      style={{ background: preset.config.backgroundColor, borderRadius: 4, padding: 4 }}
                    >
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{ background: preset.config.primaryColor }}
                      />
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{ background: preset.config.secondaryColor }}
                      />
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{ background: preset.config.surfaceColor }}
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
            <div>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">
                Colors
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <ColorInput
                  label="Primary"
                  value={config.primaryColor}
                  onChange={(v) => setConfig({ ...config, primaryColor: v })}
                />
                <ColorInput
                  label="Secondary"
                  value={config.secondaryColor}
                  onChange={(v) => setConfig({ ...config, secondaryColor: v })}
                />
                <ColorInput
                  label="Background"
                  value={config.backgroundColor}
                  onChange={(v) => setConfig({ ...config, backgroundColor: v })}
                />
                <ColorInput
                  label="Surface"
                  value={config.surfaceColor}
                  onChange={(v) => setConfig({ ...config, surfaceColor: v })}
                />
                <ColorInput
                  label="Primary Text"
                  value={config.primaryTextColor}
                  onChange={(v) =>
                    setConfig({ ...config, primaryTextColor: v })
                  }
                />
                <ColorInput
                  label="Secondary Text"
                  value={config.secondaryTextColor}
                  onChange={(v) =>
                    setConfig({ ...config, secondaryTextColor: v })
                  }
                />
              </div>
            </div>

            {/* Fonts */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">
                Fonts
              </h3>
              <div className="space-y-3">
                <Select
                  label="Heading Font"
                  value={config.headingFont}
                  onChange={(e) =>
                    setConfig({ ...config, headingFont: e.target.value })
                  }
                >
                  {HEADING_FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f.replace(/['"]/g, "").split(",")[0]}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Body Font"
                  value={config.bodyFont}
                  onChange={(e) =>
                    setConfig({ ...config, bodyFont: e.target.value })
                  }
                >
                  {RICH_FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f.replace(/['"]/g, "").split(",")[0]}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Font Scale"
                  value={config.fontScale}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      fontScale: e.target.value as "sm" | "md" | "lg",
                    })
                  }
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </Select>
              </div>
            </div>

            {/* Buttons & Corners */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">
                Buttons & Corners
              </h3>
              <div className="space-y-3">
                <Select
                  label="Button Style"
                  value={config.buttonStyle}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      buttonStyle: e.target.value as "rounded" | "soft" | "square",
                    })
                  }
                >
                  <option value="rounded">Rounded</option>
                  <option value="soft">Soft</option>
                  <option value="square">Square</option>
                </Select>
                <Select
                  label="Button Size"
                  value={config.buttonSize}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      buttonSize: e.target.value as "sm" | "md" | "lg",
                    })
                  }
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </Select>
                <RangeInput
                  label="Corner Radius"
                  value={config.cornerRadius}
                  onChange={(v) => setConfig({ ...config, cornerRadius: v })}
                  min={0}
                  max={24}
                  step={1}
                />
              </div>
            </div>

            {/* Page Background */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">
                Page Background
              </h3>
              <Select
                label="Background Type"
                value={config.bgType}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    bgType: e.target.value as "solid" | "gradient" | "image",
                  })
                }
              >
                <option value="solid">Solid Color</option>
                <option value="gradient">Gradient</option>
                <option value="image">Image</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex-1 overflow-y-auto bg-dash-bg">
          <div className="p-4">
            <EventThemeProvider initialTheme={fullConfig}>
              <div className="mx-auto max-w-2xl">
                <div className="rounded-lg border border-event-border bg-event-surface p-8 shadow-sm">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--event-muted)" }}
                  >
                    {event.draft_name ?? event.name}
                  </p>
                  <h1
                    className="mt-2 text-3xl font-bold"
                    style={{
                      color: "var(--event-heading)",
                      fontFamily: "var(--event-font-heading)",
                    }}
                  >
                    Sample Heading
                  </h1>
                  <p
                    className="mt-3 text-base"
                    style={{
                      color: "var(--event-text)",
                      fontFamily: "var(--event-font-body)",
                    }}
                  >
                    This is what your body text will look like. Lorem ipsum
                    dolor sit amet, consectetur adipiscing elit.
                  </p>
                  <button
                    type="button"
                    className="mt-6 inline-flex items-center justify-center font-medium transition-colors"
                    style={{
                      background: "var(--event-primary)",
                      color: "var(--event-primary-fg)",
                      borderRadius: "var(--event-radius)",
                      padding:
                        config.buttonSize === "lg"
                          ? "12px 24px"
                          : config.buttonSize === "sm"
                          ? "6px 12px"
                          : "8px 16px",
                      fontSize:
                        config.buttonSize === "lg"
                          ? "16px"
                          : config.buttonSize === "sm"
                          ? "12px"
                          : "14px",
                    }}
                  >
                    Sample Button
                  </button>
                </div>

                <div className="mt-4 rounded-lg border border-event-border bg-event-surface p-6">
                  <h2
                    className="text-xl font-semibold"
                    style={{
                      color: "var(--event-heading)",
                      fontFamily: "var(--event-font-heading)",
                    }}
                  >
                    Card Component
                  </h2>
                  <p
                    className="mt-2 text-sm"
                    style={{
                      color: "var(--event-muted)",
                      fontFamily: "var(--event-font-body)",
                    }}
                  >
                    Preview how cards and sections will appear with your theme.
                  </p>
                </div>
              </div>
            </EventThemeProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
