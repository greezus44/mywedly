import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { Input, RangeInput } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import type { EventOutletContext } from "./event-layout";

interface CoverConfig {
  title?: string;
  subtitle?: string;
  dateText?: string;
  overlayOpacity?: number;
  showDate?: boolean;
  showVenue?: boolean;
  textPosition?: "center" | "bottom" | "top";
}

function parseConfig(json: Json | null | undefined): CoverConfig {
  if (!json || typeof json !== "object") return {};
  return json as CoverConfig;
}

export default function CoverEditor() {
  const { event, eventId } = useOutletContext<EventOutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const existing = parseConfig(event.draft_cover_config ?? event.cover_config);
  const [coverImage, setCoverImage] = useState<string | null>(
    event.draft_cover_image ?? event.cover_image
  );
  const [config, setConfig] = useState<CoverConfig>({
    title: existing.title ?? event.draft_name ?? event.name,
    subtitle: existing.subtitle ?? "",
    overlayOpacity: existing.overlayOpacity ?? 0.4,
    showDate: existing.showDate ?? true,
    showVenue: existing.showVenue ?? true,
    textPosition: existing.textPosition ?? "center",
  });
  const [saved, setSaved] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const previewEvent = {
    ...event,
    cover_image: coverImage,
    cover_config: config as unknown as Json,
    name: config.title ?? event.name,
  };

  const theme = jsonToTheme(event.draft_theme ?? event.theme);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-dash-border bg-dash-surface px-4 py-3">
        <h2 className="text-lg font-semibold text-dash-text">Cover Editor</h2>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <SplitEditor
          editorRatio={0.4}
          editor={
            <div className="space-y-5 p-4">
              <ImageUpload
                label="Cover Image"
                value={coverImage}
                onChange={setCoverImage}
                eventId={eventId}
                aspect="banner"
              />

              <Input
                label="Title"
                value={config.title ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, title: e.target.value })
                }
                placeholder={event.name}
              />

              <Input
                label="Subtitle"
                value={config.subtitle ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, subtitle: e.target.value })
                }
                placeholder="e.g. We're getting married!"
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dash-text">
                  Text Position
                </label>
                <div className="flex gap-2">
                  {(["top", "center", "bottom"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setConfig({ ...config, textPosition: pos })}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                        config.textPosition === pos
                          ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                          : "border-dash-border text-dash-text hover:bg-dash-bg"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <RangeInput
                label="Overlay Opacity"
                value={Math.round((config.overlayOpacity ?? 0.4) * 100)}
                onChange={(v) =>
                  setConfig({ ...config, overlayOpacity: v / 100 })
                }
                min={0}
                max={90}
                step={5}
              />

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-dash-text">
                  <input
                    type="checkbox"
                    checked={config.showDate ?? true}
                    onChange={(e) =>
                      setConfig({ ...config, showDate: e.target.checked })
                    }
                    className="rounded accent-dash-primary"
                  />
                  Show date
                </label>
                <label className="flex items-center gap-2 text-sm text-dash-text">
                  <input
                    type="checkbox"
                    checked={config.showVenue ?? true}
                    onChange={(e) =>
                      setConfig({ ...config, showVenue: e.target.checked })
                    }
                    className="rounded accent-dash-primary"
                  />
                  Show venue
                </label>
              </div>
            </div>
          }
          preview={
            <div className="p-4">
              <EventThemeProvider initialTheme={theme}>
                <CoverPreview event={previewEvent} />
              </EventThemeProvider>
            </div>
          }
        />
      </div>
    </div>
  );
}
