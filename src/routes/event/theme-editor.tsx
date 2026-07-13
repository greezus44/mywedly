import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import {
  Button,
  FormField,
  Select,
  ColorInput,
  RangeInput,
  Toast,
} from "../../components/ui";
import { THEME_PRESETS, RICH_FONT_OPTIONS } from "../../lib/theme";
import { EventThemeProvider } from "../../lib/theme-context";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";

export default function ThemeEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [theme, setTheme] = useState<ThemeConfig>(
    event.draft_theme || {
      preset: "classic",
      primaryColor: "#111827",
      secondaryColor: "#6b7280",
      accentColor: "#d4af37",
      bgColor: "#ffffff",
      surfaceColor: "#ffffff",
      textColor: "#111827",
      textMutedColor: "#6b7280",
      borderColor: "#e5e7eb",
      headingFont: "Cormorant Garamond",
      bodyFont: "Inter",
      scriptFont: "Dancing Script",
      buttonRadius: 6,
    }
  );

  useEffect(() => {
    setTheme(
      event.draft_theme || {
        preset: "classic",
        primaryColor: "#111827",
        secondaryColor: "#6b7280",
        accentColor: "#d4af37",
        bgColor: "#ffffff",
        surfaceColor: "#ffffff",
        textColor: "#111827",
        textMutedColor: "#6b7280",
        borderColor: "#e5e7eb",
        headingFont: "Cormorant Garamond",
        bodyFont: "Inter",
        scriptFont: "Dancing Script",
        buttonRadius: 6,
      }
    );
  }, [event]);

  const updateTheme = (patch: Partial<ThemeConfig>) => {
    setTheme((prev) => ({ ...prev, ...patch }));
  };

  const previewEvent: UserEvent = {
    ...event,
    draft_theme: theme,
  };

  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setTheme(preset.theme);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_theme: theme })
        .eq("id", event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ message: "Theme saved", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  return (
    <div className="h-full p-4">
      <SplitEditor
        preview={
          <EventThemeProvider initialTheme={theme}>
            <CoverPreview event={previewEvent} />
          </EventThemeProvider>
        }
      >
        <div className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Theme Editor
          </h2>

          {/* Presets */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Theme Presets</label>
            <div className="flex flex-wrap gap-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    theme.preset === preset.id
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {theme.preset === preset.id && <Check className="h-3 w-3" />}
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          <h3 className="text-sm font-semibold text-gray-700">Colors</h3>

          <div className="grid grid-cols-2 gap-4">
            <ColorInput
              value={theme.primaryColor || "#111827"}
              onChange={(v) => updateTheme({ primaryColor: v })}
              label="Primary"
            />
            <ColorInput
              value={theme.secondaryColor || "#6b7280"}
              onChange={(v) => updateTheme({ secondaryColor: v })}
              label="Secondary"
            />
            <ColorInput
              value={theme.accentColor || "#d4af37"}
              onChange={(v) => updateTheme({ accentColor: v })}
              label="Accent"
            />
            <ColorInput
              value={theme.bgColor || "#ffffff"}
              onChange={(v) => updateTheme({ bgColor: v })}
              label="Background"
            />
            <ColorInput
              value={theme.surfaceColor || "#ffffff"}
              onChange={(v) => updateTheme({ surfaceColor: v })}
              label="Surface"
            />
            <ColorInput
              value={theme.textColor || "#111827"}
              onChange={(v) => updateTheme({ textColor: v })}
              label="Text"
            />
            <ColorInput
              value={theme.textMutedColor || "#6b7280"}
              onChange={(v) => updateTheme({ textMutedColor: v })}
              label="Muted Text"
            />
            <ColorInput
              value={theme.borderColor || "#e5e7eb"}
              onChange={(v) => updateTheme({ borderColor: v })}
              label="Border"
            />
          </div>

          <hr className="border-gray-100" />

          <h3 className="text-sm font-semibold text-gray-700">Fonts</h3>

          <FormField label="Heading Font">
            <Select
              value={theme.headingFont || "Cormorant Garamond"}
              onChange={(e) => updateTheme({ headingFont: e.target.value })}
            >
              {RICH_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Body Font">
            <Select
              value={theme.bodyFont || "Inter"}
              onChange={(e) => updateTheme({ bodyFont: e.target.value })}
            >
              {RICH_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Script Font">
            <Select
              value={theme.scriptFont || "Dancing Script"}
              onChange={(e) => updateTheme({ scriptFont: e.target.value })}
            >
              {RICH_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </FormField>

          <hr className="border-gray-100" />

          <h3 className="text-sm font-semibold text-gray-700">Layout</h3>

          <RangeInput
            value={theme.buttonRadius ?? 6}
            onChange={(v) => updateTheme({ buttonRadius: v })}
            min={0}
            max={20}
            step={1}
            label="Button Border Radius"
          />

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Theme"
            )}
          </Button>
        </div>
      </SplitEditor>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
