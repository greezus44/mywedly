import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import { DEFAULT_THEME, THEME_PRESETS, RICH_FONT_OPTIONS } from "../../lib/theme";
import { Select } from "../../components/ui/Input";
import { ColorInput, RangeInput, FormField, useToast } from "../../components/ui";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { EventThemeProvider } from "../../lib/theme-context";
import { CoverPreview } from "../../components/preview/PreviewRenderers";

const PRESET_NAMES = Object.keys(THEME_PRESETS);

export default function ThemeEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [theme, setTheme] = useState<ThemeConfig>(event.draft_theme ?? event.theme ?? DEFAULT_THEME);

  useEffect(() => {
    setTheme(event.draft_theme ?? event.theme ?? DEFAULT_THEME);
  }, [event]);

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
      toast("Theme saved", "success");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      saveMutation.mutate();
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  const previewEvent = {
    ...event,
    draft_theme: theme,
  } as UserEvent;

  return (
    <SplitEditor
      preview={
        <EventThemeProvider initialTheme={theme}>
          <CoverPreview event={previewEvent} />
        </EventThemeProvider>
      }
    >
      <h3 className="text-sm font-semibold text-gray-900">Theme</h3>

      <FormField label="Preset">
        <Select
          value={theme.preset || "classic"}
          onChange={(e) => {
            const preset = THEME_PRESETS[e.target.value];
            if (preset) setTheme(preset);
          }}
        >
          {PRESET_NAMES.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="border-t border-gray-100 pt-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Colors</h4>
        <div className="flex flex-col gap-3">
          <ColorInput
            label="Primary"
            value={theme.primaryColor || ""}
            onChange={(v) => setTheme((t) => ({ ...t, primaryColor: v }))}
          />
          <ColorInput
            label="Secondary"
            value={theme.secondaryColor || ""}
            onChange={(v) => setTheme((t) => ({ ...t, secondaryColor: v }))}
          />
          <ColorInput
            label="Accent"
            value={theme.accentColor || ""}
            onChange={(v) => setTheme((t) => ({ ...t, accentColor: v }))}
          />
          <ColorInput
            label="Background"
            value={theme.bgColor || ""}
            onChange={(v) => setTheme((t) => ({ ...t, bgColor: v }))}
          />
          <ColorInput
            label="Surface"
            value={theme.surfaceColor || ""}
            onChange={(v) => setTheme((t) => ({ ...t, surfaceColor: v }))}
          />
          <ColorInput
            label="Text"
            value={theme.textColor || ""}
            onChange={(v) => setTheme((t) => ({ ...t, textColor: v }))}
          />
          <ColorInput
            label="Text muted"
            value={theme.textMutedColor || ""}
            onChange={(v) => setTheme((t) => ({ ...t, textMutedColor: v }))}
          />
          <ColorInput
            label="Border"
            value={theme.borderColor || ""}
            onChange={(v) => setTheme((t) => ({ ...t, borderColor: v }))}
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Typography</h4>
        <div className="flex flex-col gap-3">
          <FormField label="Heading font">
            <Select
              value={theme.headingFont || "Cormorant Garamond"}
              onChange={(e) => setTheme((t) => ({ ...t, headingFont: e.target.value }))}
            >
              {RICH_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Body font">
            <Select
              value={theme.bodyFont || "Inter"}
              onChange={(e) => setTheme((t) => ({ ...t, bodyFont: e.target.value }))}
            >
              {RICH_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Script font">
            <Select
              value={theme.scriptFont || "Cormorant Garamond"}
              onChange={(e) => setTheme((t) => ({ ...t, scriptFont: e.target.value }))}
            >
              {RICH_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Layout</h4>
        <RangeInput
          label="Button radius (px)"
          value={theme.buttonRadius ?? 2}
          min={0}
          max={24}
          step={1}
          onChange={(v) => setTheme((t) => ({ ...t, buttonRadius: v }))}
        />
      </div>

      {saveMutation.isPending && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </div>
      )}
    </SplitEditor>
  );
}
