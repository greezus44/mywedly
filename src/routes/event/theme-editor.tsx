import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { EventThemeProvider } from "../../lib/theme-context";
import {
  THEME_PRESETS,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
  jsonToTheme,
  fullToSimplifiedTheme,
  simplifiedToFullTheme,
  type SimplifiedThemeConfig,
  type ThemeConfig,
} from "../../lib/theme";
import { ColorInput, RangeInput, Select } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";

export default function ThemeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const currentTheme = useMemo(
    () => jsonToTheme(event.draft_theme ?? event.theme),
    [event.draft_theme, event.theme]
  );

  const currentSimplified = useMemo(
    () => fullToSimplifiedTheme(currentTheme),
    [currentTheme]
  );

  const [config, setConfig] = useState<SimplifiedThemeConfig>(currentSimplified);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const liveTheme: ThemeConfig = useMemo(
    () => simplifiedToFullTheme(config),
    [config]
  );

  const update = <K extends keyof SimplifiedThemeConfig>(
    key: K,
    value: SimplifiedThemeConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (presetConfig: SimplifiedThemeConfig) => {
    setConfig({ ...presetConfig });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const themeConfig = simplifiedToFullTheme(config);
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_theme: themeConfig,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg("Saved successfully!");
      setTimeout(() => setSavedMsg(null), 3000);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Theme Editor</h1>
          <p className="text-sm text-dash-muted">
            Customize the look and feel of your website.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-sm text-green-600">{savedMsg}</span>}
          <Button
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {saveMutation.isError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">
          {saveMutation.error?.message}
        </p>
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Editor panel */}
        <div className="flex flex-col gap-6 lg:w-1/2">
          {/* Presets */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-dash-text">Presets</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset.config)}
                  className={cn(
                    "rounded-md border p-3 text-left transition-colors",
                    config.primaryColor === preset.config.primaryColor &&
                      config.backgroundColor === preset.config.backgroundColor
                      ? "border-dash-primary bg-dash-primary/5"
                      : "border-dash-border bg-dash-surface hover:border-dash-primary/50"
                  )}
                >
                  <div className="mb-2 flex gap-1">
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.config.primaryColor }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.config.secondaryColor }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.config.backgroundColor }}
                    />
                  </div>
                  <span className="text-xs font-medium text-dash-text">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-dash-text">Colors</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <ColorInput
                label="Primary"
                value={config.primaryColor}
                onChange={(v) => update("primaryColor", v)}
              />
              <ColorInput
                label="Secondary"
                value={config.secondaryColor}
                onChange={(v) => update("secondaryColor", v)}
              />
              <ColorInput
                label="Background"
                value={config.backgroundColor}
                onChange={(v) => update("backgroundColor", v)}
              />
              <ColorInput
                label="Surface"
                value={config.surfaceColor}
                onChange={(v) => update("surfaceColor", v)}
              />
              <ColorInput
                label="Primary Text"
                value={config.primaryTextColor}
                onChange={(v) => update("primaryTextColor", v)}
              />
              <ColorInput
                label="Secondary Text"
                value={config.secondaryTextColor}
                onChange={(v) => update("secondaryTextColor", v)}
              />
            </div>
          </div>

          {/* Fonts */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-dash-text">Fonts</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                label="Heading Font"
                value={config.headingFont}
                onChange={(e) => update("headingFont", e.target.value)}
              >
                {HEADING_FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
              <Select
                label="Body Font"
                value={config.bodyFont}
                onChange={(e) => update("bodyFont", e.target.value)}
              >
                {RICH_FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Typography & Controls */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-dash-text">Typography & Controls</h3>
            <div className="flex flex-col gap-4">
              <Select
                label="Font Scale"
                value={config.fontScale}
                onChange={(e) => update("fontScale", e.target.value as "sm" | "md" | "lg")}
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </Select>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Button Style"
                  value={config.buttonStyle}
                  onChange={(e) => update("buttonStyle", e.target.value as "rounded" | "soft" | "square")}
                >
                  <option value="rounded">Rounded</option>
                  <option value="soft">Soft</option>
                  <option value="square">Square</option>
                </Select>
                <Select
                  label="Button Size"
                  value={config.buttonSize}
                  onChange={(e) => update("buttonSize", e.target.value as "sm" | "md" | "lg")}
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </Select>
              </div>

              <RangeInput
                label="Corner Radius"
                value={config.cornerRadius}
                min={0}
                max={20}
                step={1}
                onChange={(v) => update("cornerRadius", v)}
              />

              <Select
                label="Page Background"
                value={config.bgType}
                onChange={(e) => update("bgType", e.target.value as "solid" | "gradient" | "image")}
              >
                <option value="solid">Solid Color</option>
                <option value="gradient">Gradient</option>
                <option value="image">Image</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:w-1/2">
          <h3 className="mb-2 text-sm font-semibold text-dash-text">Live Preview</h3>
          <EventThemeProvider initialTheme={liveTheme}>
            <div className="overflow-hidden rounded-lg border border-dash-border">
              <div className="p-6">
                <h1 className="text-3xl font-bold">Your Event Name</h1>
                <p className="mt-2 text-sm">Saturday, June 15, 2025</p>
                <p className="mt-1 text-sm">Grand Ballroom, New York</p>

                <div className="event-card mt-6">
                  <h2 className="text-xl font-semibold">Welcome</h2>
                  <p className="mt-2 text-sm">
                    We're so excited to celebrate with you. Browse the site to find all the
                    details about our special day.
                  </p>
                </div>

                <div className="mt-6 flex gap-3">
                  <button className="event-btn-primary">RSVP Now</button>
                  <button className="event-btn-secondary">View Details</button>
                </div>
              </div>
            </div>
          </EventThemeProvider>
        </div>
      </div>
    </div>
  );
}
