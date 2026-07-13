import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Palette, Type, Square, Maximize } from "lucide-react";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, FormField, ColorInput, RangeInput, Skeleton, ErrorState, Toast } from "../../components/ui";
import { Select } from "../../components/ui/Input";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { DEFAULT_THEME, THEME_PRESETS, FONT_OPTIONS, themeToCssVars } from "../../lib/theme";

function ThemeEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: event, isLoading, isError, refetch } = useQuery<UserEvent>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event) {
      setTheme(event.draft_theme || event.theme || DEFAULT_THEME);
    }
  }, [event]);

  const updateMutation = useMutation({
    mutationFn: async (newTheme: ThemeConfig) => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_theme: newTheme, updated_at: new Date().toISOString() })
        .eq("id", eventId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["event", eventId], data);
      setToast({ message: "Theme saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save theme", type: "error" }),
  });

  const updateField = useCallback(
    <K extends keyof ThemeConfig>(field: K, value: ThemeConfig[K]) => {
      setTheme((prev) => {
        const next = { ...prev, [field]: value };
        updateMutation.mutate(next);
        return next;
      });
    },
    [updateMutation],
  );

  const applyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) {
      setTheme(preset);
      updateMutation.mutate(preset);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return <ErrorState message="Failed to load event" onRetry={refetch} />;
  }

  const previewEvent: UserEvent = { ...event, draft_theme: theme };

  const colorFields: { key: keyof ThemeConfig; label: string }[] = [
    { key: "primaryColor", label: "Primary Color" },
    { key: "secondaryColor", label: "Secondary Color" },
    { key: "accentColor", label: "Accent Color" },
    { key: "bgColor", label: "Background" },
    { key: "bgSubtleColor", label: "Background Subtle" },
    { key: "textColor", label: "Text Color" },
    { key: "textMutedColor", label: "Text Muted" },
    { key: "borderColor", label: "Border Color" },
  ];

  return (
    <div>
      <div className="px-6 lg:px-8 py-6 border-b border-onyx/10">
        <h1 className="font-heading text-3xl text-onyx">Theme Customizer</h1>
        <p className="mt-1 text-sm text-onyx/50">Choose a preset or customize every detail</p>
      </div>

      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="space-y-6">
          {updateMutation.isPending && (
            <div className="flex items-center gap-2 text-xs text-onyx/50 uppercase tracking-wider">
              <Save className="w-3.5 h-3.5 animate-pulse" /> Saving...
            </div>
          )}

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-onyx/50" />
              <h2 className="font-heading text-xl text-onyx">Theme Presets</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(THEME_PRESETS).map(([key, preset]) => {
                const isActive = theme.preset === key;
                return (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className={cn(
                      "border p-3 text-left transition-all",
                      isActive
                        ? "border-onyx bg-onyx/5"
                        : "border-onyx/15 hover:border-onyx/30",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-4 h-4 border border-onyx/10"
                        style={{ backgroundColor: preset.primaryColor }}
                      />
                      <span
                        className="w-4 h-4 border border-onyx/10"
                        style={{ backgroundColor: preset.accentColor }}
                      />
                      <span
                        className="w-4 h-4 border border-onyx/10"
                        style={{ backgroundColor: preset.bgColor }}
                      />
                    </div>
                    <p className="text-sm font-medium text-onyx capitalize">{key}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-onyx/50" />
              <h2 className="font-heading text-xl text-onyx">Colors</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {colorFields.map(({ key, label }) => (
                <FormField key={key} label={label}>
                  <ColorInput
                    value={(theme[key] as string) || ""}
                    onChange={(v) => updateField(key, v)}
                  />
                </FormField>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5 text-onyx/50" />
              <h2 className="font-heading text-xl text-onyx">Fonts</h2>
            </div>
            <div className="space-y-4">
              <FormField label="Heading Font">
                <Select
                  value={theme.headingFont || "Cormorant Garamond"}
                  onChange={(e) => updateField("headingFont", e.target.value)}
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Body Font">
                <Select
                  value={theme.bodyFont || "Inter"}
                  onChange={(e) => updateField("bodyFont", e.target.value)}
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Square className="w-5 h-5 text-onyx/50" />
              <h2 className="font-heading text-xl text-onyx">Layout</h2>
            </div>
            <div className="space-y-5">
              <FormField label="Button Radius">
                <RangeInput
                  value={theme.buttonRadius ?? 2}
                  onChange={(v) => updateField("buttonRadius", v)}
                  min={0}
                  max={20}
                  step={1}
                />
              </FormField>
              <FormField label="Section Padding">
                <RangeInput
                  value={theme.sectionPadding ?? 80}
                  onChange={(v) => updateField("sectionPadding", v)}
                  min={40}
                  max={160}
                  step={4}
                />
              </FormField>
              <FormField label="Max Width">
                <RangeInput
                  value={theme.maxWidth ?? 1200}
                  onChange={(v) => updateField("maxWidth", v)}
                  min={800}
                  max={1600}
                  step={20}
                />
              </FormField>
            </div>
          </Card>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default ThemeEditorPage;
