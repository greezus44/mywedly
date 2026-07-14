import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Input, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui";

interface CoverConfig {
  overlayOpacity?: number;
  titleSize?: string;
  textAlign?: string;
  subtitle?: string;
}

export default function CoverEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [coverImage, setCoverImage] = useState<string | null>(
    event.draft_cover_image ?? event.cover_image ?? null
  );
  const [config, setConfig] = useState<CoverConfig>(() => {
    const raw = (event.draft_cover_config ?? event.cover_config ?? {}) as CoverConfig;
    return {
      overlayOpacity: raw.overlayOpacity ?? 0.4,
      titleSize: raw.titleSize ?? "text-4xl",
      textAlign: raw.textAlign ?? "center",
      subtitle: raw.subtitle ?? "",
    };
  });

  useEffect(() => {
    setCoverImage(event.draft_cover_image ?? event.cover_image ?? null);
    const raw = (event.draft_cover_config ?? event.cover_config ?? {}) as CoverConfig;
    setConfig({
      overlayOpacity: raw.overlayOpacity ?? 0.4,
      titleSize: raw.titleSize ?? "text-4xl",
      textAlign: raw.textAlign ?? "center",
      subtitle: raw.subtitle ?? "",
    });
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_cover_image: coverImage,
          draft_cover_config: config as unknown as Json,
        })
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", eventId] });
    },
  });

  const previewEvent = {
    ...event,
    cover_image: coverImage,
    cover_config: config as unknown as Json,
  };

  return (
    <SplitEditor
      editor={
        <div className="space-y-6">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-dash-text">Cover Editor</h2>
            <p className="text-sm text-dash-muted">
              Customize the cover image and overlay text for your website.
            </p>
          </div>

          <ImageUpload
            label="Cover Image"
            value={coverImage}
            onChange={setCoverImage}
            eventId={eventId}
            aspect="16/9"
          />

          <Input
            label="Subtitle"
            value={config.subtitle ?? ""}
            onChange={(e) =>
              setConfig((c) => ({ ...c, subtitle: e.target.value }))
            }
            placeholder="e.g. We're getting married!"
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Title Size
            </label>
            <Select
              value={config.titleSize ?? "text-4xl"}
              onChange={(e) =>
                setConfig((c) => ({ ...c, titleSize: e.target.value }))
              }
            >
              <option value="text-2xl">Small</option>
              <option value="text-4xl">Medium</option>
              <option value="text-5xl">Large</option>
              <option value="text-6xl">Extra Large</option>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Text Alignment
            </label>
            <Select
              value={config.textAlign ?? "center"}
              onChange={(e) =>
                setConfig((c) => ({ ...c, textAlign: e.target.value }))
              }
            >
              <option value="center">Center</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Overlay Opacity: {Math.round((config.overlayOpacity ?? 0.4) * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={config.overlayOpacity ?? 0.4}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  overlayOpacity: Number(e.target.value),
                }))
              }
              className="w-full cursor-pointer accent-dash-primary"
            />
          </div>

          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}
          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Changes saved successfully!</p>
          )}

          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            className="w-full"
          >
            {saveMutation.isPending ? <LoadingSpinner size="sm" /> : "Save Changes"}
          </Button>
        </div>
      }
      preview={
        <div className="p-4">
          <CoverPreview event={previewEvent} className="rounded-lg" />
        </div>
      }
    />
  );
}
