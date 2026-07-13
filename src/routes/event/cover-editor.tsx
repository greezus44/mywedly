import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { EventThemeProvider, useEventTheme } from "../../lib/theme-context";
import { simplifiedToFullTheme, fullToSimplifiedTheme, type ThemeConfig } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { RangeInput } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";

interface CoverConfig {
  subtitle?: string;
  overlayOpacity?: number;
  titleColor?: string;
}

function CoverPreviewWithTheme({ event }: { event: Partial<UserEvent> }) {
  const { theme } = useEventTheme();
  return (
    <div className="p-4">
      <CoverPreview event={event} />
    </div>
  );
}

export default function CoverEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const [coverImage, setCoverImage] = useState<string | null>(
    event.draft_cover_image ?? event.cover_image,
  );
  const [coverConfig, setCoverConfig] = useState<CoverConfig>(
    (event.draft_cover_config ?? event.cover_config ?? {}) as CoverConfig,
  );

  useEffect(() => {
    setCoverImage(event.draft_cover_image ?? event.cover_image);
    setCoverConfig((event.draft_cover_config ?? event.cover_config ?? {}) as CoverConfig);
  }, [event]);

  const previewEvent: Partial<UserEvent> = {
    ...event,
    cover_image: coverImage,
    cover_config: coverConfig as unknown as Json,
  };

  const themeConfig = (event.draft_theme ?? event.theme ?? {}) as unknown as ThemeConfig;
  const fullTheme = Object.keys(themeConfig).length
    ? { ...themeConfig }
    : simplifiedToFullTheme(fullToSimplifiedTheme({} as ThemeConfig));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_cover_image: coverImage,
          draft_cover_config: coverConfig as unknown as Json,
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
    },
  });

  return (
    <SplitEditor
      editorRatio={0.4}
      editor={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-dash-text">Cover Editor</h2>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
            >
              Save Changes
            </Button>
          </div>

          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Saved successfully!</p>
          )}
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}

          <div>
            <ImageUpload
              label="Cover Image"
              value={coverImage}
              onChange={(url: string | null) => setCoverImage(url)}
              eventId={event.id}
              aspect="16/9"
            />
          </div>

          <Input
            label="Subtitle"
            placeholder="e.g. We're getting married!"
            value={coverConfig.subtitle ?? ""}
            onChange={(e) =>
              setCoverConfig({ ...coverConfig, subtitle: e.target.value })
            }
          />

          <RangeInput
            label="Overlay Opacity"
            value={Math.round((coverConfig.overlayOpacity ?? 0.3) * 100)}
            min={0}
            max={100}
            onChange={(v) =>
              setCoverConfig({ ...coverConfig, overlayOpacity: v / 100 })
            }
          />

          <div>
            <label className="block text-sm font-medium text-dash-text mb-1">
              Title Colour
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={coverConfig.titleColor ?? "#ffffff"}
                onChange={(e) =>
                  setCoverConfig({ ...coverConfig, titleColor: e.target.value })
                }
                className="h-9 w-12 cursor-pointer rounded border border-dash-border bg-dash-surface p-0.5"
              />
              <input
                type="text"
                value={coverConfig.titleColor ?? "#ffffff"}
                onChange={(e) =>
                  setCoverConfig({ ...coverConfig, titleColor: e.target.value })
                }
                className="flex-1 rounded-lg border border-dash-border bg-dash-surface px-2.5 py-1.5 text-sm text-dash-text"
              />
            </div>
          </div>
        </div>
      }
      preview={
        <EventThemeProvider initialTheme={fullTheme}>
          <CoverPreviewWithTheme event={previewEvent} />
        </EventThemeProvider>
      }
    />
  );
}
