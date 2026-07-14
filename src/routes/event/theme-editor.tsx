import { useState } from "react";
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
import { ColorInput, RangeInput } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { Select, Input } from "../../components/ui/Input";
import { cn } from "../../lib/utils";

export default function ThemeEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const existingTheme = (event.draft_theme ?? event.theme) as ThemeConfig | null;
  const initial: SimplifiedThemeConfig = existingTheme
    ? fullToSimplifiedTheme(existingTheme)
    : THEME_PRESETS[0].config;

  const [config, setConfig] = useState<SimplifiedThemeConfig>(initial);
  const [saved, setSaved] = useState(false);

  const fullTheme = simplifiedToFullTheme(config);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: fullTheme as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function update<K extends keyof SimplifiedThemeConfig>(
    key: K,
    value: SimplifiedThemeConfig[K]
  ) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Theme Editor</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Controls */}
        <div className="space-y-4 overflow-y-auto scrollbar-thin">
          {/* Presets */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dash-text">Presets</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setConfig(preset.config)}
                  className={cn(
                    "rounded-md border-2 p-2 text-left transition-colors",
                    config.primaryColor === preset.config.primaryColor &&
                      config.backgroundColor === preset.config.backgroundColor
                      ? "border-dash-primary"
                      : "border-dash-border hover:border-dash-muted"
                  )}
                >
                  <div
                    className="mb-1.5 flex h-8 items-center justify-center rounded text-xs font-medium"
                    style={{
                      backgroundColor: preset.config.backgroundColor,
                      color: preset.config.primaryColor,
                    }}
                  >
                    {preset.name}
                  </div>
                  <div className="flex gap-1">
                    <div className="h-3 flex-1 rounded" style={{ backgroundColor: preset.config.primaryColor }} />
                    <div className="h-3 flex-1 rounded" style={{ backgroundColor: preset.config.secondaryColor }} />
                    <div className="h-3 flex-1 rounded" style={{ backgroundColor: preset.config.surfaceColor }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dash-text">Colors</label>
            <div className="grid grid-cols-2 gap-3">
              <ColorInput label="Primary" value={config.primaryColor} onChange={(v) => update("primaryColor", v)} />
              <ColorInput label="Secondary" value={config.secondaryColor} onChange={(v) => update("secondaryColor", v)} />
              <ColorInput label="Background" value={config.backgroundColor} onChange={(v) => update("backgroundColor", v)} />
              <ColorInput label="Surface" value={config.surfaceColor} onChange={(v) => update("surfaceColor", v)} />
              <ColorInput label="Primary Text" value={config.primaryTextColor} onChange={(v) => update("primaryTextColor", v)} />
              <ColorInput label="Secondary Text" value={config.secondaryTextColor} onChange={(v) => update("secondaryTextColor", v)} />
            </div>
          </div>

          {/* Fonts */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dash-text">Fonts</label>
            <div className="space-y-3">
              <Select label="Heading Font" value={config.headingFont} onChange={(e) => update("headingFont", e.target.value)}>
                {HEADING_FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
              <Select label="Body Font" value={config.bodyFont} onChange={(e) => update("bodyFont", e.target.value)}>
                {RICH_FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
              <Select label="Font Scale" value={config.fontScale} onChange={(e) => update("fontScale", e.target.value as "sm" | "md" | "lg")}>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </Select>
            </div>
          </div>

          {/* Buttons & Radius */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dash-text">Buttons & Shape</label>
            <div className="space-y-3">
              <Select label="Button Style" value={config.buttonStyle} onChange={(e) => update("buttonStyle", e.target.value as "rounded" | "soft" | "square")}>
                <option value="rounded">Rounded</option>
                <option value="soft">Soft</option>
                <option value="square">Square</option>
              </Select>
              <Select label="Button Size" value={config.buttonSize} onChange={(e) => update("buttonSize", e.target.value as "sm" | "md" | "lg")}>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </Select>
              <RangeInput label="Corner Radius" value={config.cornerRadius} min={0} max={24} onChange={(v) => update("cornerRadius", v)} />
            </div>
          </div>

          {/* Page Background */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dash-text">Page Background</label>
            <Select label="Background Type" value={config.bgType} onChange={(e) => update("bgType", e.target.value as "solid" | "gradient" | "image")}>
              <option value="solid">Solid Color</option>
              <option value="gradient">Gradient</option>
              <option value="image">Image</option>
            </Select>
            {config.bgType === "gradient" && (
              <Input
                label="Gradient CSS"
                value={config.bgGradient ?? ""}
                onChange={(e) => update("bgGradient", e.target.value)}
                placeholder="linear-gradient(135deg, #fff, #f0f0f0)"
                className="mt-2"
              />
            )}
            {config.bgType === "image" && (
              <Input
                label="Image URL"
                value={config.bgImage ?? ""}
                onChange={(e) => update("bgImage", e.target.value)}
                placeholder="https://..."
                className="mt-2"
              />
            )}
          </div>

          {saveMutation.isError && (
            <p className="text-sm text-red-600">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed."}
            </p>
          )}
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <label className="mb-2 block text-sm font-medium text-dash-text">Live Preview</label>
          <div className="overflow-hidden rounded-lg border border-dash-border">
            <EventThemeProvider initialTheme={fullTheme}>
              <div className="p-6">
                <h1 className="mb-2 text-3xl font-bold">Welcome to Our Event</h1>
                <p className="mb-4">
                  This is a preview of how your event website will look with the
                  selected theme. The fonts, colors, and shapes update in real time.
                </p>
                <div className="event-card mb-4">
                  <h2 className="mb-1 text-xl font-semibold">Event Details</h2>
                  <p className="text-sm">Saturday, June 15, 2025 at 4:00 PM</p>
                  <p className="text-sm">The Grand Ballroom, 123 Main Street</p>
                </div>
                <div className="flex gap-2">
                  <button className="event-btn-primary">RSVP Now</button>
                  <button className="event-btn-secondary">View Details</button>
                </div>
              </div>
            </EventThemeProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
