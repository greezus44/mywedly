import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import { THEME_PRESETS, RICH_FONT_OPTIONS, DEFAULT_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import {
  Card,
  ColorInput,
  RangeInput,
  FormField,
  Toast,
  type ToastType,
} from "../../components/ui";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { EventThemeProvider } from "../../lib/theme-context";

export default function ThemeEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const baseTheme: ThemeConfig = event.draft_theme ?? event.theme ?? DEFAULT_THEME;
  const [theme, setTheme] = useState<ThemeConfig>({ ...baseTheme });

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from("user_events")
        .update(updates)
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ message: "Theme saved!", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ draft_theme: theme });
  };

  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setTheme({ ...preset.theme });
    }
  };

  const update = (key: keyof ThemeConfig, value: string | number) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const previewEvent: UserEvent = {
    ...event,
    draft_theme: theme,
  };

  const headingFonts = RICH_FONT_OPTIONS.filter((f) => f.category === "heading");
  const bodyFonts = RICH_FONT_OPTIONS.filter((f) => f.category === "body");
  const scriptFonts = RICH_FONT_OPTIONS.filter((f) => f.category === "script");

  return (
    <div className="h-full overflow-y-auto p-4">
      <SplitEditor
        preview={
          <EventThemeProvider initialTheme={theme}>
            <CoverPreview event={previewEvent} />
          </EventThemeProvider>
        }
      >
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-gray-900">
              Theme
            </h2>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>

          {/* Presets */}
          <Card className="space-y-3 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Presets
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    theme.preset === preset.id
                      ? "border-gray-900 ring-2 ring-gray-900"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-4 w-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: preset.theme.primaryColor ?? undefined }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: preset.theme.accentColor ?? undefined }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: preset.theme.bgColor ?? undefined }}
                    />
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {preset.name}
                  </p>
                  <p className="text-xs text-gray-500">{preset.description}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Colors */}
          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Colors
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ColorInput
                label="Primary"
                value={theme.primaryColor ?? "#1a1a1a"}
                onChange={(v) => update("primaryColor", v)}
              />
              <ColorInput
                label="Secondary"
                value={theme.secondaryColor ?? "#6b7280"}
                onChange={(v) => update("secondaryColor", v)}
              />
              <ColorInput
                label="Accent"
                value={theme.accentColor ?? "#b08d57"}
                onChange={(v) => update("accentColor", v)}
              />
              <ColorInput
                label="Background"
                value={theme.bgColor ?? "#ffffff"}
                onChange={(v) => update("bgColor", v)}
              />
              <ColorInput
                label="Surface"
                value={theme.surfaceColor ?? "#ffffff"}
                onChange={(v) => update("surfaceColor", v)}
              />
              <ColorInput
                label="Text"
                value={theme.textColor ?? "#1f2937"}
                onChange={(v) => update("textColor", v)}
              />
              <ColorInput
                label="Text Muted"
                value={theme.textMutedColor ?? "#6b7280"}
                onChange={(v) => update("textMutedColor", v)}
              />
              <ColorInput
                label="Border"
                value={theme.borderColor ?? "#e5e7eb"}
                onChange={(v) => update("borderColor", v)}
              />
            </div>
          </Card>

          {/* Fonts */}
          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Fonts
            </h3>
            <FormField label="Heading font">
              <Select
                value={theme.headingFont ?? ""}
                onChange={(e) => update("headingFont", e.target.value)}
              >
                {headingFonts.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Body font">
              <Select
                value={theme.bodyFont ?? ""}
                onChange={(e) => update("bodyFont", e.target.value)}
              >
                {bodyFonts.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Script font">
              <Select
                value={theme.scriptFont ?? ""}
                onChange={(e) => update("scriptFont", e.target.value)}
              >
                {scriptFonts.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </Card>

          {/* Button radius */}
          <Card className="space-y-2 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Button Radius
            </h3>
            <RangeInput
              label="Border radius"
              value={theme.buttonRadius ?? 6}
              min={0}
              max={30}
              step={1}
              onChange={(v) => update("buttonRadius", v)}
            />
            <p className="text-xs text-gray-400">
              Use 9999 for fully rounded pill buttons.
            </p>
          </Card>
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
