import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
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
import { Button } from "../../components/ui/Button";
import { ColorInput, RangeInput, Select } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { cn } from "../../lib/utils";

const PRESET_KEYS = Object.keys(THEME_PRESETS);

const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(180deg, #2c3e50 0%, #4ca1af 100%)",
];

const DEFAULT_SIMPLIFIED: SimplifiedThemeConfig = {
  primaryColor: "#b45309",
  secondaryColor: "#d97706",
  backgroundColor: "#fffbeb",
  surfaceColor: "#ffffff",
  primaryTextColor: "#78350f",
  secondaryTextColor: "#92400e",
  headingFont: "Georgia, serif",
  bodyFont: "Georgia, serif",
  fontScale: "md",
  buttonStyle: "rounded",
  buttonSize: "md",
  cornerRadius: 8,
  bgType: "solid",
};

export default function ThemeEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const storedTheme = (event.draft_theme ?? event.theme ?? {}) as unknown as ThemeConfig;
  const initialSimplified = useMemo(() => {
    if (Object.keys(storedTheme).length > 0) {
      return fullToSimplifiedTheme(storedTheme);
    }
    return DEFAULT_SIMPLIFIED;
  }, [event.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [config, setConfig] = useState<SimplifiedThemeConfig>(initialSimplified);

  useEffect(() => {
    setConfig(initialSimplified);
  }, [initialSimplified]);

  const fullTheme = useMemo(() => simplifiedToFullTheme(config), [config]);

  // Detect active preset
  const activePreset = useMemo(() => {
    return PRESET_KEYS.find((key) => {
      const preset = THEME_PRESETS[key].theme;
      return (
        preset.primaryColor === config.primaryColor &&
        preset.secondaryColor === config.secondaryColor &&
        preset.backgroundColor === config.backgroundColor &&
        preset.surfaceColor === config.surfaceColor &&
        preset.primaryTextColor === config.primaryTextColor &&
        preset.secondaryTextColor === config.secondaryTextColor &&
        preset.headingFont === config.headingFont &&
        preset.bodyFont === config.bodyFont &&
        preset.fontScale === config.fontScale &&
        preset.buttonStyle === config.buttonStyle &&
        preset.buttonSize === config.buttonSize &&
        preset.cornerRadius === config.cornerRadius &&
        preset.bgType === config.bgType
      );
    });
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: fullTheme as unknown as Json })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
    },
  });

  const update = (patch: Partial<SimplifiedThemeConfig>) =>
    setConfig({ ...config, ...patch });

  const applyPreset = (key: string) => {
    const preset = THEME_PRESETS[key];
    if (preset) setConfig({ ...preset.theme });
  };

  return (
    <SplitEditor
      editorRatio={0.42}
      editor={
        <div className="space-y-6">
          {/* Header with Save */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-dash-surface pb-2">
            <h2 className="text-lg font-semibold text-dash-text">Theme Editor</h2>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
            >
              Save Changes
            </Button>
          </div>

          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Theme saved successfully!</p>
          )}
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save theme"}
            </p>
          )}

          {/* 1. Theme Presets */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Theme Presets</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PRESET_KEYS.map((key) => {
                const preset = THEME_PRESETS[key];
                const isActive = activePreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all",
                      isActive
                        ? "border-dash-primary bg-dash-primary/10 text-dash-primary ring-1 ring-dash-primary"
                        : "border-dash-border text-dash-text hover:border-dash-primary/50",
                    )}
                  >
                    <span
                      className="h-5 w-5 shrink-0 rounded-full border border-dash-border"
                      style={{
                        backgroundColor: preset.theme.primaryColor,
                        boxShadow: `inset 0 0 0 2px ${preset.theme.backgroundColor}`,
                      }}
                    />
                    <span className="truncate">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Colours */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Colours</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ColorInput
                label="Primary Colour"
                value={config.primaryColor}
                onChange={(v) => update({ primaryColor: v })}
              />
              <ColorInput
                label="Secondary Colour"
                value={config.secondaryColor}
                onChange={(v) => update({ secondaryColor: v })}
              />
              <ColorInput
                label="Background Colour"
                value={config.backgroundColor}
                onChange={(v) => update({ backgroundColor: v })}
              />
              <ColorInput
                label="Surface / Card Colour"
                value={config.surfaceColor}
                onChange={(v) => update({ surfaceColor: v })}
              />
              <ColorInput
                label="Primary Text Colour"
                value={config.primaryTextColor}
                onChange={(v) => update({ primaryTextColor: v })}
              />
              <ColorInput
                label="Secondary Text Colour"
                value={config.secondaryTextColor}
                onChange={(v) => update({ secondaryTextColor: v })}
              />
            </div>
          </section>

          {/* 3. Typography */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Typography</h3>
            <div className="space-y-3">
              <Select
                label="Heading Font"
                value={config.headingFont}
                onChange={(e) => update({ headingFont: e.target.value })}
              >
                {HEADING_FONT_OPTIONS.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font.split(",")[0].replace(/['"]/g, "")}
                  </option>
                ))}
              </Select>
              <Select
                label="Body Font"
                value={config.bodyFont}
                onChange={(e) => update({ bodyFont: e.target.value })}
              >
                {RICH_FONT_OPTIONS.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font.split(",")[0].replace(/['"]/g, "")}
                  </option>
                ))}
              </Select>
              <div>
                <span className="block text-sm font-medium text-dash-text mb-1">
                  Font Scale
                </span>
                <div className="flex gap-2">
                  {([
                    { val: "sm", label: "Small" },
                    { val: "md", label: "Medium" },
                    { val: "lg", label: "Large" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => update({ fontScale: opt.val })}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                        config.fontScale === opt.val
                          ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                          : "border-dash-border text-dash-muted hover:text-dash-text",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 4. Button Style */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Button Style</h3>
            <div className="space-y-3">
              <div>
                <span className="block text-sm font-medium text-dash-text mb-1">
                  Button Style
                </span>
                <div className="flex gap-2">
                  {([
                    { val: "rounded", label: "Rounded" },
                    { val: "soft", label: "Soft Rounded" },
                    { val: "square", label: "Square" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => update({ buttonStyle: opt.val })}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                        config.buttonStyle === opt.val
                          ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                          : "border-dash-border text-dash-muted hover:text-dash-text",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-dash-text mb-1">
                  Button Size
                </span>
                <div className="flex gap-2">
                  {([
                    { val: "sm", label: "Small" },
                    { val: "md", label: "Medium" },
                    { val: "lg", label: "Large" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => update({ buttonSize: opt.val })}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                        config.buttonSize === opt.val
                          ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                          : "border-dash-border text-dash-muted hover:text-dash-text",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 5. Corner Radius */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Corner Radius</h3>
            <RangeInput
              label="Radius (px)"
              value={config.cornerRadius}
              min={0}
              max={24}
              step={1}
              onChange={(v) => update({ cornerRadius: v })}
            />
          </section>

          {/* 6. Page Background */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Page Background</h3>
            <div className="flex gap-2 mb-3">
              {([
                { val: "solid", label: "Solid" },
                { val: "gradient", label: "Gradient" },
                { val: "image", label: "Image" },
              ] as const).map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => update({ bgType: opt.val })}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    config.bgType === opt.val
                      ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                      : "border-dash-border text-dash-muted hover:text-dash-text",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {config.bgType === "gradient" && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="linear-gradient(135deg, #color1, #color2)"
                  value={config.bgGradient ?? ""}
                  onChange={(e) => update({ bgGradient: e.target.value })}
                  className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
                />
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENT_PRESETS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => update({ bgGradient: g })}
                      className={cn(
                        "h-10 rounded-lg border-2 transition-all",
                        config.bgGradient === g
                          ? "border-dash-primary ring-1 ring-dash-primary"
                          : "border-dash-border hover:border-dash-primary/50",
                      )}
                      style={{ background: g }}
                    />
                  ))}
                </div>
              </div>
            )}

            {config.bgType === "image" && (
              <div className="space-y-3">
                <ImageUpload
                  label="Background Image"
                  value={config.bgImage ?? null}
                  onChange={(url: string | null) => update({ bgImage: url ?? undefined })}
                  eventId={event.id}
                  aspect="16/9"
                />
                <Select
                  label="Image Position"
                  value={config.bgImagePosition ?? "center"}
                  onChange={(e) => update({ bgImagePosition: e.target.value })}
                >
                  <option value="center">Center</option>
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                </Select>
                <RangeInput
                  label="Overlay Opacity (%)"
                  value={config.bgOverlayOpacity ?? 0}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(v) => update({ bgOverlayOpacity: v })}
                />
              </div>
            )}
          </section>
        </div>
      }
      preview={
        <EventThemeProvider initialTheme={fullTheme}>
          <ThemePreview config={config} event={event} />
        </EventThemeProvider>
      }
    />
  );
}

// --- Live Preview Component ---

function ThemePreview({
  config,
  event,
}: {
  config: SimplifiedThemeConfig;
  event: UserEvent;
}) {
  const radius = `${config.cornerRadius}px`;

  const buttonRadius =
    config.buttonStyle === "square"
      ? "0px"
      : config.buttonStyle === "soft"
        ? `${Math.max(2, config.cornerRadius * 0.5)}px`
        : `${config.cornerRadius}px`;

  const buttonPadding =
    config.buttonSize === "sm"
      ? "0.375rem 0.875rem"
      : config.buttonSize === "lg"
        ? "0.75rem 1.75rem"
        : "0.5rem 1.25rem";

  const bgStyle: React.CSSProperties =
    config.bgType === "gradient"
      ? { background: config.bgGradient || config.backgroundColor }
      : config.bgType === "image" && config.bgImage
        ? {
            backgroundImage: `url(${config.bgImage})`,
            backgroundSize: config.bgImagePosition === "contain" ? "contain" : "cover",
            backgroundPosition: "center",
          }
        : { backgroundColor: config.backgroundColor };

  return (
    <div className="min-h-full p-6" style={bgStyle}>
      {config.bgType === "image" && config.bgImage && (
        <div
          className="fixed inset-0"
          style={{
            backgroundColor: "#000",
            opacity: (config.bgOverlayOpacity ?? 0) / 100,
            pointerEvents: "none",
          }}
        />
      )}

      <div className="relative mx-auto max-w-lg space-y-6">
        {/* Mini Cover Preview */}
        <div
          className="flex flex-col items-center justify-center overflow-hidden text-center"
          style={{
            borderRadius: radius,
            minHeight: 200,
            backgroundColor: config.surfaceColor,
            border: `1px solid ${config.secondaryColor}33`,
          }}
        >
          <p
            className="mt-6 text-xs uppercase tracking-widest"
            style={{ color: config.secondaryTextColor }}
          >
            {event.draft_event_type || event.event_type || "Wedding"}
          </p>
          <h1
            className="mt-2 text-3xl font-bold"
            style={{ fontFamily: config.headingFont, color: config.primaryTextColor }}
          >
            {event.draft_name || event.name || "Our Wedding"}
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: config.secondaryTextColor }}
          >
            {event.draft_venue || event.venue || "Venue Name"}
          </p>
          <div className="my-4">
            <button
              style={{
                backgroundColor: config.primaryColor,
                color: "#fff",
                borderRadius: buttonRadius,
                padding: buttonPadding,
                fontSize: config.buttonSize === "sm" ? "0.75rem" : config.buttonSize === "lg" ? "1rem" : "0.875rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              RSVP Now
            </button>
          </div>
        </div>

        {/* Mini Card */}
        <div
          className="p-5"
          style={{
            backgroundColor: config.surfaceColor,
            borderRadius: radius,
            border: `1px solid ${config.secondaryColor}33`,
          }}
        >
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: config.headingFont, color: config.primaryTextColor }}
          >
            When & Where
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: config.primaryTextColor, fontFamily: config.bodyFont }}
          >
            Join us for our special celebration. We can't wait to share this moment with you.
          </p>
          <p
            className="mt-2 text-xs"
            style={{ color: config.secondaryTextColor, fontFamily: config.bodyFont }}
          >
            Saturday, June 15, 2025 at 4:00 PM
          </p>
        </div>

        {/* Button + Text demo */}
        <div
          className="flex items-center gap-3 p-4"
          style={{
            backgroundColor: config.surfaceColor,
            borderRadius: radius,
            border: `1px solid ${config.secondaryColor}33`,
          }}
        >
          <button
            style={{
              backgroundColor: config.primaryColor,
              color: "#fff",
              borderRadius: buttonRadius,
              padding: buttonPadding,
              fontSize: config.buttonSize === "sm" ? "0.75rem" : config.buttonSize === "lg" ? "1rem" : "0.875rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Primary
          </button>
          <button
            style={{
              backgroundColor: "transparent",
              color: config.primaryColor,
              borderRadius: buttonRadius,
              padding: buttonPadding,
              fontSize: config.buttonSize === "sm" ? "0.75rem" : config.buttonSize === "lg" ? "1rem" : "0.875rem",
              fontWeight: 600,
              border: `1px solid ${config.secondaryColor}`,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Secondary
          </button>
          <div className="ml-auto text-right">
            <p
              className="text-sm font-medium"
              style={{ color: config.primaryTextColor }}
            >
              Heading Text
            </p>
            <p className="text-xs" style={{ color: config.secondaryTextColor }}>
              Caption text
            </p>
          </div>
        </div>

        {/* Input demo */}
        <div
          className="p-4"
          style={{
            backgroundColor: config.surfaceColor,
            borderRadius: radius,
            border: `1px solid ${config.secondaryColor}33`,
          }}
        >
          <p
            className="mb-2 text-sm font-medium"
            style={{ color: config.primaryTextColor }}
          >
            Input Field
          </p>
          <input
            type="text"
            placeholder="Type here..."
            disabled
            style={{
              backgroundColor: config.backgroundColor,
              border: `1px solid ${config.secondaryColor}66`,
              color: config.primaryTextColor,
              borderRadius: radius,
              padding: "0.5rem 0.75rem",
              width: "100%",
              outline: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
