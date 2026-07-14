import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import {
  THEME_PRESETS,
  HEADING_FONT_OPTIONS,
  RICH_FONT_OPTIONS,
  simplifiedToFullTheme,
  fullToSimplifiedTheme,
  jsonToTheme,
  type SimplifiedThemeConfig,
  type ThemeConfig,
} from "../../lib/theme";
import { EventThemeProvider } from "../../lib/theme-context";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ColorInput, RangeInput } from "../../components/ui";
import { Select } from "../../components/ui/Input";

const RADIUS_OPTIONS = [0, 4, 8, 12, 16, 24];

export default function ThemeEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const fullTheme = jsonToTheme(event.draft_theme ?? event.theme);
  const initial: SimplifiedThemeConfig = fullToSimplifiedTheme(fullTheme);

  const [config, setConfig] = useState<SimplifiedThemeConfig>(initial);

  useEffect(() => {
    const t = jsonToTheme(event.draft_theme ?? event.theme);
    setConfig(fullToSimplifiedTheme(t));
  }, [event]);

  const liveTheme: ThemeConfig = simplifiedToFullTheme(config);

  const update = <K extends keyof SimplifiedThemeConfig>(
    key: K,
    value: SimplifiedThemeConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const full = simplifiedToFullTheme(config);
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: full as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const previewEvent: Partial<UserEvent> = {
    ...event,
    draft_theme: liveTheme as unknown as Json,
  };

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Theme Editor</h2>
          <p className="text-sm text-muted">
            Customize the look and feel of your website.
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-danger">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-success">Saved successfully!</p>
      )}

      <div className="flex h-full overflow-hidden rounded-lg border border-border">
        {/* Editor */}
        <div className="w-1/2 overflow-y-auto border-r border-border bg-surface-alt p-4">
          {/* Presets */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Presets
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setConfig(preset.config)}
                  className={cn(
                    "rounded-md border p-2 text-left transition-colors",
                    config.primaryColor === preset.config.primaryColor &&
                      config.backgroundColor === preset.config.backgroundColor
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface hover:border-primary/50"
                  )}
                >
                  <div className="mb-1 flex gap-1">
                    <span
                      className="h-4 w-4 rounded"
                      style={{ background: preset.config.primaryColor }}
                    />
                    <span
                      className="h-4 w-4 rounded"
                      style={{ background: preset.config.backgroundColor }}
                    />
                    <span
                      className="h-4 w-4 rounded"
                      style={{ background: preset.config.secondaryColor }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Colors</h3>
            <div className="grid grid-cols-2 gap-3">
              <ColorInput
                label="Primary"
                value={config.primaryColor}
                onChange={(e) => update("primaryColor", e.target.value)}
              />
              <ColorInput
                label="Secondary"
                value={config.secondaryColor}
                onChange={(e) => update("secondaryColor", e.target.value)}
              />
              <ColorInput
                label="Background"
                value={config.backgroundColor}
                onChange={(e) => update("backgroundColor", e.target.value)}
              />
              <ColorInput
                label="Surface"
                value={config.surfaceColor}
                onChange={(e) => update("surfaceColor", e.target.value)}
              />
              <ColorInput
                label="Primary Text"
                value={config.primaryTextColor}
                onChange={(e) => update("primaryTextColor", e.target.value)}
              />
              <ColorInput
                label="Secondary Text"
                value={config.secondaryTextColor}
                onChange={(e) => update("secondaryTextColor", e.target.value)}
              />
            </div>
          </div>

          {/* Fonts */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Fonts</h3>
            <div className="flex flex-col gap-3">
              <Select
                label="Heading Font"
                value={config.headingFont}
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
                value={config.bodyFont}
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
                value={config.fontScale}
                onChange={(e) =>
                  update("fontScale", e.target.value as SimplifiedThemeConfig["fontScale"])
                }
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </Select>
            </div>
          </div>

          {/* Buttons & Radius */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Buttons & Corners
            </h3>
            <div className="flex flex-col gap-3">
              <Select
                label="Button Style"
                value={config.buttonStyle}
                onChange={(e) =>
                  update("buttonStyle", e.target.value as SimplifiedThemeConfig["buttonStyle"])
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
                  update("buttonSize", e.target.value as SimplifiedThemeConfig["buttonSize"])
                }
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </Select>
              <RangeInput
                label={`Corner Radius (${config.cornerRadius}px)`}
                min={0}
                max={24}
                step={4}
                value={config.cornerRadius}
                onChange={(e) => update("cornerRadius", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Page Background */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Page Background
            </h3>
            <Select
              label="Background Type"
              value={config.bgType}
              onChange={(e) =>
                update("bgType", e.target.value as SimplifiedThemeConfig["bgType"])
              }
            >
              <option value="solid">Solid Color</option>
              <option value="gradient">Gradient</option>
              <option value="image">Image</option>
            </Select>
          </div>
        </div>

        {/* Preview */}
        <div className="w-1/2 overflow-y-auto bg-surface p-4">
          <EventThemeProvider initialTheme={liveTheme}>
            <div className="h-full">
              <CoverPreview event={previewEvent} />
            </div>
          </EventThemeProvider>
        </div>
      </div>
    </div>
  );
}
