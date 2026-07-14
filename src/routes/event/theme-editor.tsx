import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import {
  THEME_PRESETS,
  RICH_FONT_OPTIONS,
  HEADING_FONT_OPTIONS,
  simplifiedToFullTheme,
  fullToSimplifiedTheme,
  type SimplifiedThemeConfig,
  type ThemeConfig,
  type FontScale,
  type ButtonStyle,
  type ButtonSize,
} from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Card, ColorInput, RangeInput } from "../../components/ui";
import { Select } from "../../components/ui/Input";
import { EventThemeProvider } from "../../lib/theme-context";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { cn } from "../../lib/utils";
import type { EventOutletContext } from "./event-layout";

function getThemeConfig(event: UserEvent): ThemeConfig {
  const draft = event.draft_theme as Record<string, unknown> | null;
  const published = event.theme as Record<string, unknown> | null;
  const raw = (draft ?? published ?? {}) as Record<string, unknown>;
  if (!raw || Object.keys(raw).length === 0) {
    return simplifiedToFullTheme(THEME_PRESETS[1].config);
  }
  return raw as unknown as ThemeConfig;
}

export default function ThemeEditor(): React.ReactElement {
  const { event, eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<ThemeConfig>(() => getThemeConfig(event));
  const [simplified, setSimplified] = useState<SimplifiedThemeConfig>(() =>
    fullToSimplifiedTheme(getThemeConfig(event)),
  );

  useEffect(() => {
    const t = getThemeConfig(event);
    setTheme(t);
    setSimplified(fullToSimplifiedTheme(t));
  }, [event]);

  function updateSimplified(patch: Partial<SimplifiedThemeConfig>): void {
    const next = { ...simplified, ...patch };
    setSimplified(next);
    setTheme(simplifiedToFullTheme(next));
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: theme as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-event", eventId] });
    },
  });

  const previewEvent: UserEvent = {
    ...event,
    theme: { ...theme },
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Theme</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Customize the look and feel of your website
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="mb-4 rounded-md border border-dash-danger/20 bg-dash-danger/5 px-4 py-3">
          <p className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
          </p>
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">Theme saved successfully</p>
        </div>
      )}

      <div className="flex h-full min-h-[600px] w-full overflow-hidden rounded-lg border border-dash-border bg-dash-surface">
        {/* Editor panel */}
        <div className="h-full w-1/2 overflow-y-auto scrollbar-thin border-r border-dash-border bg-dash-surface p-5 space-y-6">
          {/* Presets */}
          <Card>
            <h3 className="text-sm font-semibold text-dash-text mb-3">Presets</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_PRESETS.map((preset) => {
                const isActive = simplified.primaryColor === preset.config.primaryColor &&
                  simplified.backgroundColor === preset.config.backgroundColor;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setSimplified(preset.config);
                      setTheme(simplifiedToFullTheme(preset.config));
                    }}
                    className={cn(
                      "rounded-md border-2 p-2 text-left transition-all",
                      isActive
                        ? "border-dash-primary ring-1 ring-dash-primary/30"
                        : "border-dash-border hover:border-dash-primary/30",
                    )}
                  >
                    <div className="flex gap-1 mb-1.5">
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
                    <span className="text-xs font-medium text-dash-text">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Colors */}
          <Card>
            <h3 className="text-sm font-semibold text-dash-text mb-3">Colors</h3>
            <div className="grid grid-cols-2 gap-3">
              <ColorInput
                label="Primary"
                value={simplified.primaryColor}
                onChange={(v) => updateSimplified({ primaryColor: v })}
              />
              <ColorInput
                label="Secondary"
                value={simplified.secondaryColor}
                onChange={(v) => updateSimplified({ secondaryColor: v })}
              />
              <ColorInput
                label="Background"
                value={simplified.backgroundColor}
                onChange={(v) => updateSimplified({ backgroundColor: v })}
              />
              <ColorInput
                label="Surface"
                value={simplified.surfaceColor}
                onChange={(v) => updateSimplified({ surfaceColor: v })}
              />
              <ColorInput
                label="Primary Text"
                value={simplified.primaryTextColor}
                onChange={(v) => updateSimplified({ primaryTextColor: v })}
              />
              <ColorInput
                label="Secondary Text"
                value={simplified.secondaryTextColor}
                onChange={(v) => updateSimplified({ secondaryTextColor: v })}
              />
            </div>
          </Card>

          {/* Typography */}
          <Card>
            <h3 className="text-sm font-semibold text-dash-text mb-3">Typography</h3>
            <div className="space-y-4">
              <Select
                label="Heading font"
                value={simplified.headingFont}
                onChange={(e) => updateSimplified({ headingFont: e.target.value })}
              >
                {HEADING_FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
              <Select
                label="Body font"
                value={simplified.bodyFont}
                onChange={(e) => updateSimplified({ bodyFont: e.target.value })}
              >
                {RICH_FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
              <div>
                <label className="block text-sm font-medium text-dash-text mb-1.5">Font scale</label>
                <div className="flex gap-2">
                  {(["sm", "md", "lg"] as FontScale[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateSimplified({ fontScale: s })}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                        simplified.fontScale === s
                          ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                          : "border-dash-border text-dash-muted hover:bg-dash-bg",
                      )}
                    >
                      {s === "sm" ? "Small" : s === "md" ? "Medium" : "Large"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Buttons */}
          <Card>
            <h3 className="text-sm font-semibold text-dash-text mb-3">Buttons</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dash-text mb-1.5">Button style</label>
                <div className="flex gap-2">
                  {(["rounded", "soft", "square"] as ButtonStyle[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateSimplified({ buttonStyle: s })}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                        simplified.buttonStyle === s
                          ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                          : "border-dash-border text-dash-muted hover:bg-dash-bg",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dash-text mb-1.5">Button size</label>
                <div className="flex gap-2">
                  {(["sm", "md", "lg"] as ButtonSize[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateSimplified({ buttonSize: s })}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                        simplified.buttonSize === s
                          ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                          : "border-dash-border text-dash-muted hover:bg-dash-bg",
                      )}
                    >
                      {s === "sm" ? "Small" : s === "md" ? "Medium" : "Large"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Layout */}
          <Card>
            <h3 className="text-sm font-semibold text-dash-text mb-3">Layout</h3>
            <RangeInput
              label="Corner radius (px)"
              value={simplified.cornerRadius}
              min={0}
              max={24}
              step={1}
              onChange={(v) => updateSimplified({ cornerRadius: v })}
            />
          </Card>
        </div>

        {/* Preview panel */}
        <div className="h-full w-1/2 overflow-y-auto scrollbar-thin">
          <EventThemeProvider initialTheme={theme}>
            <HomePreview event={previewEvent} />
          </EventThemeProvider>
        </div>
      </div>
    </div>
  );
}
